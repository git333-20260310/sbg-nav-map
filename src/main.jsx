import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const TRILLION = 1_000_000_000_000;
const SHARES = 5_699_000_000;
const CURRENT_DEBT = 8.21;
const OFFICIAL_CURRENT_ASSETS = 48.26;
const OFFICIAL_CURRENT_NAV = 40.06;
const TARGET_YEAR = 2042;
const TARGET_NAV = 1000;
const TARGET_DEBT = 150;
const SCENARIO_VERSION = 2;

const initialBuckets = [
  {
    id: 'arm', label: 'Arm', current: 19.15, future: 300, color: '#2f6fed', status: '報告値',
    description: '2042年目標ケースでは、ASI時代のCPU・IP・クラウド・エッジ・Physical AI基盤として300兆円を仮定します。',
    children: [
      { id: 'arm-ip', label: 'IP / CSS', detail: 'ライセンス・ロイヤルティー' },
      { id: 'arm-agi', label: 'Arm AGI CPU', detail: '自社設計シリコン' },
      { id: 'arm-cloud', label: 'Cloud AI', detail: 'AWS・Google・Microsoft・NVIDIA' },
      { id: 'arm-edge', label: 'Edge AI', detail: 'スマホ・PC・IoT' },
      { id: 'arm-physical', label: 'Physical AI', detail: '自動車・ロボティクス' },
    ],
  },
  {
    id: 'svf2', label: 'SVF2 / OpenAI', current: 17.19, future: 350, color: '#8c4ed8', status: '報告値',
    description: 'OpenAIを中心とするAIモデル・エージェント・ロボティクス投資群を、2042年に350兆円と置く分析仮定です。',
    children: [
      { id: 'openai', label: 'OpenAI', detail: 'AIモデル・ChatGPT・Codex' },
      { id: 'revolut', label: 'Revolut', detail: 'デジタル金融' },
      { id: 'symbotic', label: 'Symbotic', detail: '物流自動化' },
      { id: 'agile', label: 'Agile Robots', detail: 'AIロボティクス' },
      { id: 'skild', label: 'Skild AI', detail: 'ロボット基盤モデル' },
      { id: 'svf2-other', label: 'その他SVF2', detail: '成長投資ポートフォリオ' },
    ],
  },
  {
    id: 'svf1', label: 'SVF1', current: 3.38, future: 50, color: '#ff676a', status: '報告値',
    description: '既存投資先の成長・上場・再投資を含め、2042年に50兆円を残す分析仮定です。',
    children: [
      { id: 'bytedance', label: 'ByteDance', detail: 'コンテンツ・広告' },
      { id: 'coupang', label: 'Coupang', detail: '韓国Eコマース' },
      { id: 'didi', label: 'DiDi', detail: 'モビリティー' },
      { id: 'autostore', label: 'AutoStore', detail: '倉庫自動化' },
      { id: 'svf1-other', label: 'その他SVF1', detail: '残存ポートフォリオ' },
    ],
  },
  {
    id: 'sbkk', label: 'SoftBank Corp.', current: 2.85, future: 50, color: '#62b98f', status: '報告値',
    description: '国内通信、PayPay・LY、AI導入、米国ネオクラウドの成長を合わせ、2042年に50兆円を仮定します。',
    children: [
      { id: 'telecom', label: '通信事業', detail: 'SoftBank・Y!mobile・LINEMO' },
      { id: 'ly', label: 'LY Corporation', detail: 'LINE・Yahoo! JAPAN' },
      { id: 'paypay', label: 'PayPay', detail: '決済・銀行・カード' },
      { id: 'sboai', label: 'SB OAI Japan', detail: '企業向けOpenAI導入' },
      { id: 'sbneo', label: 'SB Neo', detail: '米国ネオクラウド' },
    ],
  },
  {
    id: 'latam', label: 'LatAm', current: 1.04, future: 15, color: '#f5a000', status: '報告値',
    description: '中南米のデジタル経済とIPO・回収再投資を合わせ、2042年に15兆円を仮定します。',
    children: [
      { id: 'rappi', label: 'Rappi', detail: '配送・金融' },
      { id: 'kavak', label: 'Kavak', detail: '中古車流通' },
      { id: 'quinto', label: 'QuintoAndar', detail: '不動産テック' },
      { id: 'latam-other', label: 'その他LatAm', detail: '地域ポートフォリオ' },
    ],
  },
  {
    id: 'other', label: 'その他 / 新規AI', current: 4.61, future: 380, color: '#139d9d', status: '報告値',
    description: 'AI半導体、Physical AI、ロボティクス、電力・データセンター、新規投資を束ねる最大の不確実性枠です。',
    aggregateChildren: true,
    children: [
      { id: 'intel', label: 'Intel', current: 0.61, future: 5, detail: '上場株式', source: '2042分析仮定' },
      { id: 'ampere', label: 'Ampere', current: 1.02, future: 60, detail: 'AIサーバーCPU', source: '2042分析仮定' },
      { id: 'graphcore', label: 'Graphcore', current: null, future: 30, detail: 'AI専用半導体', source: '2042分析仮定' },
      { id: 'robo', label: 'Robo HD / Physical AI', current: 0.73, future: 120, detail: 'ロボティクス投資群', source: '2042分析仮定' },
      { id: 'energy', label: 'Energy Global / SB Energy', current: null, future: 120, detail: '電力・AIデータセンター', source: '2042分析仮定' },
      { id: 'northstar', label: 'SB Northstar', current: 0.96, future: 5, detail: '株式・債券運用', source: '2042分析仮定' },
      { id: 'direct', label: '新規・その他直接保有', current: null, future: 40, detail: '将来の新規投資・未配分', source: '2042分析仮定' },
    ],
  },
  {
    id: 'tmobile', label: 'T-Mobile', current: 0.05, future: 5, color: '#8f98a5', status: '報告値',
    description: '残存持分または再投資効果を含む小口枠として、2042年に5兆円を仮定します。',
    children: [{ id: 'tmus', label: 'T-Mobile US', detail: '残存株式・カラー取引' }],
  },
];

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

function Header({ onReset, onSave, onExport, saved }) {
  return (
    <header className="topbar">
      <div className="brand">SBG NAV MAP</div>
      <div className="asof">基準 2026年3月末 ｜ 目標 {TARGET_YEAR}年</div>
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
        <p>会社目標は2026年6月23日NAV 74兆円の約14倍。マップの現在内訳は3月末40.06兆円、2042年配分は編集可能な分析仮定です。</p>
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
              <small>{child.detail}{child.source ? `・${child.source}` : ''}</small>
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
  const [buckets, setBuckets] = useState(() => savedScenario?.buckets || cloneInitialBuckets());
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
    localStorage.setItem('sbg-nav-scenario', JSON.stringify({ version: SCENARIO_VERSION, targetYear: TARGET_YEAR, buckets, futureDebt, savedAt: new Date().toISOString() }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ version: SCENARIO_VERSION, asOf: '2026-03-31', targetYear: TARGET_YEAR, targetNav: TARGET_NAV, buckets, currentDebt: CURRENT_DEBT, futureDebt, currentNav, futureNav }, null, 2)], { type: 'application/json' });
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
        <footer>
          <p>現在値は2026年3月末の公式NAV。2042年1,000兆円は会社目標、各資産への配分・純負債150兆円・株数固定は分析仮定です。</p>
          <div className="source-links"><a href="https://group.softbank/ir/stock/sotp" target="_blank" rel="noreferrer">公式NAV</a><a href="https://group.softbank/ir/investors/shareholders/2026" target="_blank" rel="noreferrer">2026年株主総会</a></div>
        </footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
