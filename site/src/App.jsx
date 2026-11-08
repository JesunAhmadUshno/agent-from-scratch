import { useMemo, useState, useEffect, useId } from 'react';
import learnTasks from '../../level-1-learn/tasks.json';
import learn from '../../level-1-learn/results_learn.json';
import buildTasks from '../../level-2-build/tasks_build.json';
import build from '../../level-2-build/results_build.json';
import deepTasks from '../../level-3-deep/tasks_deep.json';
import deep from '../../level-3-deep/results_deep.json';
import rounds from '../../level-3-deep/results_deep_rounds.json';
import stats from '../../level-3-deep/results_deep_stats.json';
import crossTasks from '../../level-3-deep/tasks_deep_cross.json';
import cross from '../../level-3-deep/results_deep_cross.json';
import timing from '../../level-3-deep/timing_deep.json';
import readme from '../../README.md?raw';
import report from '../../REPORT.md?raw';
import ciYml from '../../.github/workflows/ci.yml?raw';
import { runLearnTask, BuildAgent, DeepAgent, runDeepMode, summarizeDeep, CONVERSIONS, KB } from './agent.js';
import { wilson, mcnemarExact } from './stats.js';
import { parseVerdict, parseThreats, parseRecorded, parseBacklog, parseCi, countTests } from './docs.js';

const REPO = 'https://github.com/JesunAhmadUshno/agent-from-scratch';
const blob = (p) => `${REPO}/blob/main/${p}`;
const pct = (x, d = 1) => `${(x * 100).toFixed(d)}%`;
const show = (v) => (v === null || v === undefined ? 'none' : typeof v === 'string' ? `"${v}"` : JSON.stringify(v));

// The repo layout test is left out: it is a repo check, not an agent test, and its fixtures quote the old grade lines.
const testCount = countTests(Object.values(import.meta.glob(['../../tests/test_*.py', '!../../tests/test_layout.py'], { query: '?raw', import: 'default', eager: true })));
const verdict = parseVerdict(readme);
const threats = parseThreats(report);
const recorded = parseRecorded(report);
const backlog = parseBacklog(report);
const ci = parseCi(ciYml);
const RECORDED = `recorded run, Python ${recorded.python}, ${recorded.date}`;
const S = deep.summary;
const withById = Object.fromEntries(deep.with_critique.map((r) => [r.task_id, r]));
const withoutById = Object.fromEntries(deep.without_critique.map((r) => [r.task_id, r]));

// Every recorded task in one list for the playground.
const ALL = [
  ...learnTasks.map((t, i) => ({ level: 'Learn', task: t, row: learn.results[i] })),
  ...buildTasks.map((t, i) => ({ level: 'Build', task: t, row: build.results[i] })),
  ...deepTasks.map((t) => ({ level: 'Deep', task: t, row: withById[t.id] })),
];

const SECTIONS = [['top', 'Overview', '◎'], ['loop', 'Learn: the loop', '↻'], ['plan', 'Build: plan', '☰'], ['playground', 'Playground', '▶'],
  ['critic', 'Deep: critic', '✓'], ['errors', 'Error kinds', '⚠'], ['ablation', 'Ablation', '◑'], ['stats', 'Intervals', '±'], ['limits', 'Limits', '⚖'], ['reproduce', 'Reproduce', '❯_']];

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.08 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

function MenuBar() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  return (
    <div className="menubar" role="banner">
      <span className="apple" aria-hidden="true">◆</span>
      <a className="app" href="#top">agent-from-scratch</a>
      <a className="m" href={blob('README.md')}>Abstract</a>
      <a className="m" href={blob('PROPOSAL.md')}>Proposal</a>
      <a className="m" href={blob('REPORT.md')}>Report</a>
      <a className="m" href={blob('CHANGELOG.md')}>Changelog</a>
      <span className="spacer" />
      <span className="status"><i /> {S.outcome_matched} of {S.total} outcomes matched</span>
      <a href={REPO}>GitHub ↗</a>
      <span className="clock">{now.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</span>
    </div>
  );
}

function Dock() {
  const [active, setActive] = useState('top');
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-45% 0px -50% 0px' });
    SECTIONS.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);
  return (
    <nav className="dock" aria-label="Sections">
      {SECTIONS.map(([id, label, icon]) => (
        <a key={id} href={`#${id}`} className={active === id ? 'on' : ''} aria-current={active === id ? 'true' : undefined}>
          <span className="ico" aria-hidden="true">{icon}</span><span className="lbl">{label}</span>
        </a>
      ))}
    </nav>
  );
}

function Range({ label, value, min, max, step, onChange, show: shown }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label} <span>{shown}</span></label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
    </div>
  );
}

function Field({ label, children }) {
  const id = useId();
  return <div className="field"><label htmlFor={id}>{label}</label>{children(id)}</div>;
}

export default function App() {
  useReveal();
  return (
    <div className="wrap">
      <MenuBar />
      <div className="glow" aria-hidden="true" />
      <Hero />
      <Loop />
      <Plan />
      <Playground />
      <Critic />
      <Errors />
      <Ablation />
      <Intervals />
      <Limits />
      <Reproduce />
      <Dock />
      <footer>
        Code: Apache-2.0. Every number on this page is read from the <code>level-*/</code> results files and the repo's own docs at build time.
        The playground runs a JavaScript port of the agents that the build checks against all 60 recorded Python rows.
      </footer>
    </div>
  );
}

function Hero() {
  return (
    <header className="card hero window" id="top" data-title="agent-from-scratch — README.md">
      <div className="head">
        <p className="eyebrow">Three levels · Python standard library · Verdict: {verdict}</p>
        <span className="pill warn">● Errors seeded on purpose</span>
      </div>
      <h1>An agent loop with no framework, and a critic that <em>checks its own work</em>.</h1>
      <p className="sub">
        Prompt, tool call, observe, repeat: built three times, from a single loop to plan-then-execute to self-critique.
        On {S.expected_success_tasks} expected-success tasks a rule-based critic lifts success from {S.succeeded_without_critique} to {S.succeeded_with_critique}, with {S.false_critiques} false alarms on {S.correct_drafts} correct drafts.
        The catch: the {stats.mcnemar.fixed_by_critique} errors it fixes were written into the tasks on purpose, and the critic recomputes from those same task fields.
      </p>
      <p className="sub"><b>The planner and the critic are deterministic code, not language models.</b> They call no API and learn nothing.</p>
      <div className="actions">
        <a className="btn primary" href="#playground">Run the agent in your browser</a>
        <a className="btn ghost" href={blob('REPORT.md')}>Read the report</a>
        <span className="hint">Every task reruns with <code>python level-3-deep/run_deep.py</code></span>
      </div>
      <div className="tiles">
        <div className="tile"><div className="num">{pct(S.success_rate_without_critique)} → {pct(S.success_rate_with_critique, 0)}</div><div className="cap">Success without vs with critique ({S.succeeded_without_critique} → {S.succeeded_with_critique} of {S.expected_success_tasks})</div></div>
        <div className="tile"><div className="num">{S.false_critique_rate.toFixed(1)}</div><div className="cap">False-critique rate ({S.false_critiques} of {S.correct_drafts} correct drafts flagged)</div></div>
        <div className="tile"><div className="num">{S.mean_steps_without_critique.toFixed(2)} → {S.mean_steps_with_critique.toFixed(2)}</div><div className="cap">Mean tool steps per task, the price of checking</div></div>
        <div className="tile"><div className="num">{testCount}</div><div className="cap">Agent unit tests in <code>tests/</code>, counted at build time</div></div>
      </div>
    </header>
  );
}

