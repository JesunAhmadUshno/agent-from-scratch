# REPORT: agent-from-scratch (P07)

Results of the three build stages (Learn, Build, Deep) and the extra
Deep analyses, against the plans in PROPOSAL.md. Assembled on
2026-11-08 from the three stage write-ups (level-*/README.md), the
benchmark table of the old README, docs/research-review.md and
ROADMAP.md; their text follows, with grades removed (grades are
internal). Every number comes from a results file named beside it, and
CI re-runs every runner and fails on any difference.

Project: P07. Fleet node: BlackBoxV2. Wave: Wave 3. All levels were run
on the Muse VM (CPU), not on the assigned node BlackBoxV2.

## Summary

The agent loop, plan-then-execute agent and self-critique loop all ran
end to end on their labelled suites, deterministically. On the 32-task
Deep suite, success on the 28 expected-success tasks is 15 of 28
(0.5357, Wilson 95% 0.3581 to 0.7047) without critique and 28 of 28
(1.0, Wilson 95% 0.8794 to 1.0) with critique, exact two-sided McNemar
p = 0.000244 on 13 fixed versus 0 broken pairs, with 0 false critiques
on 15 correct drafts (Wilson 95% 0.0 to 0.2039) and mean tool steps 2.0
versus 1.3438 (level-3-deep/results_deep.json,
level-3-deep/results_deep_stats.json). The errors were seeded by the
same author who wrote the critic, and the critic recomputes from the
same task fields, so the result is close to true by construction: it
shows the critic catches these six slip kinds on this suite, not that
self-critique helps an agent in general.

## Results against the plans

There are no pre-registered hypotheses (PROPOSAL.md, Status). The
plans' acceptance criteria and the per-task labels are scored here,
misses included.

| Plan item | Result | Evidence |
| --- | --- | --- |
| Learn: code runs, 8 labelled tasks | Met: 8 of 8 matched | level-1-learn/results_learn.json |
| Build: at least 16 new unit tests | Met: 19 | tests/test_build_agent.py |
| Build: results identical across runs | Met: CI fails on any diff | .github/workflows/ci.yml |
| Build: 20 labelled tasks | Met: 20 of 20 matched, 18 of 18 expected-success | level-2-build/results_build.json |
| Deep: critique outcome matches the pre-run label | Met: 32 of 32 | level-3-deep/results_deep.json, summary.outcome_matched |
| Deep: success without vs with critique reported | Met: 15 of 28 vs 28 of 28 | level-3-deep/results_deep.json |
| Deep: false-critique rate reported | Met: 0 of 15 | level-3-deep/results_deep.json |
| Deep: still-failing tasks logged with reasons | Met: 4 (D27 to D30) | level-3-deep/results_deep.json |
| Run on the assigned node BlackBoxV2 | Missed: all stages ran on the Muse VM | this report |
| Full v2 Deep scope (SPEC.md) | Missed: compressed; 3 of 7 backlog items done, 3 partial, 1 open | v1.1 backlog below |
| Errors that occur without seeding | Missed: not measured | Threats to validity |

## Benchmarks (from the old README)

Measured 2026-11-05 with the runners on the Muse VM, Python 3.12. The planner is a deterministic policy, not an LLM.

| Test | Result |
| --- | --- |
| Learn tasks matched expectations | 8 of 8 |
| Tasks succeeded | 7 of 8 (T08 fails by design, division by zero) |
| Tasks recovered after a bad argument | 1 (T07, corrected to 9 * 9 = 81) |
| Unit tests | 16 passed |
| Determinism | results_learn.json identical across two runs (hash verified) |
| Build tasks matched expectations | 20 of 20 |
| Build success rate on expected-success tasks | 1.0 (18 of 18) |
| Build mean steps | 1.5 |
| Build recoveries | retry_correct 1, fallback_tool 1, skip_step 1, abort 2 |
| Full test suite at Build ship | 35 passed (16 Learn plus 19 Build) |
| Determinism (Build) | results_build.json identical across two runs (diff verified) |
| Deep tasks in scored suite | 32 (14 clean, 14 critique-target, 4 expected-failure) |
| Deep success rate without critique | 0.5357 (15 of 28 expected-success) |
| Deep success rate with critique | 1.0 (28 of 28 expected-success) |
| Deep critique outcomes matched | 32 of 32 |
| Deep false-critique rate | 0.0 (0 of 15 correct drafts) |
| Deep mean steps | 1.3438 without critique, 2.0 with critique |
| Full test suite at Deep ship | 52 passed (16 Learn plus 19 Build plus 17 Deep) |
| Determinism (Deep) | results_deep.json identical across two runs (diff verified) |

