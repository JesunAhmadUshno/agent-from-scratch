# One Agent, No Framework: Building agent-from-scratch in the Open

By Jesun Ahmad Ushno
Date: 2026-11-05
Status: DRAFT, written fan-out for P07 agent-from-scratch v1.0. Not posted.

## The problem

Agent frameworks hide the loop. When a tool call fails, when memory
is stale, or when a plan stops early, the framework decides what
happens next and the builder learns little. This project builds the
loop in the open with no framework, so every decision is plain code
that can be read, tested, and measured.

This project, P07 in Roadmap v3, builds a tool-using agent in three
levels: a core loop, a plan-then-execute agent with persistent
memory and named recovery, then a self-critique loop with a scored
evaluation suite. All code runs with the Python standard library
only. The planner and the critic are deterministic code, not LLMs.
They call no API, use no model, and learn nothing, and nothing here
claims otherwise.

Repository: https://github.com/JesunAhmadUshno/agent-from-scratch

## Past, present, future (the dossier, condensed)

Past: framework agent examples in the LangGraph class already exist.
The prior art and the problem history are recorded in DOSSIER.md and
NOVELTY.md in the repo. The novelty claim there stays marked
PROPOSED. This post makes no novelty claim beyond the measured work
below.

Present: v1.0 closes three levels on 2026-11-05. Learn built the
core loop small and checkable by eye. Build
added planning, persistent JSON memory, and recovery by error class.
Compressed Deep added a self-critique loop:
an independent deterministic critic that recomputes each draft
answer and triggers a bounded clean re-run.

Future: the rest of the v2 Deep scope is named in ROADMAP.md in the
repo as the v1.1 backlog. It includes a natural error study,
independent critic tools, targeted revision, cross-task Deep cases,
larger scale, a failure taxonomy write-up with P06, and a critique
bounds study. None of that is done, and none of it is claimed here.

## Main results claim

At v1.0, on synthetic suites only: Learn passed 16 tests with 8 of 8 tasks matching expectations, 7 of 8 succeeding (T08 fails by design, division by zero), and 1 recovery (T07, corrected to 9 * 9 = 81); Build passed 19 tests (35 tests in total) on 20 tasks, with 20 of 20 matching expectations, success 1.0 on the 18 expected-success tasks (18 of 18), mean steps 1.5, and recoveries retry_correct 1, fallback_tool 1, skip_step 1, abort 2; compressed Deep passed 17 tests (52 tests in total) on a 32-task suite (14 clean, 14 critique-target, 4 expected-failure), with success on the 28 expected-success tasks rising from 0.5357 without critique (15 of 28) to 1.000 with critique (28 of 28), critique outcomes matched on 32 of 32, false-critique rate 0.0 (0 of 15 correct drafts), and mean steps 1.3438 without critique and 2.0 with critique.

Every number in that claim comes from a run recorded in the level
READMEs in the repo, on synthetic suites. Read the limits section
below before quoting any of it.

## Results by level

### Level 1, Learn (release v0.1)

Five tools are registered by name: calculator, kb_lookup,
word_count, remember, and recall. Each tool validates its arguments
first. The calculator parses arithmetic with the ast module and
never uses eval. The agent loop is plan, act, observe, repeat, with
max_steps 10 by default and one retry with corrected arguments.

| Measure | Result |
| --- | --- |
| Tasks matched expectations | 8 of 8 |
| Tasks succeeded | 7 of 8 (T08 fails by design, division by zero) |
| Recovered after a bad argument | 1 (T07, corrected to 9 * 9 = 81) |
| Tests | 16 |
| Determinism | results_learn.json identical across two runs (hash verified) |

### Level 2, Build (release v0.5)

Build is a plan-then-execute agent. The planner is deterministic
code, not an LLM. It emits the whole plan up front, the plan is
stored per result, and at most one replan is allowed per task.
MemoryStore is a JSON file-backed dict that loads on start and saves
on every write. Recovery is logged by name: retry_correct,
fallback_tool, skip_step, abort. Two new tools join the five Learn
tools: unit_converter and kb_search.