function LoopDiagram() {
  const nodes = [['task + memory', 'what to do'], ['policy', 'next tool call'], ['tool registry', 'validate, run'], ['observe', 'record result']];
  const W = 760, H = 190, bw = 150, gap = (W - 4 * bw) / 3;
  const x = (i) => i * (bw + gap);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="The agent loop: task, policy picks a tool call, the tool runs, the agent observes, and repeats until no call is left">
      <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--muted)" /></marker></defs>
      {nodes.map(([t, s], i) => (
        <g key={t}>
          <rect x={x(i)} y={30} width={bw} height={64} rx={12} fill="var(--surface-strong)" stroke={i === 1 ? 'var(--primary)' : 'var(--border)'} strokeWidth={i === 1 ? 2 : 1} />
          <text x={x(i) + bw / 2} y={58} textAnchor="middle" style={{ fill: 'var(--text)', fontSize: 14, fontWeight: 600 }}>{t}</text>
          <text x={x(i) + bw / 2} y={78} textAnchor="middle">{s}</text>
          {i < 3 && <line x1={x(i) + bw + 4} x2={x(i + 1) - 6} y1={62} y2={62} stroke="var(--muted)" strokeWidth="1.5" markerEnd="url(#arr)" />}
        </g>
      ))}
      <path d={`M${x(3) + bw / 2} 96 V140 H${x(1) + bw / 2} V100`} fill="none" stroke="var(--primary)" strokeWidth="1.5" markerEnd="url(#arr)" />
      <text x={(x(1) + x(3) + bw) / 2} y={158} textAnchor="middle">repeat until the policy has no call left, or max steps</text>
      <path d={`M${x(1) + bw / 2} 28 V10 H${W - 4}`} fill="none" stroke="var(--good)" strokeWidth="1.5" markerEnd="url(#arr)" />
      <text x={W - 6} y={24} textAnchor="end" style={{ fill: 'var(--good)' }}>no call left → answer</text>
      <text x={x(2) + bw / 2} y={120} textAnchor="middle" style={{ fill: 'var(--bad)' }}>bad argument → one corrected retry</text>
    </svg>
  );
}