Test counts in this table are as of each release; the current suite
is larger (tests/).

## Level 1, Learn: the tool-using loop

Status: DONE (2026-11-05). A tool-using agent loop with no framework,
built with the Python standard library only.

### Honest scope line

The planner in this level is a deterministic, scripted policy. It is
not an LLM, it calls no API, and it does not learn. It reads the task
type and emits the next tool call from a fixed rule. A real LLM
planner is Build level scope.

### Method

1. Tool registry with validation. Five tools are registered by name:
   calculator, kb_lookup, word_count, remember, and recall. Each tool
   validates its arguments first. An unknown tool name or a bad
   argument raises a named ToolError.
2. Calculator safety. The calculator parses arithmetic with the ast
   module and walks only numeric constants, the arithmetic operators,
   and unary plus and minus. It never uses eval, so a function call
   or a name in an expression is rejected.
3. Knowledge base. kb_lookup reads a small labelled dict with five
   entries: agent, tool, memory, planning, and loop. A miss raises
   ToolError.
4. Memory. remember and recall share an in-memory dict that lives
   for one task run. Recall of a missing key raises ToolError.
5. Agent loop. Plan, act, observe, repeat. The deterministic policy
   chooses the next call, the loop executes it, records the
   observation in a step trace, and continues until the policy has
   no next call or max_steps (10 by default) is reached.
6. Error recovery. On ToolError the loop records the error and the
   policy retries once with corrected arguments. If the retry
   succeeds, the task is marked recovered. If the retry also fails,
   the task ends as failed. The loop never retries in a circle.

### Run it

    python level-1-learn/run_learn.py
    python -m unittest tests.test_learn_agent -v
    python -m unittest tests.test_layout -v

The runner writes level-1-learn/results_learn.json deterministically:
run it twice and the file is identical (verified by hash).

### Learn results (measured 2026-11-05, Muse VM, Python 3.12)

| Task | Type | Steps | Tools used | Recovered | Success | Answer |
| --- | --- | --- | --- | --- | --- | --- |
| T01 | calculator | 1 | calculator | no | yes | 84 |
| T02 | calculator | 1 | calculator | no | yes | 25 |
| T03 | lookup | 1 | kb_lookup | no | yes | An agent is a system that perceives, plans, and acts using tools to complete a task. |
| T04 | word_count | 1 | word_count | no | yes | 6 |
| T05 | memory | 2 | remember, recall | no | yes | agent-from-scratch |
| T06 | multi_step | 3 | calculator, remember, recall | no | yes | 42 |
| T07 | recovery | 2 | calculator, calculator | yes | yes | 81 |
| T08 | unrecoverable | 2 | calculator, calculator | no | no (as expected) | none |

Summary: 8 of 8 tasks matched their expected answer and their
expected success or failure label. 7 succeeded, 1 failed as designed
(T08, division by zero), 1 recovered after a bad argument (T07).
Unit tests: 16 tests, all passing, plus the scaffold smoke test.

Hand checks: 12 * (3 + 4) = 84. 15 / 3 + 2 * 10 = 5 + 20 = 25.
6 * 7 = 42. 9 * 9 = 81. The sentence in T04 has 6 words.

### Failure modes and limits

- The policy is scripted per task type. An unseen task type raises
  ToolError and the task fails. It cannot invent a plan.
- Recovery is one retry only, and only a task that carries corrected
  arguments can truly correct itself. Other failures retry the same
  call once and then fail, as T08 shows.
- Memory is in-memory only and resets per task. Nothing persists
  across runs.
- The knowledge base has five entries. Every other key is a miss.
- The calculator handles arithmetic only. Names, calls, and other
  syntax are rejected by design.
- max_steps bounds every run, so no task can loop forever, but a
  task cut by max_steps is reported as failed, not as partial.
- This level was run on the Muse VM (CPU), not on its fleet node BlackBoxV2.

### What Build adds next

A real LLM planner behind the same tool registry and loop, persistent
memory, and a wider task suite. See the root README level map.

## Level 2, Build: plan-then-execute