| Measure | Result |
| --- | --- |
| Tasks matched expectations | 20 of 20 |
| Success rate on expected-success tasks | 1.0 (18 of 18) |
| Mean steps per task | 1.5 |
| Replans used | 3 |
| Recoveries | retry_correct 1, fallback_tool 1, skip_step 1, abort 2 |
| Tests | 19 Build, 35 in total |
| Determinism | results_build.json identical across two runs (diff verified) |

### Level 3, Deep, compressed (release v1.0)

Deep adds a self-critique loop. The critic is deterministic code,
not an LLM. It independently recomputes each draft answer with the
tools directly: calculator arithmetic, unit conversion, knowledge
base lookup and search, and word count. It checks memory recall
against the store snapshot and checks plan completeness against a
fresh plan. It never reads the draft answer as its source. Revision
is a clean re-run within a bound of 2 critique rounds
(MAX_CRITIQUE_ROUNDS = 2), and every verdict is logged per task.

The suite holds 32 tasks written before the run: 14 clean, 14
critique-target with seeded first-pass errors in six named kinds
(arithmetic_slip, unit_inverted, kb_wrong, stale_memory,
word_count_slip, plan_incomplete), and 4 expected-failure.

| Measure | Without critique | With critique |
| --- | --- | --- |
| Tasks succeeded (of 28 expected-success) | 15 | 28 |
| Success rate on expected-success tasks | 0.5357 (15 of 28) | 1.000 (28 of 28) |
| Mean steps per task (all 32) | 1.3438 | 2.0 |

Critique outcomes matched pre-run labels on 32 of 32 tasks: pass
14, flag_then_fix 13, flag_then_fix_plan 1, flag_unfixable 4. Total
revisions 14. False-critique rate 0.0 (0 of 15 correct drafts).
Critique rounds: 1 round on 18 tasks, 2 rounds on 14 tasks. The 4
tasks still failing after critique are D27, D28, D29, and D30, all
unfixable by design with reasons logged (division by zero twice,
recall of a key never stored, and a search with no matching entry).

Tests: 17 Deep tests, 52 in total with Learn and Build.

Named limits: running on the Muse VM instead of BlackBoxV2, seeded
synthetic errors on a same-author suite, critic and executor sharing
tools, toy scale, a steps-only cost model, no cross-task persistence
case in the Deep suite, and revision as a clean re-run rather than a
targeted correction.

## Honest limits

- Synthetic suites only. Learn uses 8 tasks, Build uses 20 tasks,
  and Deep uses 32 tasks, all written by the same author as the
  agent and the critic. No claim about scale or real-world accuracy
  is made or implied.
- The planner and the critic are deterministic code, not LLMs, at
  every level in v1.0. There is no language model, no API, and no
  credential anywhere in this repo.
- The seeded Deep errors are designed, not observed in the wild.
  They prove the critic catches these six named slip kinds on this
  suite. They do not prove it catches errors it was not designed
  around.
- The critic and the executor share the same tools. A bug inside a
  tool itself would produce the same wrong value in both stages and
  pass critique. Hand checks and unit tests pin the tool factors
  from outside the shared code for that reason.
- Revision is a clean re-run, not a targeted correction. It spends
  a full re-run on a one-step slip and cannot fix a task whose
  clean run also fails.
- Memory at Build is one JSON file with no locking. Deep tasks run
  in isolation, so the Deep suite does not test cross-task
  persistence.
- Compressed Deep is not the full v2 Deep scope. The remainder is
  the named v1.1 backlog in ROADMAP.md.
- The runs executed on the Muse VM, not the assigned BlackBoxV2
  node.

## Where to go next

- Tutorial: fanout/tutorial.md in the repo, a step-by-step module
  that runs all three levels and the full test suite.
- Releases: v0.1 (Learn), v0.5 (Build), v1.0 (Learn, Build,
  compressed Deep) on the GitHub repo linked above.
- Book chapter: "One Agent, No Framework" per SPEC.md, held as a
  draft angle in this fan-out set.
- License: code Apache-2.0, tutorials CC BY 4.0.