function Loop() {
  const s = learn.summary;
  return (
    <section id="loop" className="card window reveal" data-title="agent.py — Level 1 Learn · the loop">
      <div className="head">
        <div>
          <p className="eyebrow">Learn · the core loop</p>
          <h2>One loop, five tools, <em>no framework</em>.</h2>
          <p className="sub">
            A fixed-rule policy reads the task type and emits the next tool call. Tools validate their arguments and raise a named error; the calculator parses arithmetic with Python's <code>ast</code> and never calls <code>eval</code>.
            {' '}{s.passed} of {s.total} labelled tasks matched expectations: {s.succeeded} succeeded, {s.recovered} recovered after a bad argument, and {s.failed_as_expected} failed exactly as designed.
          </p>
        </div>
        <span className="pill good">● {s.passed} / {s.total} matched</span>
      </div>
      <LoopDiagram />
      <div style={{ overflowX: 'auto', marginTop: 16 }}>
        <table>
          <thead><tr><th>Task</th><th>What it asks</th><th>Tools called</th><th>Steps</th><th>Answer</th><th>Result</th></tr></thead>
          <tbody>
            {learn.results.map((r, i) => (
              <tr key={r.task_id}>
                <td className="mono">{r.task_id}</td><td>{learnTasks[i].description}</td><td className="mono">{r.tools_used.join(' → ')}</td><td>{r.steps}</td>
                <td className="mono">{show(r.answer)}</td>
                <td>{r.recovered ? <span className="pill info">recovered</span> : r.success ? <span className="pill good">success</span> : <span className="pill warn">fails by design</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Plan() {
  const [id, setId] = useState('B15');
  const rows = build.results;
  const r = rows.find((x) => x.task_id === id);
  const t = buildTasks.find((x) => x.id === id);
  const counts = useMemo(() => {
    const c = { retry_correct: 0, fallback_tool: 0, skip_step: 0, abort: 0 };
    rows.forEach((x) => x.recoveries.forEach((k) => { c[k] += 1; }));
    return c;
  }, [rows]);
  const exp = rows.filter((x) => x.expected_success);
  const ok = exp.filter((x) => x.success).length;
  const meanSteps = rows.reduce((a, x) => a + x.steps, 0) / rows.length;
  const max = Math.max(...Object.values(counts));
  const W = 460, rowH = 40, H = 4 * rowH + 10, l = 120;
  return (
    <section id="plan" className="card window reveal" data-title="agent_build.py — Level 2 Build · plan, then execute">
      <p className="eyebrow">Build · plan, then execute</p>
      <h2>Write the whole plan first, then <em>recover by error class</em>.</h2>
      <p className="sub">
        The planner emits every step before anything runs. When a step fails, the agent picks one named recovery: retry with corrected arguments, fall back to keyword search, skip an optional step, or abort. At most one replan per task, and memory persists to a JSON file across the suite.
        {' '}On {rows.length} tasks: {ok} of {exp.length} expected-success tasks succeeded, mean {meanSteps.toFixed(2)} steps, all computed from the per-task rows of <a href={blob('level-2-build/results_build.json')}>results_build.json</a>.
      </p>
      <div className="grid2" style={{ marginTop: 16 }}>
        <div>
          <Field label="Inspect a Build task">{(fid) => (
            <select id={fid} value={id} onChange={(e) => setId(e.target.value)}>
              {buildTasks.map((x) => <option key={x.id} value={x.id}>{x.id} · {x.description}</option>)}
            </select>
          )}</Field>
          <ol className="steps" style={{ marginTop: 14 }}>
            {r.plan.map((s) => (
              <li key={s.step}><span className="n">{s.step}</span><div><b className="mono">{s.tool}</b>{s.optional && <span className="pill warn" style={{ marginLeft: 8 }}>optional</span>}<div className="hint">{s.purpose}</div></div></li>
            ))}
          </ol>
          <p className="hint" style={{ marginTop: 12 }}>
            Ran {r.steps} step{r.steps === 1 ? '' : 's'} ({r.tools_used.join(' → ')}){r.recoveries.length ? `, recovery: ${r.recoveries.join(', ')}` : ''}.
            {' '}Answer {show(r.answer)}{t.expected_success ? '' : ' (expected to fail)'} <span className={`pill ${r.passed ? 'good' : 'bad'}`}>{r.passed ? 'matched label' : 'mismatch'}</span>
          </p>
        </div>
        <div>
          <h3>Recovery strategies used across the suite</h3>
          <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Count of each recovery strategy across the 20 Build tasks" style={{ marginTop: 10 }}>
            {Object.entries(counts).map(([k, v], i) => (
              <g key={k} transform={`translate(0 ${i * rowH + 6})`}>
                <text x={0} y={18} style={{ fill: 'var(--text)', fontSize: 12.5 }}>{k}</text>
                <rect x={l} y={4} width={W - l - 30} height={20} rx={6} fill="var(--primary-pale)" />
                <rect x={l} y={4} width={((W - l - 30) * v) / max} height={20} rx={6} fill={k === 'abort' ? 'var(--warn)' : 'var(--primary)'} />
                <text x={W - 4} y={18} textAnchor="end" style={{ fill: 'var(--text)', fontWeight: 700 }}>{v}</text>
              </g>
            ))}
          </svg>
          <p className="hint">The two aborts are the expected failures: division by zero and a recall of a key never stored.</p>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- playground

function describe(e) {
  if (e.phase === 'critique') return { kind: e.passed ? 'good' : e.unfixable ? 'warn' : 'bad', head: `critic, round ${e.round}: ${e.passed ? 'passed' : e.unfixable ? 'unfixable' : 'flagged'}`, body: e.issues.length ? e.issues.join(', ') : 'all checks passed', checks: e.checks };
  if (e.event === 'replan') return { kind: 'warn', head: `replan: ${e.strategy}`, body: `after ${e.tool} failed` };
  if (e.event === 'error') return { kind: 'bad', head: `${e.tool ?? 'agent'} raised an error`, body: e.error, args: e.args };
  return { kind: e.event === 'retry_success' ? 'info' : 'good', head: `${e.tool}${e.event === 'retry_success' ? ' (retry)' : ''}`, body: `→ ${show(e.observation)}`, args: e.args };
}

function Events({ events, upTo, label }) {
  return (
    <div className="events-col">
      <h3>{label}</h3>
      <ol className="events">
        {events.slice(0, upTo).map((e, i) => {
          const d = describe(e);
          return (
            <li key={i} className={`ev ${d.kind}`}>
              <div className="ev-head"><span className="mono">{e.phase && e.phase !== 'critique' ? `${e.phase} · ` : ''}{d.head}</span></div>
              {d.args && <div className="mono ev-args">{JSON.stringify(d.args)}</div>}
              <div className="ev-body">{d.body}</div>
              {d.checks && <ul className="checks">{d.checks.map((c) => <li key={c.name}><span className={c.passed ? 'ok' : 'no'}>{c.passed ? '✓' : '✕'}</span> <span className="mono">{c.name}</span> <span className="hint">expected {show(c.expected)}, observed {show(c.observed)}</span></li>)}</ul>}
            </li>
          );
        })}
        {upTo < events.length && <li className="ev more hint">{events.length - upTo} more event{events.length - upTo === 1 ? '' : 's'}…</li>}
      </ol>
    </div>
  );
}

const recordedEvents = (level, row) => (level === 'Deep'
  ? row.critique_log.map((c) => ({ phase: 'critique', ...c }))
  : row.trace);

function liveRun(level, task, useCritique) {
  if (level === 'Learn') { const r = runLearnTask(task); return { row: r, events: r.trace }; }
  if (level === 'Build') {
    // Build tasks B12 and B13 recall values stored earlier in the same suite run, so replay the suite up to this task.
    const agent = new BuildAgent(20);
    let r;
    for (const t of buildTasks) { r = agent.runTask(t); if (t.id === task.id) break; }
    return { row: r, events: r.trace };
  }
  const r = new DeepAgent().runTask(task, useCritique);
  return { row: r, events: useCritique ? r.events.filter((e) => e.phase === 'critique') : r.events, allEvents: r.events };
}

const CUSTOM_TYPES = {
  calculator: 'Calculate an expression',
  word_count: 'Count words',
  converter: 'Convert units',
  kb_search_task: 'Search the knowledge base',
  lookup: 'Look up a knowledge base key',
  multi_step: 'Calculate, remember, recall',
};

function Playground() {
  const [source, setSource] = useState('recorded');
  const [pick, setPick] = useState(ALL.findIndex((a) => a.task.id === 'D21'));
  const [critiqueOn, setCritiqueOn] = useState(true);
  const [ctype, setCtype] = useState('calculator');
  const [expr, setExpr] = useState('(17 + 4) * 3 - 8 / 2');
  const [draftExpr, setDraftExpr] = useState('(17 + 4) * 3');
  const [text, setText] = useState('a critic recomputes every answer with the tools');
  const [dropWord, setDropWord] = useState(true);
  const [value, setValue] = useState(26.2);
  const [conv, setConv] = useState('miles_to_km');
  const [invert, setInvert] = useState(true);
  const [query, setQuery] = useState('choosing next action from past observations');
  const [key, setKey] = useState('planning');
  const [wrongKey, setWrongKey] = useState('none');
  const [upTo, setUpTo] = useState(99);
  const [result, setResult] = useState(null);

  const inverse = { km_to_miles: 'miles_to_km', miles_to_km: 'km_to_miles', c_to_f: 'f_to_c', f_to_c: 'c_to_f', kg_to_lb: 'lb_to_kg', lb_to_kg: 'kg_to_lb' };
  const customTask = () => {
    const t = { id: 'YOU', category: 'custom', type: ctype, expected_answer: null, expected_success: true };
    if (ctype === 'calculator' || ctype === 'multi_step') { t.expression = expr; if (draftExpr.trim()) Object.assign(t, { draft_error: 'arithmetic_slip', draft_expression: draftExpr }); }
    if (ctype === 'multi_step') { t.memory_key = 'my_result'; delete t.draft_error; delete t.draft_expression; }
    if (ctype === 'word_count') { t.text = text; if (dropWord && text.trim().split(/\s+/).length > 1) Object.assign(t, { draft_error: 'word_count_slip', draft_text: text.trim().split(/\s+/).slice(0, -1).join(' ') }); }
    if (ctype === 'converter') { Object.assign(t, { value, conversion: conv }); if (invert) Object.assign(t, { draft_error: 'unit_inverted', draft_conversion: inverse[conv] }); }
    if (ctype === 'kb_search_task') t.query = query;
    if (ctype === 'lookup') { t.key = key; if (wrongKey !== 'none') Object.assign(t, { draft_error: 'kb_wrong', draft_wrong_key: wrongKey }); }
    return t;
  };

  const run = () => {
    if (source === 'recorded') {
      const a = ALL[pick];
      const live = liveRun(a.level, a.task, critiqueOn || a.level !== 'Deep');
      const rec = a.level === 'Deep' && !critiqueOn ? withoutById[a.task.id] : a.row;
      const fields = ['answer', 'success', 'steps', 'tools_used', 'critique_outcome', 'critique_rounds'].filter((k) => k in rec);
      const matches = fields.every((k) => JSON.stringify(live.row[k]) === JSON.stringify(rec[k]));
      setResult({ kind: 'recorded', a, rec, live, fields, matches, recEvents: a.level === 'Deep' && !critiqueOn ? [] : recordedEvents(a.level, rec) });
      setUpTo(1);
    } else {
      const task = customTask();
      const r = new DeepAgent().runTask(task, true);
      const w = new DeepAgent().runTask(task, false);
      setResult({ kind: 'custom', task, row: r, without: w });
      setUpTo(1);
    }
  };
  useEffect(() => { run(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const a = ALL[pick];
  const total = result ? (result.kind === 'recorded' ? Math.max(result.live.events.length, result.recEvents.length) : result.row.events.length) : 0;
  return (
    <section id="playground" className="card window reveal" data-title="agent_run.js — live in your browser">
      <div className="head">
        <div>
          <p className="eyebrow">Live playground</p>
          <h2>Run the agent here, <em>one event at a time</em>.</h2>
          <p className="sub">
            A JavaScript port of the tools, planner, seeded draft policy and critic runs in this tab. The build re-runs all 60 recorded tasks with it and fails unless every answer, step count, tool list and critique outcome equals the Python results.
            Pick a recorded task to see the live run beside the {RECORDED}, or write your own task and seed a mistake for the critic to catch.
          </p>
        </div>
        <div className="seg" role="group" aria-label="Task source">
          {[['recorded', 'Recorded task'], ['custom', 'Your own task']].map(([k, l]) => <button key={k} aria-pressed={source === k} onClick={() => setSource(k)}>{l}</button>)}
        </div>
      </div>

      {source === 'recorded' ? (
        <div className="controls">
          <Field label="Recorded task (60 across three levels)">{(fid) => (
            <select id={fid} value={pick} onChange={(e) => setPick(+e.target.value)}>
              {['Learn', 'Build', 'Deep'].map((lv) => (
                <optgroup key={lv} label={lv}>
                  {ALL.map((x, i) => x.level === lv && <option key={i} value={i}>{x.task.id} · {x.task.description}</option>)}
                </optgroup>
              ))}
            </select>
          )}</Field>
          {a.level === 'Deep' && <Field label="Self-critique">{(fid) => (
            <select id={fid} value={critiqueOn ? 'on' : 'off'} onChange={(e) => setCritiqueOn(e.target.value === 'on')}>
              <option value="on">With critique (draft, critic, revise)</option><option value="off">Without critique (draft only)</option>
            </select>
          )}</Field>}
        </div>
      ) : (
        <div className="controls">
          <Field label="Task type">{(fid) => (
            <select id={fid} value={ctype} onChange={(e) => setCtype(e.target.value)}>
              {Object.entries(CUSTOM_TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          )}</Field>
          {(ctype === 'calculator' || ctype === 'multi_step') && <Field label="Expression">{(fid) => <input id={fid} className="text" value={expr} onChange={(e) => setExpr(e.target.value)} />}</Field>}
          {ctype === 'calculator' && <Field label="Seeded draft expression (blank = no slip)">{(fid) => <input id={fid} className="text" value={draftExpr} onChange={(e) => setDraftExpr(e.target.value)} />}</Field>}
          {ctype === 'word_count' && <>
            <Field label="Text">{(fid) => <input id={fid} className="text" value={text} onChange={(e) => setText(e.target.value)} />}</Field>
            <Field label="Seeded slip">{(fid) => <select id={fid} value={dropWord ? 'y' : 'n'} onChange={(e) => setDropWord(e.target.value === 'y')}><option value="y">Draft drops the last word</option><option value="n">No slip</option></select>}</Field>
          </>}
          {ctype === 'converter' && <>
            <Field label="Value">{(fid) => <input id={fid} type="number" value={value} onChange={(e) => setValue(e.target.value === '' ? 0 : +e.target.value)} />}</Field>
            <Field label="Conversion">{(fid) => <select id={fid} value={conv} onChange={(e) => setConv(e.target.value)}>{CONVERSIONS.map((c) => <option key={c}>{c}</option>)}</select>}</Field>
            <Field label="Seeded slip">{(fid) => <select id={fid} value={invert ? 'y' : 'n'} onChange={(e) => setInvert(e.target.value === 'y')}><option value="y">Draft inverts the conversion</option><option value="n">No slip</option></select>}</Field>
          </>}
          {ctype === 'kb_search_task' && <Field label="Search words">{(fid) => <input id={fid} className="text" value={query} onChange={(e) => setQuery(e.target.value)} />}</Field>}
          {ctype === 'lookup' && <>
            <Field label="Key">{(fid) => <select id={fid} value={key} onChange={(e) => setKey(e.target.value)}>{Object.keys(KB).map((k) => <option key={k}>{k}</option>)}</select>}</Field>
            <Field label="Seeded slip">{(fid) => <select id={fid} value={wrongKey} onChange={(e) => setWrongKey(e.target.value)}><option value="none">No slip</option>{Object.keys(KB).filter((k) => k !== key).map((k) => <option key={k} value={k}>Draft returns "{k}"</option>)}</select>}</Field>
          </>}
        </div>
      )}
      <div className="actions" style={{ marginTop: 0, marginBottom: 16 }}>
        <button className="btn primary" onClick={run}>Run the agent</button>
        <button className="btn ghost" onClick={() => setUpTo((k) => Math.min(total, k + 1))} disabled={!result || upTo >= total}>Next event</button>
        <button className="btn ghost" onClick={() => setUpTo(total)} disabled={!result || upTo >= total}>Show all</button>
        <span className="hint" aria-live="polite">{result ? `Event ${Math.min(upTo, total)} of ${total}` : ''}</span>
      </div>

      {result?.kind === 'recorded' && (
        <>
          <div className="tiles" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginTop: 0 }}>
            <div className="tile"><div className="num small">{show(result.live.row.answer)}</div><div className="cap">Live answer (recorded {show(result.rec.answer)})</div></div>
            <div className="tile"><div className="num">{result.live.row.steps}</div><div className="cap">Tool steps (recorded {result.rec.steps})</div></div>
            <div className="tile"><div className="num small">{result.live.row.critique_outcome ?? (result.live.row.success ? 'success' : 'failed')}</div><div className="cap">{result.live.row.critique_outcome ? 'Critique outcome' : 'Outcome'}</div></div>
            <div className="tile"><div className={`num small ${result.matches ? 'ok' : 'no'}`}>{result.matches ? 'match' : 'differs'}</div><div className="cap">Live vs recorded on {result.fields.join(', ')}</div></div>
          </div>
          <div className="grid2" style={{ marginTop: 16 }}>
            <Events events={result.live.events} upTo={upTo} label={`Live JavaScript run${result.a.level === 'Deep' && critiqueOn ? ' (critique rounds)' : ''}`} />
            {result.recEvents.length
              ? <Events events={result.recEvents} upTo={upTo} label={`Recorded: ${RECORDED}`} />
              : <div className="events-col"><h3>Recorded: {RECORDED}</h3><p className="hint">The without-critique rows store the draft answer only, not a trace: answer {show(result.rec.answer)}, {result.rec.steps} step{result.rec.steps === 1 ? '' : 's'}, success {String(result.rec.success)}.</p></div>}
          </div>
          {result.a.level === 'Deep' && critiqueOn && <p className="hint">Deep rows record the critique log, so both columns step through critique rounds. The live run also has the draft and revision tool calls: {result.live.allEvents.filter((e) => e.phase !== 'critique').map((e) => `${e.phase} ${e.tool ?? e.event}`).join(', ') || 'none'}.</p>}
        </>
      )}
      {result?.kind === 'custom' && (
        <>
          <div className="tiles" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginTop: 0 }}>
            <div className="tile"><div className="num small">{show(result.row.draft_answer)}</div><div className="cap">Draft answer, no critique</div></div>
            <div className="tile"><div className="num small">{show(result.row.answer)}</div><div className="cap">Final answer after critique</div></div>
            <div className="tile"><div className="num small">{result.row.critique_outcome}</div><div className="cap">Critique outcome, {result.row.critique_rounds} round{result.row.critique_rounds === 1 ? '' : 's'}</div></div>
            <div className="tile"><div className="num">{result.without.steps} → {result.row.steps}</div><div className="cap">Tool steps without vs with critique</div></div>
          </div>
          <div style={{ marginTop: 16 }}><Events events={result.row.events} upTo={upTo} label="Live run: draft, critique, revision" /></div>
          <p className="hint">Your task has no label, so there is no success score, only what the critic found. The critic recomputes from your task fields with the same tools, which is why it catches a seeded slip every time: the same circularity REPORT.md names as its first threat.</p>
        </>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- critic

const OUTCOME_STYLE = { pass: ['var(--good)', 'pass'], flag_then_fix: ['var(--primary)', 'flag, then fix'], flag_then_fix_plan: ['#8a5cf6', 'flag, then fix plan'], flag_unfixable: ['var(--warn)', 'unfixable'] };

function Critic() {
  const [mode, setMode] = useState('with');
  const [sel, setSel] = useState('D21');
  const rows = mode === 'with' ? deep.with_critique : deep.without_critique;
  const expRows = rows.filter((r) => r.expected_success);
  const ok = expRows.filter((r) => r.success).length;
  const mean = rows.reduce((a, r) => a + r.steps, 0) / rows.length;
  const counts = {};
  deep.with_critique.forEach((r) => { counts[r.critique_outcome] = (counts[r.critique_outcome] || 0) + 1; });
  const r = withById[sel], t = deepTasks.find((x) => x.id === sel), wo = withoutById[sel];
  const color = (row) => {
    if (mode === 'with') return OUTCOME_STYLE[row.critique_outcome][0];
    if (!row.expected_success) return 'var(--muted)';
    return row.success ? 'var(--good)' : 'var(--bad)';
  };
  return (
    <section id="critic" className="card window reveal" data-title="critic.py — Level 3 Deep · self-critique">
      <div className="head">
        <div>
          <p className="eyebrow">Deep · draft, critique, revise</p>
          <h2>The critic recomputes every answer <em>from scratch</em>.</h2>
          <p className="sub">
            Each task gets a draft. On {S.critique_target_tasks} critique-target tasks a seeded draft policy makes a named slip. The critic never reads the draft answer as its source: it re-plans, recomputes with the tools, re-checks memory, then allows at most {S.max_critique_rounds} critique rounds (one clean re-run).
            Toggle to see the same {S.total} tasks with and without it. Click a task to open its critique log.
          </p>
        </div>
        <div className="seg" role="group" aria-label="Critique mode">
          {[['without', 'Without critique'], ['with', 'With critique']].map(([k, l]) => <button key={k} aria-pressed={mode === k} onClick={() => setMode(k)}>{l}</button>)}
        </div>
      </div>
      <div className="tiles" style={{ marginTop: 0 }}>
        <div className="tile"><div className="num">{ok} / {expRows.length}</div><div className="cap">Expected-success tasks solved {mode} critique</div></div>
        <div className="tile"><div className="num">{mean.toFixed(2)}</div><div className="cap">Mean tool steps per task</div></div>
        <div className="tile"><div className="num">{S.critique_rounds_distribution['1']} · {S.critique_rounds_distribution['2']}</div><div className="cap">Tasks that needed 1 · 2 critique rounds</div></div>
        <div className="tile"><div className="num">{S.total_revisions}</div><div className="cap">Revisions run, all clean re-runs</div></div>
      </div>
      <div className="task-grid" role="group" aria-label="Deep tasks, coloured by outcome" style={{ marginTop: 18 }}>
        {rows.map((row) => (
          <button key={row.task_id} className={`task ${sel === row.task_id ? 'sel' : ''}`} style={{ '--c': color(row) }} aria-pressed={sel === row.task_id} onClick={() => setSel(row.task_id)} title={deepTasks.find((x) => x.id === row.task_id).description}>
            {row.task_id}
          </button>
        ))}
      </div>
      <div className="legend">
        {mode === 'with'
          ? Object.entries(OUTCOME_STYLE).map(([k, [c, l]]) => <span key={k}><i style={{ background: c }} />{l} ({counts[k] || 0})</span>)
          : [['var(--good)', 'solved'], ['var(--bad)', 'wrong answer'], ['var(--muted)', 'expected failure']].map(([c, l]) => <span key={l}><i style={{ background: c }} />{l}</span>)}
      </div>
      <div className="tile" style={{ marginTop: 16 }}>
        <div className="head" style={{ marginBottom: 6 }}>
          <h3><span className="mono">{sel}</span> · {t.description}</h3>
          <span className="pill info">{t.category}{t.draft_error ? ` · ${t.draft_error}` : ''}</span>
        </div>
        <p className="hint" style={{ margin: '0 0 8px' }}>Draft answer {show(wo.answer)} → final answer {show(r.answer)}. Expected {show(t.expected_answer)}. Outcome <b>{r.critique_outcome}</b> after {r.critique_rounds} round{r.critique_rounds === 1 ? '' : 's'}, {wo.steps} → {r.steps} steps.</p>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr><th>Round</th><th>Check</th><th>Expected</th><th>Observed</th><th>Verdict</th></tr></thead>
            <tbody>
              {r.critique_log.flatMap((c) => c.checks.map((k) => (
                <tr key={`${c.round}-${k.name}`}><td>{c.round}</td><td className="mono">{k.name}</td><td className="mono clip">{show(k.expected)}</td><td className="mono clip">{show(k.observed)}</td><td className={k.passed ? 'ok' : 'no'}>{k.passed ? 'pass' : 'flag'}</td></tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Errors() {
  const kinds = useMemo(() => {
    const m = {};
    deepTasks.filter((t) => t.draft_error).forEach((t) => {
      const k = (m[t.draft_error] ||= { tasks: [], r1: 0, r2: 0, fixed: 0, wrongWithout: 0 });
      const w = withById[t.id];
      k.tasks.push(t.id);
      k[w.critique_rounds === 1 ? 'r1' : 'r2'] += 1;
      if (w.success) k.fixed += 1;
      if (!withoutById[t.id].success) k.wrongWithout += 1;
    });
    return Object.entries(m).sort((a, b) => b[1].tasks.length - a[1].tasks.length);
  }, []);
  const max = Math.max(...kinds.map(([, v]) => v.tasks.length));
  const W = 960, rowH = 38, H = kinds.length * rowH + 24, l = 170, r = 220;
  const x = (n) => l + ((W - l - r) * n) / max;
  return (
    <section id="errors" className="card window reveal" data-title="tasks_deep.json — seeded error taxonomy">
      <p className="eyebrow">Error taxonomy</p>
      <h2>Six kinds of slip, each <em>written into a task</em>.</h2>
      <p className="sub">
        Counted from the <code>draft_error</code> field of <a href={blob('level-3-deep/tasks_deep.json')}>tasks_deep.json</a>, joined with each task's recorded critique rounds.
        Every seeded slip is caught in round 1 and confirmed fixed in round 2. The plan-incomplete draft has the right answer but skipped two steps, so it never counted as a failure without critique.
        Overall: {S.critique_rounds_distribution['1']} tasks needed one round, {S.critique_rounds_distribution['2']} needed two.
      </p>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Seeded draft error kinds by number of tasks, split into wrong without critique and fixed with critique" style={{ marginTop: 14 }}>
        {kinds.map(([k, v], i) => (
          <g key={k} transform={`translate(0 ${i * rowH})`}>
            <text x={0} y={22} style={{ fill: 'var(--text)', fontSize: 13 }} className="mono">{k}</text>
            <rect x={l} y={8} width={x(v.tasks.length) - l} height={20} rx={6} fill="var(--primary-pale)" />
            <rect x={l} y={8} width={x(v.wrongWithout) - l} height={20} rx={6} fill="var(--bad)" opacity="0.75" />
            <text x={x(v.tasks.length) + 8} y={22} style={{ fill: 'var(--text)' }}>{v.tasks.length} · {v.tasks.join(', ')}</text>
          </g>
        ))}
        <text x={l} y={H - 4}>bar length: tasks seeded with this kind · red: wrong without critique</text>
      </svg>
      <div style={{ overflowX: 'auto', marginTop: 12 }}>
        <table>
          <thead><tr><th>Slip kind</th><th>Tasks</th><th>Wrong without critique</th><th>Fixed with critique</th><th>Critique rounds</th></tr></thead>
          <tbody>
            {kinds.map(([k, v]) => <tr key={k}><td className="mono">{k}</td><td>{v.tasks.length}</td><td>{v.wrongWithout}</td><td className="ok">{v.fixed}</td><td>{v.r1 ? `${v.r1}× one round` : ''}{v.r2 ? `${v.r2}× two rounds` : ''}</td></tr>)}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- ablation, variants, cross-task

function Ablation() {
  const [r, setR] = useState(2);
  const live = useMemo(() => summarizeDeep(runDeepMode(deepTasks, r > 0, { maxRounds: r }), deepTasks), [r]);
  const rec = rounds.rounds[r];
  const same = live.succeeded === rec.succeeded && live.total_steps === rec.total_steps;
  const keys = Object.keys(rounds.rounds);
  const W = 460, H = 210, pad = { l: 40, r: 40, t: 14, b: 28 };
  const bx = (i) => pad.l + i * ((W - pad.l - pad.r) / keys.length);
  const bw = (W - pad.l - pad.r) / keys.length - 18;
  const sy = (v) => pad.t + (1 - v) * (H - pad.t - pad.b);
  const my = (v) => pad.t + (1 - v / 2.5) * (H - pad.t - pad.b);
  const rv = rounds.revision;
  const cw = cross.with_critique, co = cross.without_critique;
  return (
    <section id="ablation" className="card window reveal" data-title="analyze_deep.py — rounds, revision, shared memory">
      <div className="head">
        <div>
          <p className="eyebrow">Ablation · new in this release</p>
          <h2>The gain comes from the <em>second round</em>, not the first.</h2>
          <p className="sub">
            The round bound was never varied before. Slide it: the page re-runs all {deepTasks.length} tasks with the JavaScript agent at that bound, and the Python run in <a href={blob('level-3-deep/results_deep_rounds.json')}>results_deep_rounds.json</a> sits beside it.
            With one round the critic flags {rounds.rounds['1'].outcomes.flag_still_failing} drafts but has no recheck left to accept a revision, so success stays at {rounds.rounds['1'].succeeded} of {rounds.rounds['1'].expected_success_tasks}. A third round adds nothing on this suite.
          </p>
        </div>
        <span className={`pill ${same ? 'good' : 'bad'}`}>● live {same ? 'matches' : 'differs from'} Python</span>
      </div>
      <div className="grid2">
        <div>
          <Range label="Max critique rounds" value={r} min={0} max={3} step={1} onChange={setR} show={r === 0 ? '0 (no critique)' : r} />
          <div className="tiles" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 8 }}>
            <div className="tile"><div className="num">{live.succeeded} / {live.expected_success_tasks}</div><div className="cap">Solved, live in your browser (Python: {rec.succeeded})</div></div>
            <div className="tile"><div className="num">{live.mean_steps.toFixed(2)}</div><div className="cap">Mean steps, live (Python: {rec.mean_steps.toFixed(2)})</div></div>
          </div>
          <h3 style={{ marginTop: 18 }}>Targeted versus clean revision</h3>
          <p className="hint" style={{ marginTop: 4 }}>
            A targeted revision runs only the plan steps a draft skipped. It saves {rv.clean.total_steps - rv.targeted.total_steps} of {rv.clean.total_steps} total steps ({rv.clean.mean_steps.toFixed(2)} → {rv.targeted.mean_steps.toFixed(4)} per task) with the same {rv.targeted.succeeded} of {rv.targeted.expected_success_tasks} solved:
            every other seeded slip sits in the step that produces the answer, so fixing it already means a full re-run.
          </p>
        </div>
        <div>
          <h3>Python run by bound: success (bars) and mean steps (line)</h3>
          <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Success rate and mean steps for max critique rounds 0 to 3" style={{ marginTop: 8 }}>
            {[0, 0.5, 1].map((v) => <g key={v}><line className="axis" x1={pad.l} x2={W - pad.r} y1={sy(v)} y2={sy(v)} /><text x={pad.l - 6} y={sy(v) + 4} textAnchor="end">{pct(v, 0)}</text></g>)}
            {[0, 1, 2].map((v) => <text key={v} x={W - pad.r + 6} y={my(v) + 4}>{v}</text>)}
            {keys.map((k, i) => (
              <g key={k}>
                <rect x={bx(i) + 9} width={bw} y={sy(rounds.rounds[k].success_rate)} height={sy(0) - sy(rounds.rounds[k].success_rate)} rx={6} fill={+k === r ? 'var(--primary)' : 'var(--primary-pale)'} />
                <text x={bx(i) + 9 + bw / 2} y={sy(rounds.rounds[k].success_rate) - 6} textAnchor="middle" style={{ fill: 'var(--text)' }}>{pct(rounds.rounds[k].success_rate)}</text>
                <text x={bx(i) + 9 + bw / 2} y={H - 8} textAnchor="middle">{k} round{k === '1' ? '' : 's'}</text>
              </g>
            ))}
            <polyline fill="none" stroke="var(--warn)" strokeWidth="2.5" points={keys.map((k, i) => `${bx(i) + 9 + bw / 2},${my(rounds.rounds[k].mean_steps)}`).join(' ')} />
            {keys.map((k, i) => <circle key={k} cx={bx(i) + 9 + bw / 2} cy={my(rounds.rounds[k].mean_steps)} r="4" fill="var(--warn)" />)}
          </svg>
          <p className="hint">Right axis: mean tool steps per task (orange).</p>
        </div>
      </div>
      <h3 style={{ marginTop: 22 }}>Memory shared across tasks ({crossTasks.length}-task suite, <a href={blob('level-3-deep/tasks_deep_cross.json')}>tasks_deep_cross.json</a>)</h3>
      <p className="hint" style={{ marginTop: 4 }}>
        The main suite resets memory per task. Here memory carries over. Without critique the stale value left by X03 leaks into X04 and then into X05, a later task with no seeded error at all: {co.summary.succeeded} of {co.summary.expected_success_tasks} solved.
        With critique: {cw.summary.succeeded} of {cw.summary.expected_success_tasks}, and the revision clears only its own key, so X06 still recalls what X01 stored.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr><th>Task</th><th>What it does</th><th>Without critique</th><th>With critique</th><th>Outcome</th></tr></thead>
          <tbody>
            {crossTasks.map((t, i) => (
              <tr key={t.id}><td className="mono">{t.id}</td><td>{t.description}</td>
                <td className={co.rows[i].success ? 'ok' : 'no'}>{show(co.rows[i].answer)}</td>
                <td className={cw.rows[i].success ? 'ok' : 'no'}>{show(cw.rows[i].answer)}</td>
                <td className="mono">{cw.rows[i].critique_outcome}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 style={{ marginTop: 22 }}>Wall-clock time beside step counts</h3>
      <p className="hint" style={{ marginTop: 4 }}>
        Median of {timing.repeats} timed runs per task, then averaged over tasks: {timing.mean_of_medians_us_without_critique} µs without critique, {timing.mean_of_medians_us_with_critique} µs with it
        ({(timing.mean_of_medians_us_with_critique / timing.mean_of_medians_us_without_critique).toFixed(1)}× the time for {(S.mean_steps_with_critique / S.mean_steps_without_critique).toFixed(2)}× the steps, because the critic's recompute is not counted as a step).
        Measured once on Python {timing.python}, {timing.machine}, memory in-process, in <a href={blob('level-3-deep/timing_deep.json')}>timing_deep.json</a>; it varies by machine.
      </p>
    </section>
  );
}

function Intervals() {
  const [n, setN] = useState(stats.n);
  const [k0, setK0] = useState(stats.without.k);
  const [k1, setK1] = useState(stats.with.k);
  const [b, setB] = useState(stats.mcnemar.fixed_by_critique);
  const [c, setC] = useState(stats.mcnemar.broken_by_critique);
  const K0 = Math.min(k0, n), K1 = Math.min(k1, n);
  const w0 = wilson(K0, n), w1 = wilson(K1, n);
  const p = mcnemarExact(b, c);
  const isRepo = n === stats.n && K0 === stats.without.k && K1 === stats.with.k && b === stats.mcnemar.fixed_by_critique && c === stats.mcnemar.broken_by_critique;
  const W = 460, H = 130, l = 120, r = 16;
  const x = (v) => l + v * (W - l - r);
  const num = (label, val, set, max) => <Field label={label}>{(fid) => <input id={fid} type="number" min={0} max={max} value={val} onChange={(e) => set(Math.max(0, Math.min(max, Math.round(+e.target.value || 0))))} />}</Field>;
  return (
    <section id="stats" className="card window reveal" data-title="intervals.js — Wilson and McNemar">
      <p className="eyebrow">Uncertainty · new in this release</p>
      <h2>Significant on paper, <em>narrow in meaning</em>.</h2>
      <p className="sub">
        Wilson 95% intervals for each success rate and an exact McNemar test on the paired tasks, computed live from the counts. With {stats.n} tasks, a perfect {stats.with.k} of {stats.n} only rules out rates below {pct(stats.with.wilson95[0])}, and the {stats.mcnemar.fixed_by_critique} discordant pairs all point one way.
        {' '}{stats.caveat}
      </p>
      <div className="grid2" style={{ marginTop: 12 }}>
        <div>
          <div className="controls" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            {num('Paired tasks (n)', n, setN, 1000)}
            {num('Solved without critique', k0, setK0, 1000)}
            {num('Solved with critique', k1, setK1, 1000)}
            {num('Fixed by critique (b)', b, setB, 500)}
            {num('Broken by critique (c)', c, setC, 500)}
            <div className="field"><span className="hint">{isRepo ? 'Repo counts from results_deep_stats.json.' : 'Your counts.'}</span> <button className="btn ghost" style={{ marginTop: 6 }} onClick={() => { setN(stats.n); setK0(stats.without.k); setK1(stats.with.k); setB(stats.mcnemar.fixed_by_critique); setC(stats.mcnemar.broken_by_critique); }}>Reset to repo</button></div>
          </div>
        </div>
        <div>
          <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Wilson 95 percent intervals for success without and with critique">
            {[0, 0.25, 0.5, 0.75, 1].map((v) => <g key={v}><line className="axis" x1={x(v)} x2={x(v)} y1={8} y2={H - 22} /><text x={x(v)} y={H - 6} textAnchor="middle">{pct(v, 0)}</text></g>)}
            {[['Without critique', K0, w0, 'var(--bad)'], ['With critique', K1, w1, 'var(--good)']].map(([lab, k, w, col], i) => (
              <g key={lab} transform={`translate(0 ${32 + i * 42})`}>
                <text x={0} y={4} style={{ fill: 'var(--text)', fontSize: 12.5 }}>{lab}</text>
                <line x1={x(w[0])} x2={x(w[1])} y1={0} y2={0} stroke={col} strokeWidth="6" strokeLinecap="round" opacity="0.45" />
                <circle cx={x(k / n)} cy={0} r="6" fill={col} />
              </g>
            ))}
          </svg>
          <div className="tiles" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 8 }}>
            <div className="tile"><div className="num small">{pct(w0[0])} – {pct(w0[1])}</div><div className="cap">Without: {K0} / {n}, Wilson 95%</div></div>
            <div className="tile"><div className="num small">{pct(w1[0])} – {pct(w1[1])}</div><div className="cap">With: {K1} / {n}, Wilson 95%</div></div>
            <div className="tile" style={{ gridColumn: '1 / -1' }}><div className="num small">p = {p < 0.001 ? p.toExponential(2) : p.toFixed(4)}</div><div className="cap">Exact two-sided McNemar on {b} fixed vs {c} broken pairs{isRepo ? ` (Python: ${stats.mcnemar.p_exact_two_sided.toExponential(2)})` : ''}</div></div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- limits and reproduce

const BACKLOG_STATUS = {
  1: ['open', 'Needs a language model or stochastic planner'],
  2: ['partial', 'The JavaScript port is a second implementation, but written from the Python code'],
  3: ['done', 'Targeted revision measured above'],
  4: ['done', 'Six-task shared-memory suite above'],
  5: ['partial', 'Wall-clock timing added; the knowledge base is still five entries'],
  6: ['partial', 'Taxonomy table on this page and in REPORT.md'],
  7: ['done', 'Rounds 0 to 3 measured above'],
};

function Limits() {
  return (
    <section id="limits" className="card window reveal" data-title="REPORT.md — threats to validity">
      <p className="eyebrow">Honest limits</p>
      <h2>What this does <em>not</em> show.</h2>
      <p className="sub">
        {threats.length} named threats, largest first, quoted from <a href={blob('REPORT.md')}>REPORT.md</a>.
        The first is the one that matters most: the critic is scored on errors built for it.
      </p>
      <ol style={{ marginTop: 16 }}>
        {threats.map((t) => <li key={t}>{t}</li>)}
      </ol>
      <h3 style={{ marginTop: 24 }}>The v1.1 backlog from <a href={blob('REPORT.md')}>REPORT.md</a>, and where this release leaves it</h3>
      <div style={{ overflowX: 'auto', marginTop: 8 }}>
        <table>
          <thead><tr><th>#</th><th>Backlog item</th><th>Status</th><th>Why</th></tr></thead>
          <tbody>
            {backlog.map((b) => {
              const [st, why] = BACKLOG_STATUS[b.n] || ['open', ''];
              return <tr key={b.n}><td>{b.n}</td><td><b>{b.title}</b>{b.detail ? `: ${b.detail}` : ''}</td><td><span className={`pill ${st === 'done' ? 'good' : st === 'partial' ? 'warn' : 'bad'}`}>{st}</span></td><td className="hint">{why}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Reproduce() {
  const docs = [
    ['README.md', 'Abstract', 'Question, headline, verdict, reproduce'],
    ['PROPOSAL.md', 'Proposal', 'Scope and plans as committed (not pre-registered)'],
    ['REPORT.md', 'Report', 'Every stage, threats, research review, backlog'],
    ['CHANGELOG.md', 'Changelog', 'Releases and changes'],
    ['docs/decisions/', 'Decisions', 'Hard-to-reverse choices'],
  ];
  return (
    <section id="reproduce" className="card window reveal" data-title="Terminal — .github/workflows/ci.yml">
      <p className="eyebrow">Reproduce it</p>
      <h2>No dependencies, <em>no randomness</em>, same bytes every run.</h2>
      <p className="sub">These are the exact steps CI runs on Python {ci.versions.join(' and ')}, read from the workflow file. The runners write no timestamps, and the last step fails if any results file changes.</p>
      <ol className="steps" style={{ marginTop: 16 }}>
        <li><span className="n">0</span><div><b>Clone</b><div className="hint"><code>git clone {REPO}.git && cd agent-from-scratch</code></div></div></li>
        {ci.steps.map((s, i) => (
          <li key={s.name}><span className="n">{i + 1}</span><div><b>{s.name}</b><div className="hint">{s.run.map((line) => <div key={line}><code>{line}</code></div>)}</div></div></li>
        ))}
      </ol>
      <div className="docs" style={{ marginTop: 20 }}>
        {docs.map(([p, t, d]) => <a key={p} href={blob(p)}><b>{t}</b><small>{d}</small></a>)}
      </div>
      <p className="hint" style={{ marginTop: 16 }}>Releases: <a href={`${REPO}/releases`}>{REPO.replace('https://', '')}/releases</a></p>
    </section>
  );
}