Status: DONE (2026-11-05). A plan-then-execute agent with no
framework, built with the Python standard library only. The design
was written first, in BUILD-SPEC.md (now PROPOSAL.md, Build plan).

### Honest scope line

The planner in this level is a deterministic, scripted policy. It
is not an LLM, it calls no API, and it does not learn. It builds a
plan from the task type and fields by fixed rules. That is the
same honesty rule as Learn: the value of this level is the
planning, memory, and recovery machinery around the planner, not
a claim about intelligence.

### Method

1. Plan before execution. Planner.plan(task) emits the whole plan
   up front: ordered steps, each with a tool name, a purpose, and
   arguments. The plan is stored in every task result, and
   execution follows it in order. A step argument of "$prev" is
   replaced at execution time with the previous observation, which
   is how chains pass values between steps.
2. One replan at most. When a step fails, the agent may replan
   once. A second failure aborts the task. There is no retry loop.
3. Persistent memory. MemoryStore is a dict bound to a JSON file:
   it loads on start and saves on every write. One suite run
   shares one store, so memory survives across tasks, and two
   Agent instances that share a file see the same memory. The
   Learn remember and recall tools work through it unchanged,
   because it is a dict.
4. Recovery by error class, logged by name. retry_correct for a
   bad argument shape when the task carries corrected arguments;
   fallback_tool when kb_lookup misses a key and the task carries
   a fallback query, switching the step to kb_search; skip_step
   when an optional step fails, dropping it and continuing; abort
   for unrecoverable errors such as division by zero, a recall of
   a key never stored, or a failure after the one replan.
5. Tools. Reused from Learn, loaded from level-1-learn/agent.py:
   calculator, kb_lookup, word_count, remember, recall. New in
   Build: unit_converter (km_to_miles, miles_to_km, c_to_f, f_to_c,
   kg_to_lb, lb_to_kg, using the exact factors 1.609344 km per
   mile and 0.45359237 kg per pound) and kb_search (keyword
   overlap scoring over the knowledge base values, returning the
   best entry key).

### Run it

    python level-2-build/run_build.py
    python -m unittest discover -s tests

The runner uses a temporary memory file for the suite and writes
level-2-build/results_build.json deterministically: run it twice
and the file is identical (verified by diff).

### Results (measured 2026-11-05, Muse VM, Python 3.12)

All numbers below come from level-2-build/results_build.json.

| Measure | Result |
| --- | --- |
| Tasks matched expectations | 20 of 20 |
| Tasks succeeded | 18 of 20 |
| Expected-failure tasks that failed as expected | 2 of 2 |
| Success rate on expected-success tasks | 1.0 (18 of 18) |
| Mean steps per task | 1.5 |
| Replans used | 3 |
| Recovery: retry_correct | 1 |
| Recovery: fallback_tool | 1 |
| Recovery: skip_step | 1 |
| Recovery: abort | 2 |

Per category, passed of total:

| Category | Passed |
| --- | --- |
| single_tool | 2 of 2 |
| kb_search | 2 of 2 |
| converter | 4 of 4 |
| multi_step | 4 of 4 |
| memory_persistence | 3 of 3 |
| recovery | 3 of 3 |
| expected_failure | 2 of 2 |

Unit tests: 19 Build tests in tests/test_build_agent.py, all
passing, and 35 tests in the full suite (16 Learn plus 19 Build),
all passing, plus the scaffold smoke test.

Hand checks: 10 km is 10 / 1.609344 = 6.2137119224 miles rounded
to 10 places. 100 degrees Celsius is 100 * 9/5 + 32 = 212 degrees
Fahrenheit. 10 kg is 10 / 0.45359237 = 22.0462262185 pounds
rounded to 10 places. 9 * 9 = 81, 3 * 5 = 15, 6 * 7 = 42.

### Failure modes and limits

- The planner is scripted per task type. An unseen task type
  fails at planning time. It cannot invent a plan, and the plan
  can only chain steps its rules already know.
- Recovery is bounded: one replan per task. A task whose
  corrected arguments are also wrong aborts, by design, and a
  test pins that bound.
- abort is final. Division by zero and recall of a missing key
  end the task as failed; nothing retries them silently.
- kb_search is keyword overlap over a five-entry toy knowledge
  base. Ties break by entry order. It is not semantic search,
  and a query with no overlapping words raises an error.
