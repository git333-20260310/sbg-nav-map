import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import navData from './data/nav-data.json';

const TRILLION = 1_000_000_000_000;
const { reported, period, scenario, sources } = navData;
const SHARES = reported.shares;
const CURRENT_DEBT = reported.netDebt;
const OFFICIAL_CURRENT_ASSETS = reported.assets;
const OFFICIAL_CURRENT_NAV = reported.nav;
const TARGET_YEAR = scenario.targetYear;
const TARGET_NAV = scenario.targetNav;
const TARGET_DEBT = scenario.targetDebt;
const SCENARIO_VERSION = scenario.version;
const initialBuckets = navData.buckets;

function Icon({ name, size = 18 }) {
  const paths = {
    reset: <><path d="M4 4v5h5"/><path d="M5.5 9A7 7 0 1 1 6 16"/></>,
    save: <><path d="M4 3h13l3 3v15H4z"/><path d="M8 3v6h8V3"/><path d="M8 21v-7h8v7"/></>,
    chevron: <path d="m7 10 5 5 5-5"/>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7h.01"/></>,
    plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    minus: <path d="M5 12h14"/>,
    download: <><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const format = (value) => Number(value || 0).toFixed(2);
const money = (value) => `${format(value)}兆円`;
const perShare = (nav) => Math.round((nav * TRILLION) / SHARES).toLocaleString('ja-JP');
const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const cloneInitialBuckets = () => initialBuckets.map((bucket) => ({ ...bucket, children: bucket.children.map((child) => ({ ...child })) }));
const dateJa = (iso) => new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' }).format(new Date(`${iso}T00:00:00+09:00`));
const hydrateScenario = (saved) => cloneInitialBuckets().map((bucket) => ({
  ...bucket,
  future: saved?.futureByBucket?.[bucket.id] ?? bucket.future,
  aggregateChildren: saved?.aggregateByBucket?.[bucket.id] ?? bucket.aggregateChildren,
  children: bucket.children.map((child) => ({
    ...child,
    future: saved?.futureByChild?.[child.id] ?? child.future,
  })),
}));

function Header({ onReset, onSave, onExport, saved }) {
  return (
    <header className="topbar">
      <div className="brand">SBG NAV MAP</div>
      <div className="asof">基準 {period.asOfLabel} ｜ 目標 {TARGET_YEAR}年</div>
      <div className="top-actions">
        {saved && <span className="saved-message" role="status">保存しました</span>}
        <button className="button secondary" onClick={onExport}><Icon name="download"/>JSON</button>
        <button className="button secondary" onClick={onReset}><Icon name="reset"/>2042目標に戻す</button>
        <button className="button primary" onClick={onSave}><Icon name="save"/>シナリオを保存</button>
      </div>
    </header>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong className={tone || ''}>{value}</strong>
    </div>
  );
}

function Summary({ currentNav, futureNav }) {
  const delta = futureNav - currentNav;
  return (
    <section className="intro">
      <div className="intro-copy">
        <h1>2042年NAV 1,000兆円を、枝から逆算する。</h1>
        <p>{period.periodLabel || period.label}の公式NAVは{money(currentNav)}。現在値と2042年の編集可能な分析仮定を、同じマップで比較します。</p>
      </div>
      <div className="metrics" aria-label="NAVサマリー">
        <Metric label="現在NAV" value={money(currentNav)} />
        <Metric label={`${TARGET_YEAR}年NAV`} value={money(futureNav)} tone="violet" />
        <Metric label="増減" value={`${delta >= 0 ? '+' : ''}${format(delta)}兆円`} tone={delta >= 0 ? 'green' : 'red'} />
        <Metric label="1株NAV（株数固定）" value={`${perShare(futureNav)}円`} />
      </div>
    </section>
  );
}

function DisclosureStrip() {
  const source = sources[reported.sourceId];
  return (
    <section className="disclosure-strip" aria-label="データ基準">
      <div><span>データセット</span><strong>{period.label}</strong></div>
      <div><span>基準日</span><strong>{dateJa(period.asOf)}</strong></div>
      <div><span>発表日</span><strong>{dateJa(period.announcementDate)}</strong></div>
      <div><span>LTV</span><strong>{format(reported.ltvPercent)}%</strong></div>
      <a href={source.url} target="_blank" rel="noreferrer">一次資料を開く ↗</a>
    </section>
  );
}

function ModeSwitch({ mode, onChange }) {
  return (
    <div className="mode-block">
      <span>表示モード</span>
      <div className="segmented">
        {[['current','現在'],['future','将来'],['delta','差分']].map(([id, label]) => (
          <button key={id} className={mode === id ? 'active' : ''} onClick={() => onChange(id)}>{label}</button>
        ))}
      </div>
    </div>
  );
}

function displayNodeValue(node, mode) {
  if (mode === 'current') return money(node.current ?? 0);
  if (mode === 'future') return money(node.future ?? 0);
  const delta = (node.future ?? 0) - (node.current ?? 0);
  return `${delta >= 0 ? '+' : ''}${format(delta)}兆円`;
}

function MindNode({ bucket, selected, mode, onSelect, style }) {
  return (
    <button
      className={`mind-node ${selected ? 'selected' : ''}`}
      style={{ ...style, '--node-color': bucket.color }}
      onClick={() => onSelect(bucket.id)}
      aria-pressed={selected}
    >
      <span className="node-dot" />
      <span className="node-label">{bucket.label}</span>
      <span className="node-value">{displayNodeValue(bucket, mode)}</span>
      <Icon name="chevron" size={16}/>
    </button>
  );
}

function ChildNode({ child, color, mode, style }) {
  const hasValues = child.current !== undefined || child.future !== undefined;
  return (
    <div className="child-node" style={{ ...style, '--node-color': color }}>
      <span className="node-dot" />
      <span className="child-copy"><strong>{child.label}</strong><small>{child.detail}</small></span>
      <span className="node-value">{hasValues ? displayNodeValue(child, mode) : '価値内訳非開示'}</span>
    </div>
  );
}

function ConnectorLayer({ selected, childCount }) {
  const mainYs = [94, 166, 238, 310, 382, 454, 526];
  const selectedY = mainYs[selected];
  const childStart = Math.max(76, 304 - ((childCount - 1) * 62) / 2);
  return (
    <svg className="connectors" viewBox="0 0 1080 620" preserveAspectRatio="none" aria-hidden="true">
      {initialBuckets.map((bucket, index) => (
        <path key={bucket.id} d={`M 82 310 C 138 310, 142 ${mainYs[index]}, 190 ${mainYs[index]}`} stroke={bucket.color}/>
      ))}
      {Array.from({ length: childCount }, (_, index) => {
        const y = childStart + index * 62;
        return <path key={index} d={`M 500 ${selectedY} C 610 ${selectedY}, 600 ${y}, 700 ${y}`} stroke={initialBuckets[selected].color}/>;
      })}
    </svg>
  );
}

function MindMap({ buckets, selectedId, onSelect, mode, zoom, onZoom }) {
  const selectedIndex = buckets.findIndex((b) => b.id === selectedId);
  const selected = buckets[selectedIndex];
  const mainYs = [72, 144, 216, 288, 360, 432, 504];
  const childStart = Math.max(54, 282 - ((selected.children.length - 1) * 62) / 2);
  return (
    <div className="map-shell">
      <div className="map-scroll">
        <div className="map-canvas" style={{ transform: `scale(${zoom})`, transformOrigin: 'left top' }}>
          <ConnectorLayer selected={selectedIndex} childCount={selected.children.length}/>
          <button className="root-node" onClick={() => onSelect(selectedId)}>SBG 9984</button>
          {buckets.map((bucket, index) => (
            <MindNode key={bucket.id} bucket={bucket} selected={bucket.id === selectedId} mode={mode} onSelect={onSelect} style={{ left: 190, top: mainYs[index] }}/>
          ))}
          {selected.children.map((child, index) => (
            <ChildNode key={child.id} child={child} color={selected.color} mode={mode} style={{ left: 700, top: childStart + index * 62 }}/>
          ))}
        </div>
      </div>
      <div className="zoom-controls" aria-label="表示倍率">
        <button onClick={() => onZoom(Math.min(1.18, zoom + 0.08))} aria-label="拡大"><Icon name="plus"/></button>
        <button onClick={() => onZoom(Math.max(0.76, zoom - 0.08))} aria-label="縮小"><Icon name="minus"/></button>
        <span>{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}

function NumberInput({ value, onChange, ariaLabel }) {
  return <input className="number-input" type="number" min="0" step="0.01" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))} aria-label={ariaLabel}/>;
}

function Inspector({ bucket, onFutureChange, onChildChange, onToggleAggregate }) {
  const ratio = bucket.current ? bucket.future / bucket.current : 0;
  const childSum = bucket.children.reduce((sum, child) => sum + Number(child.future || 0), 0);
  const canAggregate = bucket.children.some((child) => child.future !== undefined);
  const rangeMax = Math.max(30, bucket.current * 3, Number(bucket.future || 0) * 1.25);
  return (
    <aside className="inspector">
      <div className="inspector-heading">
        <h2>将来価値を編集</h2>
        <span className="selected-name"><i style={{ background: bucket.color }}/>{bucket.label}</span>
        <p>{bucket.description}</p>
        {bucket.sourceId && <a className="inline-source" href={sources[bucket.sourceId].url} target="_blank" rel="noreferrer">現在値の出典：{sources[bucket.sourceId].label} ↗</a>}
      </div>
      <div className="value-editor">
        <div className="editor-label"><span>{TARGET_YEAR}年価値（兆円・分析仮定）</span><span>現在比 <strong>{ratio.toFixed(2)}×</strong></span></div>
        <NumberInput value={bucket.future} onChange={onFutureChange} ariaLabel={`${bucket.label}の将来価値`}/>
        <input className="range" style={{ '--range-color': bucket.color }} type="range" min="0" max={rangeMax} step="0.01" value={bucket.future} onChange={(e) => onFutureChange(Number(e.target.value))}/>
        <div className="range-scale"><span>0</span><span>{format(rangeMax / 2)}</span><span>{format(rangeMax)}</span></div>
      </div>
      <div className="children-header">
        <h3>傘下・投資先</h3>
        {canAggregate && (
          <label className="toggle-label">
            <span>子項目から集計</span>
            <input type="checkbox" checked={Boolean(bucket.aggregateChildren)} onChange={(e) => onToggleAggregate(e.target.checked)}/>
            <i/>
          </label>
        )}
      </div>
      <div className="child-list">
        {bucket.children.map((child) => (
          <div className="child-row" key={child.id}>
            <i className="child-bullet" style={{ background: bucket.color }}/>
            <div className="child-meta">
              <strong>{child.label}</strong>
              <small>{child.detail}{child.valueType ? `・${child.valueType}` : ''}</small>
              {child.current !== undefined && <small>現在 {child.current === null ? '非開示' : money(child.current)}</small>}
            </div>
            {child.future !== undefined && <NumberInput value={child.future} onChange={(value) => onChildChange(child.id, value)} ariaLabel={`${child.label}の将来価値`}/>} 
          </div>
        ))}
      </div>
      {canAggregate && (
        <div className="aggregate-note">
          <Icon name="info" size={17}/>
          <span>入力済みの子項目合計は<strong>{money(childSum)}</strong>です。2042年の内訳は会社開示ではなく分析仮定です。</span>
        </div>
      )}
    </aside>
  );
}

function SourceLedger() {
  return (
    <section className="source-ledger">
      <div className="source-ledger-heading">
        <div>
          <span className="eyebrow">SOURCE OF TRUTH</span>
          <h2>現在値・基準日・出典</h2>
        </div>
        <code>src/data/nav-data.json</code>
      </div>
      <div className="source-grid">
        {Object.entries(sources).map(([id, source]) => (
          <a className="source-card" href={source.url} target="_blank" rel="noreferrer" key={id}>
            <span>{source.publisher} ｜ {dateJa(source.publishedAt)}</span>
            <strong>{source.label}</strong>
            <small>{source.pages} ｜ {source.note}</small>
          </a>
        ))}
      </div>
      <p>現在値は公式開示、子項目の「算出参考値」は公式開示額を期末為替で換算した補助情報です。個別非開示の項目は0とはみなしていません。</p>
    </section>
  );
}

function Equation({ label, assets, debt, nav, editableDebt, onDebtChange, future }) {
  return (
    <div className="equation-group">
      <h3>{label}</h3>
      <div className="equation">
        <div className="eq-box aqua"><span>保有資産</span><strong>{format(assets)}</strong><small>兆円</small></div>
        <b>−</b>
        <div className="eq-box rose">
          <span>{future ? `${TARGET_YEAR}年純負債` : '純負債'}</span>
          {editableDebt ? <NumberInput value={debt} onChange={onDebtChange} ariaLabel="将来純負債"/> : <strong>{format(debt)}</strong>}
          <small>兆円</small>
        </div>
        <b>=</b>
        <div className={`eq-box ${future ? 'future' : ''}`}><span>{future ? `${TARGET_YEAR}年NAV` : '現在NAV'}</span><strong>{format(nav)}</strong><small>兆円</small></div>
      </div>
    </div>
  );
}

function NavEquation({ currentAssets, futureAssets, futureDebt }) {
  return (
    <section className="equation-band">
      <Equation label="現在（報告値ベース）" assets={currentAssets} debt={CURRENT_DEBT} nav={currentAssets - CURRENT_DEBT} />
      <div className="equation-divider" />
      <Equation label="将来（シナリオベース）" assets={futureAssets} debt={futureDebt} nav={futureAssets - futureDebt} editableDebt onDebtChange={() => {}} future />
      <div className="legend">
        <span><i className="reported"/>報告値</span>
        <span><i className="input"/>入力値</span>
        <span><i className="calculated"/>自動計算</span>
      </div>
    </section>
  );
}

function App() {
  const savedScenario = useMemo(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('sbg-nav-scenario'));
      return saved?.version === SCENARIO_VERSION ? saved : null;
    } catch { return null; }
  }, []);
  const [buckets, setBuckets] = useState(() => hydrateScenario(savedScenario));
  const [futureDebt, setFutureDebt] = useState(savedScenario?.futureDebt ?? TARGET_DEBT);
  const [selectedId, setSelectedId] = useState('other');
  const [mode, setMode] = useState('future');
  const [zoom, setZoom] = useState(1);
  const [saved, setSaved] = useState(false);
  const currentAssets = buckets.reduce((sum, item) => sum + item.current, 0);
  const futureAssets = buckets.reduce((sum, item) => sum + Number(item.future || 0), 0);
  const currentNav = OFFICIAL_CURRENT_NAV;
  const futureNav = futureAssets - futureDebt;
  const selected = buckets.find((bucket) => bucket.id === selectedId);

  const updateBucket = (id, updater) => setBuckets((items) => items.map((item) => item.id === id ? updater(item) : item));
  const changeFuture = (value) => updateBucket(selectedId, (bucket) => ({ ...bucket, future: Number(value || 0), aggregateChildren: false }));
  const changeChild = (childId, value) => updateBucket(selectedId, (bucket) => {
    const children = bucket.children.map((child) => child.id === childId ? { ...child, future: value } : child);
    const future = bucket.aggregateChildren ? round2(children.reduce((sum, child) => sum + Number(child.future || 0), 0)) : bucket.future;
    return { ...bucket, children, future };
  });
  const toggleAggregate = (checked) => updateBucket(selectedId, (bucket) => ({
    ...bucket,
    aggregateChildren: checked,
    future: checked ? round2(bucket.children.reduce((sum, child) => sum + Number(child.future || 0), 0)) : bucket.future,
  }));
  const reset = () => {
    localStorage.removeItem('sbg-nav-scenario');
    setBuckets(cloneInitialBuckets());
    setFutureDebt(TARGET_DEBT);
    setMode('future');
  };
  const save = () => {
    const futureByBucket = Object.fromEntries(buckets.map((bucket) => [bucket.id, bucket.future]));
    const aggregateByBucket = Object.fromEntries(buckets.map((bucket) => [bucket.id, Boolean(bucket.aggregateChildren)]));
    const futureByChild = Object.fromEntries(buckets.flatMap((bucket) => bucket.children.filter((child) => child.future !== undefined).map((child) => [child.id, child.future])));
    localStorage.setItem('sbg-nav-scenario', JSON.stringify({ version: SCENARIO_VERSION, datasetId: navData.datasetId, targetYear: TARGET_YEAR, futureByBucket, aggregateByBucket, futureByChild, futureDebt, savedAt: new Date().toISOString() }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ version: SCENARIO_VERSION, datasetId: navData.datasetId, asOf: period.asOf, sourceId: reported.sourceId, targetYear: TARGET_YEAR, targetNav: TARGET_NAV, buckets, currentAssets: OFFICIAL_CURRENT_ASSETS, currentDebt: CURRENT_DEBT, futureDebt, currentNav, futureNav }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'sbg-nav-scenario.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      <Header onReset={reset} onSave={save} onExport={exportJson} saved={saved}/>
      <main>
        <Summary currentNav={OFFICIAL_CURRENT_NAV} futureNav={futureNav}/>
        <DisclosureStrip/>
        <ModeSwitch mode={mode} onChange={setMode}/>
        <div className="workspace">
          <MindMap buckets={buckets} selectedId={selectedId} onSelect={setSelectedId} mode={mode} zoom={zoom} onZoom={setZoom}/>
          <Inspector bucket={selected} onFutureChange={changeFuture} onChildChange={changeChild} onToggleAggregate={toggleAggregate}/>
        </div>
        <section className="equation-band">
          <Equation label="現在（報告値ベース）" assets={OFFICIAL_CURRENT_ASSETS} debt={CURRENT_DEBT} nav={OFFICIAL_CURRENT_NAV}/>
          <div className="equation-divider"/>
          <Equation label={`${TARGET_YEAR}年（目標達成シナリオ）`} assets={futureAssets} debt={futureDebt} nav={futureNav} editableDebt onDebtChange={setFutureDebt} future/>
          <div className="legend">
            <span><i className="reported"/>報告値</span>
            <span><i className="input"/>入力値</span>
            <span><i className="calculated"/>自動計算</span>
          </div>
        </section>
        <SourceLedger/>
        <footer>
          <p>現在値は{period.asOfLabel}の公式NAV。2042年1,000兆円は会社目標、資産配分・純負債150兆円・株数固定は分析仮定です。データ更新 {dateJa(navData.updatedAt)}</p>
          <div className="source-links"><a href={sources['official-nav-page'].url} target="_blank" rel="noreferrer">公式NAV</a><a href={sources['agm-2026'].url} target="_blank" rel="noreferrer">2026年株主総会</a></div>
        </footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
