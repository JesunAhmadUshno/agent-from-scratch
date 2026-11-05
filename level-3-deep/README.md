# Level 3, Deep: agent-from-scratch

Status: DONE (2026-11-05). Compressed Deep: a self-critique loop
and an agent evaluation suite with scored tasks, built on the
Level 2 Build agent. Python standard library only. The design
was written first, in DEEP-SPEC.md in this folder.

## Honest scope line

The planner and the critic are deterministic code, not LLMs.
They call no API and learn nothing. The critic is independent
logic: it recomputes each answer from the task fields with the
tools directly and never reads the draft answer as its source.
The value of this level is verified revision, not a claim about
intelligence.

## Method

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

## Run it

    python level-3-deep/run_deep.py
    python -m unittest discover -s tests

The runner runs the same 32-task suite twice per task set:
without critique (draft only) and with critique. It writes
level-3-deep/results_deep.json deterministically: run it twice
and the file is identical (verified by diff).

## Results (measured 2026-11-05, Muse VM, Python 3.12)

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

## Failure modes and limits

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
  node BlackBoxV2. The grade carries the named node deduction.

## Grade

Grade: 7,900 of 10,000 (self-graded, deductions named, not
rounded up).

- Minus 100: run on the Muse VM, not the assigned BlackBoxV2
  node (named node deduction, as in prior levels).
- Minus 600: seeded, synthetic errors and a same-author suite.
  The critique gain (0.5357 to 1.0) is measured on cases built
  for the critic, so it overstates wild performance by an
  unknown amount.
- Minus 450: critic and executor share tools, so tool-internal
  bugs are invisible to the critique (see failure modes).
- Minus 350: toy scale. A five-entry knowledge base and 32
  short tasks are far from a real agent workload.
- Minus 250: cost model is tool steps only, with no time or
  resource measurement.
- Minus 200: no cross-task persistence case in the Deep suite.
- Minus 150: revision is a blunt clean re-run, not a targeted
  correction of the flagged step.

Total deductions: 2,100. 10,000 minus 2,100 is 7,900.

## What v1.1 adds next

See the repo-root ROADMAP.md: the rest of the v2 Deep scope is
the named v1.1 backlog.