- The task suite is synthetic and written by the same author as
  the agent, so a perfect score shows the machinery works on
  known cases, not that it generalises. The outside evaluation
  in P06 exists for that reason.
- Memory is one JSON file with no locking. Two processes writing
  at once can lose updates, and nothing expires or is validated
  beyond JSON shape.
- The unit converter rounds to 10 decimal places, which is a
  stated precision limit, not full float accuracy.
- This level was run on the Muse VM (CPU), not on its fleet
  node BlackBoxV2.

### What Deep adds next

A self-critique loop and an agent evaluation suite with scored
tasks, per SPEC.md, plus the failure taxonomy write-up shared
with the P06 Deep track.

## Level 3, Deep: self-critique loop and scored suite

Status: DONE (2026-11-05). Compressed Deep: a self-critique loop
and an agent evaluation suite with scored tasks, built on the
Level 2 Build agent. Python standard library only. The design
was written first, in DEEP-SPEC.md (now PROPOSAL.md, Deep plan).

### Honest scope line

The planner and the critic are deterministic code, not LLMs.
They call no API and learn nothing. The critic is independent
logic: it recomputes each answer from the task fields with the
tools directly and never reads the draft answer as its source.
The value of this level is verified revision, not a claim about
intelligence.

### Method

1. Draft. The Build agent produces a draft per task. On the 14
   critique-target tasks, a seeded first-pass draft policy
   plausibly errs, by a named kind per task: arithmetic_slip
   (drops a term), unit_inverted (uses the inverse conversion),
   kb_wrong (returns a neighbouring knowledge base entry),
   stale_memory (recalls a stale stored value), word_count_slip
   (counts a truncated text), plan_incomplete (stops after the
   first plan step).
2. Critique. The Critic checks each draft independently:
   recompute arithmetic with the calculator, recompute the
   conversion with the unit converter, re-lookup knowledge base
   facts and re-run keyword search, recount words, check memory
   recall against the memory store snapshot, and check plan-step
   completeness against a fresh plan from the Build planner.
3. Revision, bounded. On a failed critique the agent revises by
   re-running the task with the clean Build agent, then the
   critic checks again. The bound is MAX_CRITIQUE_ROUNDS = 2
   critique rounds per task (at most one revision in this design,
   because an unfixable critique stops at round 1 and a fixable
   one is rechecked at round 2). Every verdict and revision is
   logged per task in results_deep.json.
4. Unfixable tasks. When the independent recompute itself fails
   (division by zero, a recall of a key never stored, a search
   with no overlapping words), the critic marks the task
   unfixable, no revision is attempted, and the task stays
   failed with its reason logged.

### Run it

    python level-3-deep/run_deep.py
    python -m unittest discover -s tests

The runner runs the same 32-task suite twice per task set:
without critique (draft only) and with critique. It writes
level-3-deep/results_deep.json deterministically: run it twice
and the file is identical (verified by diff).

### Results (measured 2026-11-05, Muse VM, Python 3.12)

All numbers below come from level-3-deep/results_deep.json.

| Measure | Without critique | With critique |
| --- | --- | --- |
| Tasks succeeded (of 28 expected-success) | 15 | 28 |
| Success rate on expected-success tasks | 0.5357 | 1.0 |
| Mean steps per task (all 32) | 1.3438 | 2.0 |
| Mean cost per task, tool steps | 1.3438 | 2.0 |

| Critique measure | Result |
| --- | --- |
| Tasks in suite | 32 |
| Critique-target tasks | 14 |
| Tasks matching all expectations (outcome and success) | 32 of 32 |
| Critique outcomes matched to pre-run labels | 32 of 32 |
| Outcomes: pass | 14 |
| Outcomes: flag_then_fix | 13 |
| Outcomes: flag_then_fix_plan | 1 |
| Outcomes: flag_unfixable | 4 |
| Critique rounds distribution | 1 round: 18 tasks, 2 rounds: 14 tasks |
| Total revisions | 14 |
| Correct drafts judged | 15 |
| False critiques | 0 |
| False-critique rate | 0.0 |
| Still failing after critique | 4 (D27, D28, D29, D30, all unfixable by design) |

Still failing, with reasons from the log: D27 and D29, division
by zero in the independent recompute. D28, recall of a key that
was never stored. D30, knowledge base search with no matching
entry. No expected-success task still fails.

