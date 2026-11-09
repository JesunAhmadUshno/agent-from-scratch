// Known-answer check, run by `npm run build` before vite: node src/agent.check.mjs
// Re-runs all 60 recorded tasks (8 Learn, 20 Build, 32 Deep) with the JavaScript port
// and asserts every row and summary equals the committed Python results_*.json. It also
// reproduces the round ablation, revision variants, cross-task suite and interval stats
// written by level-3-deep/analyze_deep.py. Any drift fails the build.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { callTool, runLearnSuite, runBuildSuite, runDeepSuite, runDeepMode, summarizeDeep } from './agent.js';
import { wilson, mcnemarExact } from './stats.js';
import { parseVerdict, parseThreats, parseRecorded, parseBacklog, parseCi, countTests } from './docs.js';

const read = (p) => JSON.parse(fs.readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8'));
const round4 = (x) => Number(x.toFixed(4));

// Calculator semantics against values printed by Python 3.12.
for (const [expr, want] of [['15 / 3 + 2 * 10', 25], ['-2**2', -4], ['7 // 2', 3], ['-7 // 2', -4], ['-7 % 3', 2],
  ['2**-1', 0.5], ['7 % -3', -2], ['2**3**2', 512], ['10 / 4', 2.5], ['-(3-5)*2.5', 5]])
  assert.equal(callTool('calculator', { expression: expr }, {}), want, expr);
assert.throws(() => callTool('calculator', { expression: '10 / 0' }, {}), /division by zero/);
assert.throws(() => callTool('calculator', { expression: 123 }, {}), /must be a non-empty string/);

// Full rows and summaries, all 60 tasks.
assert.deepStrictEqual(runLearnSuite(read('level-1-learn/tasks.json')), read('level-1-learn/results_learn.json'));
assert.deepStrictEqual(runBuildSuite(read('level-2-build/tasks_build.json')), read('level-2-build/results_build.json'));
const tasks = read('level-3-deep/tasks_deep.json');
const deep = read('level-3-deep/results_deep.json');
assert.deepStrictEqual(runDeepSuite(tasks), deep);

// analyze_deep.py outputs.
const strip = (rows) => rows.map(({ events, ...r }) => r);
const ablation = read('level-3-deep/results_deep_rounds.json');
for (const r of [0, 1, 2, 3])
  assert.deepStrictEqual(summarizeDeep(strip(runDeepMode(tasks, r > 0, { maxRounds: r })), tasks), ablation.rounds[r], `rounds ${r}`);
for (const mode of ['clean', 'targeted'])
  assert.deepStrictEqual(summarizeDeep(strip(runDeepMode(tasks, true, { revision: mode })), tasks), ablation.revision[mode], mode);

const crossTasks = read('level-3-deep/tasks_deep_cross.json');
const cross = read('level-3-deep/results_deep_cross.json');
for (const [mode, use] of [['without_critique', false], ['with_critique', true]]) {
  const rows = runDeepMode(crossTasks, use, { isolate: false });
  assert.deepStrictEqual(summarizeDeep(strip(rows), crossTasks), cross[mode].summary, `cross ${mode}`);
  rows.forEach((r, i) => {
    const rec = cross[mode].rows[i];
    for (const k of ['task_id', 'answer', 'success', 'steps', 'critique_outcome']) assert.deepStrictEqual(r[k], rec[k], `${rec.task_id} ${k}`);
  });
}

const st = read('level-3-deep/results_deep_stats.json');
for (const arm of ['without', 'with']) assert.deepStrictEqual(wilson(st[arm].k, st.n).map(round4), st[arm].wilson95, arm);
assert.deepStrictEqual(wilson(st.false_critique.k, st.false_critique.n).map(round4), st.false_critique.wilson95);
assert.equal(mcnemarExact(st.mcnemar.fixed_by_critique, st.mcnemar.broken_by_critique), st.mcnemar.p_exact_two_sided);
// The same discordant counts, derived from the per-task rows the page shows.
const wo = Object.fromEntries(deep.without_critique.map((r) => [r.task_id, r.success]));
const exp = deep.with_critique.filter((r) => r.expected_success);
assert.equal(exp.filter((r) => r.success && !wo[r.task_id]).length, st.mcnemar.fixed_by_critique);
assert.equal(exp.filter((r) => !r.success && wo[r.task_id]).length, st.mcnemar.broken_by_critique);

// Text the page quotes from the repo's docs.
const text = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const report = text('REPORT.md');
assert.equal(parseVerdict(text('README.md')), 'Functional; not pre-registered');
const threats = parseThreats(report);
assert.equal(threats.length, 7);
assert.ok(threats.every((t) => !/\d,\d{3}|grade/i.test(t)), 'threats carry no grade');
assert.deepStrictEqual(parseRecorded(report), { date: '2026-11-05', python: '3.12' });
assert.equal(parseBacklog(report).length, 7);
const ci = parseCi(text('.github/workflows/ci.yml'));
assert.ok(ci.versions.length >= 2 && ci.steps.some((s) => s.run.includes('python level-3-deep/run_deep.py')));
const testSrc = fs.readdirSync(new URL('../../tests/', import.meta.url)).filter((f) => /^test_.*\.py$/.test(f)).map((f) => text(`tests/${f}`));
assert.ok(countTests(testSrc) >= 52, 'the v1.0 suite had 52 tests');

console.log('agent ok', { learn: 8, build: 20, deep: tasks.length, cross: crossTasks.length,
  rounds: Object.fromEntries(Object.entries(ablation.rounds).map(([k, v]) => [k, v.success_rate])), mcnemar_p: st.mcnemar.p_exact_two_sided });
