// A JavaScript port of the three Python agents, so the page can run them live.
// Sources: level-1-learn/agent.py (tools, KB, Learn loop), level-2-build/agent_build.py
// (unit_converter, kb_search, Planner, plan-then-execute agent), level-3-deep/agent_deep.py
// (seeded draft policy, Critic, bounded revision) and the three run_*.py summaries.
// agent.check.mjs re-runs all 60 recorded tasks with this file and asserts the rows equal
// results_*.json, so this is a cross-implementation check of the Python code, written from it.
// Rules here are deterministic code, not a model: no network, no randomness.

export class ToolError extends Error {}
const own = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
const isStr = (v) => typeof v === 'string';
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

export const KB = {
  agent: 'An agent is a system that perceives, plans, and acts using tools to complete a task.',
  tool: 'A tool is a named function an agent can call with validated arguments.',
  memory: 'Memory is a store an agent uses to save and recall information across steps.',
  planning: 'Planning is choosing the next action based on the task and past observations.',
  loop: 'A loop repeats plan, act, and observe until the task is done or a limit is reached.',
};

// ---------------------------------------------------------------- calculator
// Python's calculator walks an ast. Here a tiny recursive-descent parser accepts the same
// arithmetic subset (+ - * / // % ** and unary +/-) with Python's precedence and
// floor/modulo semantics, and never evaluates code.
function tokenize(src) {
  const out = [];
  const re = /\s*(?:(\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)|(\*\*|\/\/|[-+*/%()]))/y;
  let i = 0;
  while (i < src.length) {
    if (/^\s*$/.test(src.slice(i))) break;
    re.lastIndex = i;
    const m = re.exec(src);
    if (!m) {
      const rest = src.slice(i).trim();
      if (/^[A-Za-z_]/.test(rest)) throw new ToolError('calculator: unsupported expression element: Name');
      if (/^['"]/.test(rest)) throw new ToolError('calculator: only numeric constants are allowed');
      throw new ToolError(`calculator: invalid syntax near '${rest.slice(0, 12)}'`);
    }
    out.push(m[1] !== undefined ? { num: Number(m[1]) } : { op: m[2] });
    i = re.lastIndex;
  }
  return out;
}

function evaluate(src) {
  const t = tokenize(src);
  let p = 0;
  const peek = () => t[p]?.op;
  const fail = () => { throw new ToolError('calculator: invalid syntax'); };
  const bin = (op, a, b) => {
    if ((op === '/' || op === '//' || op === '%') && b === 0) throw new ToolError('calculator: division by zero');
    if (op === '+') return a + b;
    if (op === '-') return a - b;
    if (op === '*') return a * b;
    if (op === '/') return a / b;
    if (op === '//') return Math.floor(a / b);
    if (op === '%') return a - b * Math.floor(a / b);
    return a ** b;
  };
  function expr() {
    let v = term();
    while (peek() === '+' || peek() === '-') v = bin(t[p++].op, v, term());
    return v;
  }
  function term() {
    let v = unary();
    while (['*', '/', '//', '%'].includes(peek())) v = bin(t[p++].op, v, unary());
    return v;
  }
  function unary() {
    if (peek() === '-') { p++; return -unary(); }
    if (peek() === '+') { p++; return +unary(); }
    return power();
  }
  function power() {
    const base = atom();
    if (peek() === '**') { p++; return bin('**', base, unary()); }
    return base;
  }
  function atom() {
    const tok = t[p++];
    if (!tok) fail();
    if (tok.num !== undefined) return tok.num;
    if (tok.op === '(') { const v = expr(); if (t[p++]?.op !== ')') fail(); return v; }
    return fail();
  }
  const v = expr();
  if (p !== t.length) fail();
  if (!Number.isFinite(v)) throw new ToolError('calculator: result is not a finite number');
  return v === 0 ? 0 : v; // Python's int(-0.0) is 0
}

// ---------------------------------------------------------------- tools (Learn + Build)
const TOOLS = {
  calculator(args) {
    if (!args || typeof args !== 'object' || !own(args, 'expression')) throw new ToolError("calculator: missing argument 'expression'");
    const e = args.expression;
    if (!isStr(e) || !e.trim()) throw new ToolError("calculator: 'expression' must be a non-empty string");
    return evaluate(e);
  },
  kb_lookup(args) {
    if (!args || !own(args, 'key')) throw new ToolError("kb_lookup: missing argument 'key'");
    const k = args.key;
    if (!isStr(k) || !k) throw new ToolError("kb_lookup: 'key' must be a non-empty string");
    if (!own(KB, k)) throw new ToolError(`kb_lookup: no entry for key '${k}'`);
    return KB[k];
  },
  word_count(args) {
    if (!args || !own(args, 'text')) throw new ToolError("word_count: missing argument 'text'");
    if (!isStr(args.text)) throw new ToolError("word_count: 'text' must be a string");
    const s = args.text.trim();
    return s ? s.split(/\s+/).length : 0;
  },
  remember(args, memory) {
    if (!args || !own(args, 'key') || !own(args, 'value')) throw new ToolError("remember: requires 'key' and 'value'");
    if (!isStr(args.key) || !args.key) throw new ToolError("remember: 'key' must be a non-empty string");
    memory[args.key] = args.value;
    return args.value;
  },
  recall(args, memory) {
    if (!args || !own(args, 'key')) throw new ToolError("recall: missing argument 'key'");
    if (!isStr(args.key) || !args.key) throw new ToolError("recall: 'key' must be a non-empty string");
    if (!own(memory, args.key)) throw new ToolError(`recall: no value stored for key '${args.key}'`);
    return memory[args.key];
  },
  unit_converter(args) {
    if (!args || !own(args, 'value') || !own(args, 'conversion')) throw new ToolError("unit_converter: requires 'value' and 'conversion'");
    const v = args.value, c = args.conversion;
    if (!isNum(v)) throw new ToolError("unit_converter: 'value' must be a number");
    if (!CONVERSIONS.includes(c)) throw new ToolError(`unit_converter: unknown conversion '${c}'`);
    const r = c === 'km_to_miles' ? v / 1.609344 : c === 'miles_to_km' ? v * 1.609344 : c === 'c_to_f' ? v * 9 / 5 + 32
      : c === 'f_to_c' ? (v - 32) * 5 / 9 : c === 'kg_to_lb' ? v / 0.45359237 : v * 0.45359237;
    const rounded = Number(r.toFixed(10)); // Python round(result, 10)
    return rounded === 0 ? 0 : rounded;
  },
  kb_search(args) {
    if (!args || !own(args, 'query')) throw new ToolError("kb_search: missing argument 'query'");
    if (!isStr(args.query) || !args.query.trim()) throw new ToolError("kb_search: 'query' must be a non-empty string");
    const q = tokens(args.query);
    let best = null, score = 0;
    for (const [k, v] of Object.entries(KB)) {
      const tv = tokens(v);
      const s = [...q].filter((w) => tv.has(w)).length;
      if (s > score) { score = s; best = k; }
    }
    if (best === null) throw new ToolError('kb_search: no matching entry for query');
    return best;
  },
};
export const CONVERSIONS = ['km_to_miles', 'miles_to_km', 'c_to_f', 'f_to_c', 'kg_to_lb', 'lb_to_kg'];
const tokens = (s) => new Set(s.toLowerCase().match(/[a-z0-9]+/g) || []);
const LEARN_TOOLS = ['calculator', 'kb_lookup', 'word_count', 'remember', 'recall'];

export function callTool(name, args, memory, allowed = null) {
  if (!own(TOOLS, name) || (allowed && !allowed.includes(name))) throw new ToolError(`unknown tool: '${name}'`);
  return TOOLS[name](args, memory);
}
const newMemory = () => Object.create(null);

// ---------------------------------------------------------------- Level 1 Learn
function learnNextCall(task, completed, last) {
  const t = task.type;
  const once = (call) => (completed === 0 ? call : null);
  if (t === 'calculator' || t === 'unrecoverable') return once(['calculator', { expression: task.expression }]);
  if (t === 'lookup') return once(['kb_lookup', { key: task.key }]);
  if (t === 'word_count') return once(['word_count', { text: task.text }]);
  if (t === 'recovery') return once(['calculator', task.bad_args]);
  if (t === 'memory') {
    if (completed === 0) return ['remember', { key: task.memory_key, value: task.memory_value }];
    if (completed === 1) return ['recall', { key: task.memory_key }];
    return null;
  }
  if (t === 'multi_step') {
    if (completed === 0) return ['calculator', { expression: task.expression }];
    if (completed === 1) return ['remember', { key: task.memory_key, value: last }];
    if (completed === 2) return ['recall', { key: task.memory_key }];
    return null;
  }
  throw new ToolError(`unknown task type: '${t}'`);
}

export function runLearnTask(task, maxSteps = 10) {
  const memory = newMemory(), trace = [], toolsUsed = [];
  let completed = 0, last = null, answer = null, recovered = false, steps = 0;
  const result = (success, ans, error) => {
    const r = { task_id: task.id ?? null, type: task.type ?? null, success, answer: ans,
      expected_answer: task.expected_answer ?? null, expected_success: task.expected_success ?? null,
      steps, tools_used: toolsUsed, recovered, trace };
    r.passed = success === (task.expected_success ?? null) && (!success || ans === (task.expected_answer ?? null));
    if (error != null) r.error = error;
    return r;
  };
  while (steps < maxSteps) {
    let call;
    try { call = learnNextCall(task, completed, last); } catch (e) {
      trace.push({ step: steps + 1, event: 'error', error: e.message });
      return result(false, null, e.message);
    }
    if (call === null) return result(true, answer, null);
    const [tool, args] = call;
    steps += 1; toolsUsed.push(tool);
    let obs;
    try { obs = callTool(tool, args, memory, LEARN_TOOLS); } catch (e) {
      if (!(e instanceof ToolError)) throw e;
      trace.push({ step: steps, event: 'error', tool, args, error: e.message });
      if (steps >= maxSteps) break;
      const [rTool, rArgs] = task.type === 'recovery' ? ['calculator', task.corrected_args] : call;
      steps += 1; toolsUsed.push(rTool);
      try { obs = callTool(rTool, rArgs, memory, LEARN_TOOLS); } catch (e2) {
        if (!(e2 instanceof ToolError)) throw e2;
        trace.push({ step: steps, event: 'error', tool: rTool, args: rArgs, error: e2.message });
        return result(false, null, e2.message);
      }
      recovered = true;
      trace.push({ step: steps, event: 'retry_success', tool: rTool, args: rArgs, observation: obs });
      last = obs; answer = obs; completed += 1;
      continue;
    }
    trace.push({ step: steps, event: 'observe', tool, args, observation: obs });
    last = obs; answer = obs; completed += 1;
  }
  if (completed > 0 && learnNextCall(task, completed, last) === null) return result(true, answer, null);
  return result(false, null, 'max_steps exceeded');
}

// ---------------------------------------------------------------- Level 2 Build
const step = (tool, purpose, args, optional = false) => ({ tool, purpose, args, optional });

export function plan(task) {
  const t = task.type;
  const calc = step('calculator', 'compute the expression', { expression: task.expression });
  const conv = step('unit_converter', 'convert the value', { value: task.value, conversion: task.conversion });
  const recallStored = (what) => step('recall', `recall the stored ${what}`, { key: task.memory_key });
  switch (t) {
    case 'calculator': case 'unrecoverable': return [calc];
    case 'lookup': return [step('kb_lookup', 'look up the knowledge base entry', { key: task.key })];
    case 'word_count': return [step('word_count', 'count the words in the text', { text: task.text })];
    case 'memory': return [step('remember', 'store the value in memory', { key: task.memory_key, value: task.memory_value }), recallStored('value')];
    case 'memory_write': return [step('remember', 'store the value in persistent memory', { key: task.memory_key, value: task.memory_value })];
    case 'recall_persist': return [step('recall', 'recall a value stored by an earlier task', { key: task.memory_key })];
    case 'multi_step': return [calc, step('remember', 'store the computed result', { key: task.memory_key, value: '$prev' }), recallStored('result')];
    case 'converter': return [conv];
    case 'kb_search_task': return [step('kb_search', 'search the knowledge base by keywords', { query: task.query })];
    case 'search_then_lookup': return [step('kb_search', 'find the best matching entry key', { query: task.query }), step('kb_lookup', 'look up the entry found by search', { key: '$prev' })];
    case 'convert_memory': return [conv, step('remember', 'store the converted value', { key: task.memory_key, value: '$prev' }), recallStored('converted value')];
    case 'count_memory': return [step('word_count', 'count the words in the text', { text: task.text }), step('remember', 'store the word count', { key: task.memory_key, value: '$prev' }), recallStored('word count')];
    case 'recovery_retry': return [step('calculator', 'compute with the supplied arguments', task.bad_args)];
    case 'recovery_fallback': return [step('kb_lookup', 'look up the requested entry', { key: task.key })];
    case 'recovery_skip': return [step('kb_lookup', 'optional lookup before the main step', { key: task.key }, true), step('calculator', 'compute the main expression', { expression: task.expression })];
    default: throw new ToolError(`unknown task type: '${t}'`);
  }
}

const ARG_HINTS = ['missing argument', 'must be', 'requires', 'only numeric'];
const resolve = (args, last) => Object.fromEntries(Object.entries(args).map(([k, v]) => [k, v === '$prev' ? last : v]));

function chooseStrategy(task, st, err, replans) {
  if (replans >= 1) return 'abort';
  const low = err.toLowerCase();
  if (st.optional) return 'skip_step';
  if (low.includes('division by zero')) return 'abort';
  if (st.tool === 'kb_lookup' && low.includes('no entry') && task.fallback_query) return 'fallback_tool';
  if (task.corrected_args && ARG_HINTS.some((h) => low.includes(h))) return 'retry_correct';
  return 'abort';
}

export class BuildAgent {
  constructor(maxSteps = 20) { this.maxSteps = maxSteps; this.memory = newMemory(); }

  runTask(task) {
    const base = (p) => ({ task_id: task.id ?? null, type: task.type ?? null, category: task.category ?? null, plan: p });
    const passed = (r) => r.success === r.expected_success && (!r.success || r.answer === r.expected_answer);
    let p;
    try { p = plan(task); } catch (e) {
      const r = { ...base([]), success: false, answer: null, steps: 0, tools_used: [], recovered: false, replans: 0,
        recoveries: [], trace: [{ event: 'error', error: e.message }], error: e.message };
      r.passed = passed(r);
      return r;
    }
    const stored = p.map((s, i) => ({ ...s, step: i + 1 }));
    const current = p.map((s) => ({ ...s }));
    const trace = [], toolsUsed = [], recoveries = [];
    let replans = 0, steps = 0, last = null, answer = null, idx = 0;
    const finish = (success, ans, error) => {
      const r = { ...base(stored), success, answer: ans, expected_answer: task.expected_answer ?? null,
        expected_success: task.expected_success ?? null, steps, tools_used: toolsUsed,
        recovered: success && recoveries.some((x) => x !== 'abort'), replans, recoveries, trace };
      r.passed = passed(r);
      if (error != null) r.error = error;
      return r;
    };
    while (idx < current.length) {
      if (steps >= this.maxSteps) return finish(false, null, 'max_steps exceeded');
      const st = current[idx];
      const args = resolve(st.args, last);
      steps += 1; toolsUsed.push(st.tool);
      let obs;
      try { obs = callTool(st.tool, args, this.memory); } catch (e) {
        if (!(e instanceof ToolError)) throw e;
        trace.push({ step: steps, event: 'error', tool: st.tool, args, error: e.message });
        const strategy = chooseStrategy(task, st, e.message, replans);
        recoveries.push(strategy);
        if (strategy === 'abort') return finish(false, null, e.message);
        replans += 1;
        trace.push({ step: steps, event: 'replan', strategy, tool: st.tool });
        if (strategy === 'skip_step') { idx += 1; continue; }
        if (strategy === 'retry_correct') { current[idx] = step(st.tool, `${st.purpose} (corrected arguments)`, task.corrected_args, st.optional ?? false); continue; }
        current[idx] = step('kb_search', 'fallback keyword search for the entry', { query: task.fallback_query }, st.optional ?? false);
        continue;
      }
      trace.push({ step: steps, event: 'observe', tool: st.tool, args, observation: obs });
      last = obs; answer = obs; idx += 1;
    }
    return finish(true, answer, null);
  }
}

// ---------------------------------------------------------------- Level 3 Deep
export const MAX_CRITIQUE_ROUNDS = 2;
const WRITES_MEMORY = ['multi_step', 'convert_memory', 'count_memory', 'memory_write'];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function independentExpected(task, snap) {
  const t = task.type, m = newMemory();
  if (t === 'calculator' || t === 'unrecoverable' || t === 'multi_step') return callTool('calculator', { expression: task.expression }, m);
  if (t === 'word_count' || t === 'count_memory') return callTool('word_count', { text: task.text }, m);
  if (t === 'converter' || t === 'convert_memory') return callTool('unit_converter', { value: task.value, conversion: task.conversion }, m);
  if (t === 'lookup') return callTool('kb_lookup', { key: task.key }, m);
  if (t === 'kb_search_task') return callTool('kb_search', { query: task.query }, m);
  if (t === 'search_then_lookup') return callTool('kb_lookup', { key: callTool('kb_search', { query: task.query }, m) }, m);
  if (t === 'memory_write') return task.memory_value;
  if (t === 'recall_persist') {
    if (!own(snap, task.memory_key)) throw new ToolError(`recall: no value stored for key '${task.memory_key}'`);
    return snap[task.memory_key];
  }
  throw new ToolError(`unknown task type: '${t}'`);
}

export function critique(task, draft, snap) {
  const checks = [], issues = [];
  let expectedTools = null;
  try { expectedTools = plan(task).map((s) => s.tool); } catch { expectedTools = null; }
  if (expectedTools !== null) {
    const draftTools = (draft.plan || []).map((s) => s.tool);
    const ok = same(draftTools, expectedTools);
    checks.push({ name: 'plan_completeness', passed: ok, expected: expectedTools, observed: draftTools });
    if (!ok) issues.push('plan_incomplete');
  }
  let expected;
  try { expected = independentExpected(task, snap); } catch (e) {
    if (!(e instanceof ToolError)) throw e;
    checks.push({ name: 'independent_recompute', passed: false, expected: null, observed: e.message });
    const unfixable = !draft.success;
    if (!unfixable) issues.push('recompute_failed_but_draft_claimed_success');
    return { passed: false, unfixable, checks, issues: unfixable ? [`unfixable: ${e.message}`] : issues, expected: null };
  }
  const observed = draft.answer ?? null;
  checks.push({ name: 'independent_recompute', passed: true, expected, observed });
  const answerOk = !!draft.success && observed === expected;
  checks.push({ name: 'answer_match', passed: answerOk, expected, observed });
  if (!answerOk) issues.push('answer_mismatch');
  const key = task.memory_key;
  if (key && WRITES_MEMORY.includes(task.type)) {
    if (own(snap, key)) {
      const ok = snap[key] === expected;
      checks.push({ name: 'memory_consistency', passed: ok, expected, observed: snap[key] });
      if (!ok) issues.push('memory_stale_or_wrong');
    } else {
      checks.push({ name: 'memory_consistency', passed: false, expected, observed: null });
      issues.push('memory_missing');
    }
  }
  return { passed: checks.every((c) => c.passed), unfixable: false, checks, issues, expected };
}

const draftPlan = (task, truncated = false) => (truncated ? plan(task).slice(0, 1) : plan(task)).map((s, i) => ({ ...s, step: i + 1 }));

function flawedAnswer(task, agent) {
  const k = task.draft_error, m = agent.memory;
  if (k === 'arithmetic_slip') return [callTool('calculator', { expression: task.draft_expression }, m), 'calculator'];
  if (k === 'unit_inverted') return [callTool('unit_converter', { value: task.value, conversion: task.draft_conversion }, m), 'unit_converter'];
  if (k === 'kb_wrong') return [callTool('kb_lookup', { key: task.draft_wrong_key }, m), 'kb_lookup'];
  if (k === 'stale_memory') {
    if (!own(m, task.memory_key)) throw new ToolError(`recall: no value stored for key '${task.memory_key}'`);
    return [m[task.memory_key], 'recall'];
  }
  if (k === 'word_count_slip') return [callTool('word_count', { text: task.draft_text }, m), 'word_count'];
  if (k === 'plan_incomplete') return [callTool('calculator', { expression: task.expression }, m), 'calculator'];
  throw new ToolError(`unknown draft_error: '${k}'`);
}

export function runDraft(task, agent) {
  if (!task.draft_error) return agent.runTask(task);
  const p = draftPlan(task, task.draft_error === 'plan_incomplete');
  const head = { task_id: task.id ?? null, type: task.type ?? null, category: task.category ?? null, plan: p };
  const tail = { expected_answer: task.expected_answer ?? null, expected_success: task.expected_success ?? null, recovered: false, replans: 0, recoveries: [] };
  let answer, tool = 'calculator';
  try { [answer, tool] = flawedAnswer(task, agent); } catch (e) {
    if (!(e instanceof ToolError)) throw e;
    return { ...head, success: false, answer: null, ...tail, steps: 1, tools_used: [tool],
      trace: [{ step: 1, event: 'error', error: e.message }], error: e.message, passed: false };
  }
  return { ...head, success: true, answer, ...tail, steps: p.length, tools_used: p.map((s) => s.tool),
    trace: [{ step: 1, event: 'observe', tool, observation: answer }], passed: answer === (task.expected_answer ?? null) };
}

export class DeepAgent {
  constructor({ maxRounds = MAX_CRITIQUE_ROUNDS, revision = 'clean', isolate = true } = {}) {
    this.build = new BuildAgent(20);
    Object.assign(this, { maxRounds, revision, isolate });
  }

  resetAndSeed(task, revising = false) {
    const mem = this.build.memory;
    const stale = this.isolate ? Object.keys(mem)
      : revising && WRITES_MEMORY.includes(task.type) && own(mem, task.memory_key) ? [task.memory_key] : [];
    for (const k of stale) delete mem[k];
    for (const [k, v] of Object.entries(task.seed_memory || {})) mem[k] = v;
  }

  targetedFix(task, draft) {
    const full = draftPlan(task);
    let last = draft.answer, steps = 0;
    const tools = [];
    try {
      for (const s of full.slice(draft.plan.length)) {
        steps += 1; tools.push(s.tool);
        last = callTool(s.tool, resolve(s.args, last), this.build.memory);
      }
    } catch (e) {
      if (!(e instanceof ToolError)) throw e;
      return { ...draft, plan: full, success: false, answer: null, steps, tools_used: tools, error: e.message };
    }
    return { ...draft, plan: full, success: true, answer: last, steps, tools_used: tools };
  }

  // Returns the same row run_deep.py records, plus `events` for the trace stepper.
  runTask(task, useCritique = true) {
    this.resetAndSeed(task);
    const draft = runDraft(task, this.build);
    const events = draft.trace.map((e) => ({ ...e, phase: 'draft' }));
    const head = { task_id: task.id ?? null, type: task.type ?? null, category: task.category ?? null };
    const expected = task.expected_answer ?? null;
    if (!useCritique || this.maxRounds < 1) {
      return { ...head, mode: 'without_critique', draft_answer: draft.answer, draft_success: draft.success, answer: draft.answer,
        success: !!draft.success && draft.answer === expected, steps: draft.steps, cost_steps: draft.steps,
        critique_rounds: 0, critique_log: [], critique_outcome: 'not_run', revisions: 0, events };
    }
    let current = draft, revisions = 0, total = draft.steps, outcome = 'pass';
    const log = [];
    for (let round = 1; round <= this.maxRounds; round++) {
      const v = critique(task, current, Object.assign(Object.create(null), this.build.memory));
      const entry = { round, passed: v.passed, unfixable: v.unfixable, issues: v.issues, checks: v.checks, revision_followed: false };
      log.push(entry);
      events.push({ phase: 'critique', round, passed: v.passed, unfixable: v.unfixable, issues: v.issues, checks: v.checks });
      if (v.passed) { if (round === 1 && revisions === 0) outcome = 'pass'; break; }
      if (v.unfixable) { outcome = 'flag_unfixable'; break; }
      if (revisions === 0) outcome = v.issues.includes('plan_incomplete') ? 'flag_then_fix_plan' : 'flag_then_fix';
      if (round >= this.maxRounds) { outcome = 'flag_still_failing'; break; }
      if (this.revision === 'targeted' && current.success && !v.issues.includes('answer_mismatch') && v.issues.includes('plan_incomplete')) {
        current = this.targetedFix(task, current);
      } else {
        this.resetAndSeed(task, true);
        current = this.build.runTask(task);
      }
      revisions += 1; total += current.steps; entry.revision_followed = true;
      events.push(...(current.trace || []).map((e) => ({ ...e, phase: `revision ${revisions}` })));
    }
    if (log.length && log[log.length - 1].passed && revisions === 0) outcome = 'pass';
    return { ...head, mode: 'with_critique', draft_answer: draft.answer, draft_success: draft.success, answer: current.answer,
      success: !!current.success && current.answer === expected, final_result_success: current.success,
      steps: total, cost_steps: total, critique_rounds: log.length, critique_log: log, critique_outcome: outcome,
      revisions, error: current.error ?? null, events };
  }
}

// ---------------------------------------------------------------- suite runners (run_*.py)
export function runLearnSuite(tasks) {
  const results = tasks.map((t) => runLearnTask(t));
  const passed = results.filter((r) => r.passed).length;
  return { summary: { total: results.length, passed, succeeded: results.filter((r) => r.success).length,
    failed_as_expected: results.filter((r) => !r.success && r.passed).length,
    recovered: results.filter((r) => r.recovered).length }, results };
}

export function runBuildSuite(tasks) {
  const agent = new BuildAgent(20);
  const results = tasks.map((t) => agent.runTask(t));
  const exp = results.filter((r) => r.expected_success);
  const recovery_counts = { retry_correct: 0, fallback_tool: 0, skip_step: 0, abort: 0 };
  results.forEach((r) => r.recoveries.forEach((s) => { recovery_counts[s] += 1; }));
  const by_category = {};
  tasks.forEach((t, i) => {
    const c = (by_category[t.category] ||= { total: 0, passed: 0 });
    c.total += 1; c.passed += results[i].passed ? 1 : 0;
  });
  return { summary: { total: results.length, passed: results.filter((r) => r.passed).length,
    succeeded: results.filter((r) => r.success).length,
    failed_as_expected: results.filter((r) => !r.success && r.passed).length,
    success_rate_expected_success: exp.length ? round4(exp.filter((r) => r.success).length / exp.length) : 0,
    mean_steps: round4(results.reduce((a, r) => a + r.steps, 0) / results.length),
    replans: results.reduce((a, r) => a + r.replans, 0), recovery_counts, by_category }, results };
}

// Python's round(x, 4) on the values these summaries produce.
export const round4 = (x) => Number(x.toFixed(4));

export function runDeepMode(tasks, useCritique, opts = {}) {
  const agent = new DeepAgent(opts);
  return tasks.map((t) => agent.runTask(t, useCritique));
}

// Mirrors analyze_deep.summarize: success on expected-success tasks, steps and outcomes.
export function summarizeDeep(rows, tasks) {
  const exp = rows.filter((_, i) => tasks[i].expected_success);
  const hits = exp.filter((r) => r.success).length;
  const outcomes = {};
  rows.forEach((r) => { outcomes[r.critique_outcome] = (outcomes[r.critique_outcome] || 0) + 1; });
  const total = rows.reduce((a, r) => a + r.steps, 0);
  return { succeeded: hits, expected_success_tasks: exp.length, success_rate: round4(hits / exp.length), total_steps: total,
    mean_steps: round4(total / rows.length), revisions: rows.reduce((a, r) => a + r.revisions, 0), outcomes };
}

export function runDeepSuite(tasks) {
  const byId = Object.fromEntries(tasks.map((t) => [t.id, t]));
  const strip = ({ events, ...rest }) => rest; // events feed the stepper; run_deep.py does not record them
  const without = runDeepMode(tasks, false).map(strip);
  const withC = runDeepMode(tasks, true).map(strip);
  for (const r of withC) {
    const t = byId[r.task_id];
    Object.assign(r, { expected_answer: t.expected_answer, expected_success: t.expected_success, expected_critique_outcome: t.expected_critique_outcome });
    r.outcome_matched = r.critique_outcome === t.expected_critique_outcome;
    r.passed = r.success === t.expected_success && r.outcome_matched;
  }
  for (const r of without) {
    const t = byId[r.task_id];
    Object.assign(r, { expected_answer: t.expected_answer, expected_success: t.expected_success, expected_without_critique_success: t.expected_without_critique_success });
    r.passed = r.success === t.expected_without_critique_success;
  }
  const rate = (rs) => { const e = rs.filter((r) => r.expected_success); return e.length ? round4(e.filter((r) => r.success).length / e.length) : 0; };
  let correct = 0, falseC = 0;
  withC.forEach((r, i) => {
    if (r.draft_success && r.draft_answer === tasks[i].expected_answer) {
      correct += 1;
      if (r.critique_log.length && !r.critique_log[0].passed && !r.critique_log[0].issues.includes('plan_incomplete')) falseC += 1;
    }
  });
  const still = [];
  for (const r of withC) {
    if (!r.success && !r.expected_success) still.push({ task_id: r.task_id, reason: (r.critique_log.length && r.critique_log[r.critique_log.length - 1].issues.join('; ')) || 'unfixable' });
    else if (!r.success && r.expected_success) still.push({ task_id: r.task_id, reason: `still failing after critique: ${r.error}` });
  }
  const count = (rs, f) => { const o = {}; rs.forEach((r) => { o[f(r)] = (o[f(r)] || 0) + 1; }); return o; };
  const mean = (rs) => round4(rs.reduce((a, r) => a + r.steps, 0) / rs.length);
  const summary = {
    total: tasks.length, critique_target_tasks: tasks.filter((t) => t.category === 'critique_target').length,
    passed_with_critique: withC.filter((r) => r.passed).length, outcome_matched: withC.filter((r) => r.outcome_matched).length,
    success_rate_without_critique: rate(without), success_rate_with_critique: rate(withC),
    succeeded_without_critique: without.filter((r) => r.success).length, succeeded_with_critique: withC.filter((r) => r.success).length,
    expected_success_tasks: tasks.filter((t) => t.expected_success).length,
    mean_steps_without_critique: mean(without), mean_steps_with_critique: mean(withC),
    mean_cost_without_critique: mean(without), mean_cost_with_critique: mean(withC),
    critique_rounds_distribution: count(withC, (r) => String(r.critique_rounds)), critique_outcomes: count(withC, (r) => r.critique_outcome),
    total_revisions: withC.reduce((a, r) => a + r.revisions, 0), correct_drafts: correct, false_critiques: falseC,
    false_critique_rate: correct ? round4(falseC / correct) : 0, still_failing_after_critique: still, max_critique_rounds: MAX_CRITIQUE_ROUNDS,
  };
  return { summary, without_critique: without, with_critique: withC };
}