Unit tests: 17 Deep tests in tests/test_deep_agent.py, all
passing, and 52 tests in the full suite (16 Learn plus 19 Build
plus 17 Deep), all passing, plus the scaffold smoke test.

Hand checks: 12 * 3 + 4 = 40 (the draft slip computes 12 * 3 =
36). 10 km is 6.2137119224 miles; the inverted draft computes
16.09344, which is 10 miles in km, not the answer. 100 degrees
Celsius is 212 degrees Fahrenheit; the inverted draft computes
37.7777777778. 8 * 5 = 40, not the stale stored 35.

### Extra analyses (analyze_deep.py)

    python level-3-deep/analyze_deep.py

Runs on CPU in seconds and never rewrites results_deep.json.

- Critique-round ablation, results_deep_rounds.json: with max
  critique rounds 0 or 1, 15 of 28 expected-success tasks succeed;
  with 2 or 3, 28 of 28. One round flags the seeded drafts but
  leaves no recheck to accept a revision, so the whole gain comes
  from the second round, and a third adds nothing on this suite.
- Targeted versus clean revision: running only the plan steps a
  draft skipped saves 1 of 64 total tool steps (the plan-incomplete
  task) with the same 28 of 28 solved. Every other seeded slip sits
  in the step that produces the answer.
- Interval statistics, results_deep_stats.json: Wilson 95%
  intervals 0.3581 to 0.7047 without critique and 0.8794 to 1.0
  with it; exact two-sided McNemar p = 0.000244 on 13 fixed versus
  0 broken pairs. Caveat: the 13 fixed tasks carry errors seeded on
  purpose, so the significance holds for this seeded suite only and
  says nothing about errors that occur without seeding.
- Cross-task memory, tasks_deep_cross.json and
  results_deep_cross.json: six tasks with memory shared across the
  run. Without critique a stale value leaks from X03 through X04
  into X05 (4 of 6 solved); with critique 6 of 6.
- Wall-clock timing, timing_deep.json: per-task medians over 200
  runs, kept outside the deterministic results files because time
  varies by machine.

The site in site/ re-runs all of this in the browser with a
JavaScript port and its build fails unless the port reproduces
every recorded row. That is a cross-implementation check, not an
independent critic.

### Failure modes and limits

- The seeded draft errors are designed, not observed in the
  wild. They prove the critic catches these six named slip kinds
  on this suite. They do not prove it catches errors it was not
  designed around, and a slip kind with no critic check (for
  example a wrong word_count text that is not the task text
  would be caught, but a subtly wrong knowledge base entry text
  edited inside the entry itself would not) can pass.
- The critic and the executor share the same tools. A bug inside
  a tool itself (for example a wrong conversion factor) would
  produce the same wrong value in both and pass critique. The
  hand checks above and the unit tests pin the tool factors from
  outside the shared code for that reason.
- Revision is a clean re-run, not a targeted correction. It is
  simple and deterministic, but it spends a full re-run on a
  one-step slip and it cannot fix a task whose clean run also
  fails.
- The suite is synthetic and written by the same author as the
  agent and the critic. A perfect with-critique score shows the
  loop works on known, labelled cases, not that it generalises.
  The outside evaluation in P06 exists for that reason.
- Deep tasks run in isolation (memory is reset and re-seeded per
  task), so the Deep suite does not test cross-task persistence.
  That behaviour is covered at Build level, not re-proven here.
- Cost is counted in tool steps only. There is no token, time,
  or money cost model, because there is no LLM in this system.
- This level was run on the Muse VM (CPU), not on its fleet
  node BlackBoxV2.


## Threats to validity

The named limits from the Deep write-up's self-assessment, largest
first (the point values are internal and not shown):

- Seeded, synthetic errors and a same-author suite. The critique gain (0.5357 to 1.0) is measured on cases built for the critic, so it overstates wild performance by an unknown amount.
- Critic and executor share tools, so tool-internal bugs are invisible to the critique (see the Deep failure modes).
- Toy scale. A five-entry knowledge base and 32 short tasks are far from a real agent workload.
- Cost model is tool steps only, with no time or resource measurement.
- No cross-task persistence case in the Deep suite.
- Revision is a blunt clean re-run, not a targeted correction of the flagged step.
- Run on the Muse VM, not the assigned BlackBoxV2 node.

