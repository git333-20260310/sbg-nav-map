import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'src/data/nav-data.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const errors = [];
const warnings = [];
const required = (value, label) => {
  if (value === undefined || value === null || value === '') errors.push(`${label} is required`);
};

required(data.datasetId, 'datasetId');
required(data.period?.asOf, 'period.asOf');
required(data.period?.announcementDate, 'period.announcementDate');
required(data.reported?.sourceId, 'reported.sourceId');

const sources = data.sources || {};
const checkSource = (sourceId, label) => {
  if (sourceId && !sources[sourceId]) errors.push(`${label} references unknown sourceId: ${sourceId}`);
};
checkSource(data.reported?.sourceId, 'reported');
checkSource(data.scenario?.sourceId, 'scenario');

const ids = new Set();
for (const bucket of data.buckets || []) {
  required(bucket.id, 'bucket.id');
  required(bucket.label, `${bucket.id}.label`);
  required(bucket.current, `${bucket.id}.current`);
  checkSource(bucket.sourceId, bucket.id);
  if (ids.has(bucket.id)) errors.push(`duplicate bucket id: ${bucket.id}`);
  ids.add(bucket.id);
  for (const child of bucket.children || []) checkSource(child.sourceId, `${bucket.id}.${child.id}`);
}

const bucketTotal = (data.buckets || []).reduce((sum, bucket) => sum + Number(bucket.current || 0), 0);
const navFromEquation = Number(data.reported?.assets) - Number(data.reported?.netDebt);
const scenarioAssets = (data.buckets || []).reduce((sum, bucket) => sum + Number(bucket.future || 0), 0);
const scenarioNav = scenarioAssets - Number(data.scenario?.targetDebt);

if (Math.abs(navFromEquation - Number(data.reported?.nav)) > 0.011) {
  errors.push(`reported NAV does not tie: assets - netDebt = ${navFromEquation.toFixed(2)}`);
}
if (Math.abs(bucketTotal - Number(data.reported?.assets)) > 0.02) {
  errors.push(`bucket total ${bucketTotal.toFixed(2)} differs from reported assets ${Number(data.reported?.assets).toFixed(2)} by more than rounding tolerance`);
} else if (Math.abs(bucketTotal - Number(data.reported?.assets)) > 0.001) {
  warnings.push(`bucket total ${bucketTotal.toFixed(2)} vs official assets ${Number(data.reported?.assets).toFixed(2)} (rounding difference)`);
}
if (Math.abs(scenarioNav - Number(data.scenario?.targetNav)) > 0.011) {
  errors.push(`default scenario does not reach target NAV: ${scenarioNav.toFixed(2)}`);
}

for (const warning of warnings) console.warn(`WARN: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}
console.log(`OK: ${data.datasetId} | NAV ${Number(data.reported.nav).toFixed(2)}兆円 | ${data.buckets.length} buckets | ${Object.keys(sources).length} sources`);