Since v1.0, the cross-task case, the targeted-revision variant and
wall-clock timing were added by level-3-deep/analyze_deep.py (see
"Extra analyses" above); the first three threats stand.

## Research review (from docs/research-review.md, 2026-11-07)

A review of agent-from-scratch against a research rubric, written
after v1.0 and the extra Deep analyses. Every number here is read from
a committed file named beside it. The rubric scores are internal and
removed here; the evidence and gaps stay.

The code is clean, deterministic, dependency-free and well tested, and
the write-ups list their own limits. The research claim is narrow: the
evaluation is circular by construction, so the headline gain shows
that the critic works on the errors it was built for, not that
self-critique helps an agent in general.

### Evidence and gaps by criterion

| Criterion | Evidence and gap |
| --- | --- |
| Research question | Implicit: does a bounded, tool-grounded critique loop fix first-pass errors at an acceptable step cost? Never stated as a falsifiable question in the write-ups. |
| Hypotheses | Pre-run labels per task (expected outcome, expected critique outcome) are written into tasks_deep.json before the run, which is good practice. No stated hypothesis about effect size or about natural errors. |
| Method | Clear and reproducible: draft, independent recompute, at most 2 critique rounds, clean re-run (Level 3 section above, Method). The critic recomputes from the same task fields the seeded errors live in, which makes the result close to true by construction. |
| Baselines | One baseline: the same agent without critique. Now also 0, 1, 2 and 3 rounds and clean versus targeted revision (results_deep_rounds.json). No external baseline (no LLM agent, no public benchmark). |
| Statistics and uncertainty | Added: Wilson 95% intervals (0.3581 to 0.7047 without, 0.8794 to 1.0 with) and exact McNemar p = 0.000244 on 13 versus 0 discordant pairs (results_deep_stats.json). Valid for the seeded suite only. The system is deterministic, so there is no run-to-run variance to report. |
| Reproducibility | Standard library only, no randomness, no timestamps in results; CI re-runs every runner on Python 3.11 and 3.12 and fails on any diff. A second implementation in JavaScript (site/src/agent.js) reproduces all 60 recorded rows at every site build. |
| Threats to validity | Named honestly in the Deep write-up (seeded errors, shared tools, toy scale are the three largest). Construct validity is the main threat: seeded slips are not a sample of real agent errors. |
| Related work | Not positioned. NOVELTY.md is a draft pending a claim check. See the related-work section below for the minimum set. |
| Limitations | Explicit in every level README and in ROADMAP.md, with a v1.1 backlog. |
| Engineering rigor | 52-test v1.0 suite plus tests/test_deep_extras.py, ruff and CodeQL in CI, deterministic artefacts, safe ast-based calculator with no eval. |

### What was fixed now (cheap, CPU, seconds)

1. Critique-round ablation (ROADMAP v1.1 item 7). analyze_deep.py runs
   max rounds 0 to 3. With 0 or 1 rounds 15 of 28 expected-success
   tasks succeed, with 2 or 3 rounds 28 of 28 (results_deep_rounds.json).
   One round flags but cannot accept a revision, so the gain is all in
   round 2. Default stays 2, so results_deep.json is byte-identical.
2. Targeted revision (item 3). Re-running only skipped plan steps saves
   1 of 64 tool steps with the same 28 of 28 solved; every other seeded
   slip is in the answer-producing step.
3. Intervals and an exact McNemar test, with the seeded-suite caveat
   written into results_deep_stats.json and the Deep README.
4. Cross-task memory suite (item 4, and the matching threat). Six tasks
   share memory; without critique a stale value leaks from X03 through
   X04 into X05 (4 of 6), with critique 6 of 6 (results_deep_cross.json).
5. Wall-clock timing (part of item 5) in timing_deep.json, kept outside
   the deterministic files.
6. Cross-implementation check. The JavaScript port of the tools,
   planner, draft policy and critic must reproduce every recorded row
   before the site builds (site/src/agent.check.mjs). It was written
   from the Python code, so it is not an independent critic, but it
   would catch a port-specific or platform-specific drift.

### Seeded error taxonomy (item 6, partial)

Counted from the draft_error field of level-3-deep/tasks_deep.json,
joined with results_deep.json:

| Seeded kind | Tasks | Wrong without critique | Fixed with critique | Rounds |
| --- | --- | --- | --- | --- |
| arithmetic_slip | 4 (D13, D14, D15, D25) | 4 | 4 | 2 each |
| unit_inverted | 3 (D16, D17, D18) | 3 | 3 | 2 each |
| kb_wrong | 3 (D19, D20, D26) | 3 | 3 | 2 each |
| stale_memory | 2 (D21, D22) | 2 | 2 | 2 each |
| word_count_slip | 1 (D23) | 1 | 1 | 2 |
| plan_incomplete | 1 (D24) | 0 (right answer, skipped steps) | 1 | 2 |

The 13 wrong-without-critique tasks are the 13 McNemar discordant
pairs. The site recomputes this table from the same files.

### Remaining gaps and exactly what each needs

1. Natural errors (item 1, the biggest gap). Needs a stochastic or
   language-model planner producing drafts the author did not seed.
   Minimum: an open-weights instruct model (7B to 8B class) served
   locally, the same 32 task prompts plus 100 to 200 new tasks written
   by someone other than the author, about 1 to 3 GPU-hours for 5
   seeds per task. Report the critic's precision and recall on the
   errors that actually occur.
2. Independent critic tools (item 2). Needs a second calculator
   and converter written from the specification, not from the Python
   code (for example a decimal-arithmetic evaluator), plus fault
   injection: deliberately break one tool and show the critic still
   catches it. CPU only, a few hours of work.
3. External benchmark. Needs a public tool-use suite (tau-bench or
   ToolBench style tasks) and a language-model policy to run them; the
   rule planner cannot parse free-form tasks. GPU or paid API budget
   required, so not done here.
4. Scale (item 5). Needs a knowledge base of hundreds of entries
   with near-duplicate keys and multi-step chains of 5 or more tools,
   so retrieval and planning can actually fail. CPU only.
5. Pre-registration of a hypothesis with an expected effect size and a
   stopping rule before any run with a stochastic planner.

### Related work to position against (no claim of novelty is made here)

- ReAct (Yao et al., 2022, arXiv:2210.03629): the interleaved
  reason, act, observe loop that Level 1 implements without a model.
- Reflexion (Shinn et al., 2023, arXiv:2303.11366) and Self-Refine
  (Madaan et al., 2023, arXiv:2303.17651): model-generated feedback and
  revision loops.
- CRITIC (Gou et al., 2023, arXiv:2305.11738): verification with
  external tools, the closest analogue to this critic's independent
  recompute.
- Huang et al., 2023, "Large Language Models Cannot Self-Correct
  Reasoning Yet" (arXiv:2310.01798): intrinsic self-correction without
  external feedback does not reliably help; the gains here come from
  tool-grounded checks against task fields, which is consistent with
  that finding rather than evidence against it.

These references should be checked and summarised in PROPOSAL.md (Dossier)
before any novelty claim in PROPOSAL.md (Novelty) is upgraded from draft.

## v1.1 backlog (open work)

From ROADMAP.md. Named under the December Compression Protocol. None of
this was built at v1.0, and nothing below is claimed as done unless
the update says so.

Update after v1.0: items 3, 4 and 7 are now measured by
level-3-deep/analyze_deep.py, and item 5 has wall-clock timing (the
knowledge base is still five entries). See "Research review" above
for the status of each item.

1. Natural error study: run the agent on tasks not written by
   the agent author, collect errors that occur without seeding,
   and measure the critic on those.
2. Independent critic tools: a second implementation of the
   calculator and converter checks, so a tool-internal bug
   cannot pass both stages.
3. Targeted revision: correct only the flagged step instead of
   a clean full re-run, and compare cost against the v1.0 loop.
4. Cross-task Deep cases: memory persistence and stale-memory
   critique across tasks in one suite run, not only per task.
5. Larger knowledge base and longer multi-step chains, with a
   time-based cost model beside the step count.
6. Failure taxonomy write-up shared with the P06 Deep track
   (paper candidate), using the Deep critique log as data.
7. Harder critique bounds study: measure 1, 2, and 3 critique
   rounds on the same suite and report the gain per round.

## Conclusion

The three agents run end to end, deterministically, and their numbers
regenerate in CI. The self-critique result is real on its own terms
and narrow: a tool-grounded critic that recomputes from task fields
fixes every seeded slip in this suite at about 0.66 extra tool steps per
task. Whether it helps on errors nobody seeded is unmeasured; that is
the first item of the backlog and the subject of the next, locked
cycle.
