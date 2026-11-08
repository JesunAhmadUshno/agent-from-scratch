# PROPOSAL: agent-from-scratch (P07)

Status: NOT PRE-REGISTERED. This file gathers the plans as they were
committed. None of them carries a hypothesis with a numeric pass line
committed before the code and results it governs: SPEC.md (2026-11-04,
commit 4dbc1db) came before any code but holds scope and acceptance
criteria only; BUILD-SPEC.md and DEEP-SPEC.md say "written before the
code" but were committed in the same commits as the code and results
(17a20e0, c777ecc). The per-task labels in level-3-deep/tasks_deep.json
(expected answer, expected success with and without critique, expected
critique outcome) were likewise committed with the results. So no tag
proposal-v1 is placed, and the repo is capped at Functional until a
locked confirmatory cycle (see "Next cycle" below) lifts the cap.
Assembled on 2026-11-08 from SPEC.md, DOSSIER.md, NOVELTY.md,
level-2-build/BUILD-SPEC.md and level-3-deep/DEEP-SPEC.md, whose text
follows unchanged apart from the removal of grades (grades are internal).

## Question

Inside one agent built with no framework, does a bounded, tool-grounded
self-critique loop fix first-pass errors, and at what cost in tool
steps? (Stated at migration, 2026-11-08; the research review of
2026-11-07 named it as the implicit question that was never written
down as a falsifiable one.)

Boundary: P07 is one agent's internals; P08 is many agents coordinated.
The P06 agent track scores this agent from outside; this project's own
suite stays as its inside check.

## Next cycle (what would lift the cap)

From the research review, remaining gap 5: pre-register a hypothesis
with an expected effect size and a stopping rule before any run with a
stochastic or language-model planner, on tasks written by someone other
than the author. That needs GPU time or a paid API, so it waits for the
Owner. The open work list is in REPORT.md, "v1.1 backlog".

## SPEC (from SPEC.md, 2026-11-04, commit 4dbc1db)

Phase skill: spec-driven-development (house engineering pipeline).
Status: Wave 0 scaffold spec, from Roadmap v2 text and the v3 decision pack. Scope and acceptance criteria below are the v2 section text, kept as the source of truth until the project's wave opens its own spec pass.

Fleet node: BlackBoxV2. Wave: Wave 3.
Hiring evidence: 4 of 5 (agents in 12/56) [confirmed, fleet and scoring pass 2026-11-04, or the decision pack for P23 to P29].

### Project section text (Roadmap v2, or the v3 candidate text for P23 to P29)

agent-from-scratch: KEEP

Subject: AI agents. v1 levels carry over: a tool-using agent loop with no framework; memory, step planning, error recovery; Deep adds a self-critique loop and an agent evaluation suite with scored tasks. The P06 agent track scores this agent from outside; this project's own suite stays as its inside check.
Fan-out: Book chapter "One Agent, No Framework". Paper angle: an agent failure taxonomy note (shared data with the P06 Deep track, one write-up). Course module: P07-agent-from-scratch.

### Acceptance criteria (scaffold level)

- Learn closes when the level-1-learn code runs, its README teaches the idea, and a fresh-eyes reader can follow it.
- Build closes when the system runs end to end, tests pass, and one benchmark or result table with method is in the README.
- Deep closes when the Deep scope in the section text is done, the failure modes are written, and the dossier is updated to ship state.
- No level closes on a claim. Evidence only: code, tests, numbers, links.

## Dossier (from DOSSIER.md v1, 2026-11-04, updated at ship time)

Written under the documentation and publishing standard (past, present, future). Updated at ship time.

### Past

Prior art for this project is named in NOVELTY.md (framework agent examples (LangGraph class)). The history of the problem, the key papers and systems, and what was tried before are recorded in the Roadmap v2 section text in SPEC.md and will be expanded with dated sources at the project's wave, before Build opens.

### Present

Current demand evidence: hiring value 4 of 5 (agents in 12/56) [confirmed, fleet and scoring pass 2026-11-04; for P23 to P29, the decision pack 2026-11-04]. The Round 3 research (2026-11-04) found the market centre at post-training, evals, environments, and inference depth [confirmed as the research finding; the report is at ~/workspace/research_notes/roadmap-v3-revaluation-research-20261104-0949/report.md]. Tools and versions are pinned at Build time, not in this v1.

Build ship state (2026-11-05): Level 1 Learn and Level 2 Build are both DONE. Build is a plan-then-execute agent (deterministic planner, not an LLM) with an explicit plan stored per result, at most one replan per task, a JSON file-backed persistent MemoryStore, recovery strategies logged by name (retry_correct, fallback_tool, skip_step, abort), and two new tools (unit_converter, kb_search) alongside the five Learn tools it reuses. Measured on the Muse VM with Python 3.12: 20 of 20 suite tasks matched expectations, success rate 1.0 on the 18 expected-success tasks, mean 1.5 steps per task, recovery counts retry_correct 1, fallback_tool 1, skip_step 1, abort 2, and 35 unit tests passing in the full suite (16 Learn plus 19 Build). Results live in level-2-build/results_build.json, identical across two runs.

Deep ship state (2026-11-05): Level 3 Deep is DONE at compressed scope, release v1.0. A self-critique loop (deterministic critic, not an LLM) independently recomputes each draft answer with the tools, re-lookups knowledge base facts, checks memory against the store snapshot, and checks plan completeness, then revises by clean re-run within a bound of 2 critique rounds. On a 32-task scored suite written before the run (14 clean, 14 critique-target with seeded first-pass errors, 4 expected-failure), success on the 28 expected-success tasks is 0.5357 without critique and 1.0 with critique, mean steps 1.3438 versus 2.0, false-critique rate 0.0 (0 of 15 correct drafts), critique outcomes matched pre-run labels on 32 of 32 tasks, and the 4 expected-failure tasks stay failing as unfixable with reasons logged. Results live in level-3-deep/results_deep.json, identical across two runs. Full suite: 52 unit tests passing. The largest threats are seeded synthetic errors on a same-author suite and a critic that shares tools with the executor (REPORT.md, Threats to validity). The rest of the v2 Deep scope is the v1.1 backlog (now in REPORT.md).

### Future

Next steps are the v1.1 backlog (now in REPORT.md) (natural error study, independent critic tools, targeted revision, cross-task Deep cases, larger scale, failure taxonomy write-up with P06, critique bounds study). Any forecast about this field is [unverified] unless a dated primary source is added here at the wave update.

## Novelty (from NOVELTY.md)

Status: DRAFT, PROPOSED. Not verified. This text does not move into any public post, paper, or profile until the Jev claim_check gate passes on the exact text.

### Proposed claim

Against framework agent examples (LangGraph class): this project aims to differ in the way its SPEC.md section text defines (a from-zero or self-hosted build, measured in public, on a named home fleet, with the failure modes written down). The exact difference is stated at the project's wave, after the prior art is re-read.

### Prior art table

| Prior art | What it does | What this project does differently | Measured difference |
| --- | --- | --- | --- |
| framework agent examples (LangGraph class) | See DOSSIER.md, Past | PROPOSED, see the claim above | NO MEASUREMENT YET |

### Honest size

If the novelty proves small, this file will say so and name the real value instead (a cleaner reproduction, a better benchmark, a first public dataset). No novelty is invented to fill this section.

## Build plan (from level-2-build/BUILD-SPEC.md, committed with the Build code in 17a20e0)

Status: written before the Build code, 2026-11-05, ROADMAP-V3-BATCH.

### Scope

A plan-then-execute agent with no framework, Python standard library
only. It extends Level 1 Learn, reusing its calculator, kb_lookup,
word_count, remember, and recall tools and its knowledge base.

In scope:

1. Explicit planning. A deterministic Planner emits a plan before any
   execution: an ordered list of steps, each with a tool name, a
   purpose, and arguments. The plan is stored in every task result.
   Execution follows the plan in order.
2. Replanning. At most one replan per task, and only when a step
   fails and a named recovery strategy applies.
3. Persistent memory. A JSON file-backed MemoryStore loads on start
   and saves on every write. It survives across tasks in one suite
   run and across Agent instances that share the same file. The
   Learn remember and recall tools keep working through it.
4. Recovery strategies, chosen by error class and logged by name:
   retry_correct, fallback_tool, skip_step, and abort.
5. New tools: unit_converter and kb_search.
6. A labelled suite of 20 tasks, a deterministic runner, and unit
   tests for the behaviours above.

Out of scope: any LLM, any API call, any third-party package, a
self-critique loop, and an outside evaluation harness. Those are
Deep level or P06 scope. The planner in this level is a
deterministic policy, not an LLM, and the docs say so plainly.

### Design

#### Planner

Planner.plan(task) returns the full plan up front from the task
type and fields. Step arguments may carry the placeholder "$prev",
which execution replaces with the previous step observation. That
is how chains pass a calculator result into remember, a kb_search
result key into kb_lookup, and a converter result into memory.

#### Execution and recovery

The Agent walks the current plan in order. On a ToolError it
classifies the error and picks one strategy:

- retry_correct: the error is a bad argument shape and the task
  carries corrected_args. The replan replaces the failed step
  arguments with the corrected ones and retries the step.
- fallback_tool: the failed step is kb_lookup with a missing key
  and the task carries a fallback_query. The replan replaces the
  step with kb_search on that query.
- skip_step: the failed step is marked optional. The replan drops
  the step and execution continues with the next step.
- abort: the error is unrecoverable, for example division by zero
  or a recall of a key that was never stored, or a second failure
  after the one allowed replan. The task ends as failed.

Every recovery is recorded by name in the result, with the replan
count. A recovery that lets the task finish marks it recovered.

#### MemoryStore

MemoryStore is a dict subclass bound to a JSON file path. On start
it loads the file if it exists (an absent or empty file means an
empty store). Every write through item assignment saves the whole
store back to the file as JSON. With no path it behaves as a plain
in-memory dict, which unit tests use for isolated tools.

#### Tools

Reused from Learn, loaded from level-1-learn/agent.py: calculator
(ast based, never eval), kb_lookup, word_count, remember, recall.

New in Build:

- unit_converter: arguments value and conversion, one of
  km_to_miles, miles_to_km, c_to_f, f_to_c, kg_to_lb, lb_to_kg.
  Exact defining factors: 1 mile is 1.609344 km, 1 pound is
  0.45359237 kg, and the Celsius and Fahrenheit scales use
  multiply by 9/5 plus 32 and its inverse. Results are rounded to
  10 decimal places, and a whole result is returned as an int.
- kb_search: argument query. It tokenizes the query and each KB
  value into lowercase word sets, scores each entry by keyword
  overlap with the value, and returns the key of the best entry.
  Ties break by knowledge base order. No overlap raises ToolError.

### Task suite

level-2-build/tasks_build.json holds 20 tasks written before the
run. Each task has id, description, category, type,
expected_answer (which may be null), and expected_success.
Coverage: multi-step chains, memory persistence across tasks in
the same suite run (a later task recalls a value an earlier task
stored), each recovery strategy at least once, converter tasks,
kb_search tasks, and at least 2 expected-failure tasks.

### Acceptance criteria

- python3 -m unittest discover -s tests passes, including at
  least 16 new Build unit tests.
- The runner writes level-2-build/results_build.json and the
  file is identical across two runs (no wall time fields).
- Every number in the level README comes from results_build.json.
- The plan in each result matches the tools executed, apart from
  steps a logged replan replaced, dropped, or retried.
- Em dash count is 0 in every file touched.
- The level ships through a pull request with green CI, a merge,
  and release v0.5.

## Deep plan (from level-3-deep/DEEP-SPEC.md, committed with the Deep code and results in c777ecc)

Status: written before the Deep code, 2026-11-05, ROADMAP-V3-BATCH.
Compressed Deep under the December Compression Protocol: the single
hardest capability in SPEC.md is built here. The rest of the v2 Deep
scope goes to the v1.1 backlog (repo-root ROADMAP.md then, REPORT.md now).

### Scope

A self-critique loop plus an agent evaluation suite with scored
tasks, on top of the Level 2 Build plan-then-execute agent. Python
standard library only. No framework, no LLM, no API call.

The planner and the critic are deterministic code, not LLMs. That
is stated plainly here, in the code, and in the README. The value
is the verification and revision machinery, not a claim about
intelligence.

In scope:

1. Draft stage. The Build agent produces a draft result per task.
   For critique-target tasks, a seeded first-pass draft policy
   plausibly errs: it drops a term in multi-step arithmetic, uses
   the inverted unit conversion, returns the wrong knowledge base
   entry, recalls a stale memory value instead of the fresh
   computed value, counts a truncated text, or stops after the
   first plan step. Each seeded error kind is named in the task
   file (draft_error and its parameters), written before the run.
2. Critic stage. A Critic verifies each draft with independent
   checks that do not re-print the executor answer:
   - recompute arithmetic with the calculator tool directly,
   - recompute conversions with the unit converter directly,
   - re-lookup knowledge base facts and re-run keyword search,
   - recount words with the word count tool,
   - check memory recall against the memory store snapshot,
   - check plan-step completeness against a fresh plan from the
     Build planner for the same task.
   The critic computes its expected value from the task fields
   and the tools, never from the draft answer.
3. Revision. On a failed critique the agent revises once per
   critique round by re-running the task with the clean Build
   agent (no seeded draft error), then the critic checks again.
   The bound is MAX_CRITIQUE_ROUNDS = 2 critique rounds per task.
   A task still failing after the bound stays failed, with the
   reason logged. A critique that finds the draft unfixable
   (the independent recompute itself fails, for example division
   by zero) stops revision and logs flag_unfixable.
4. Logging. Every critique verdict and every revision is logged
   per task in results_deep.json: round number, check results,
   issues found, and whether a revision followed.
5. Evaluation suite. level-3-deep/tasks_deep.json holds 32 scored
   tasks written before the run: 14 clean tasks, 14
   critique-target tasks, and 4 expected-failure tasks
   (categories clean, critique_target, expected_failure). Each task labels in
   advance: expected_answer, expected_success (with critique),
   expected_without_critique_success, and
   expected_critique_outcome (pass, flag_then_fix,
   flag_then_fix_plan, flag_unfixable).

### Metrics reported

From results_deep.json only:

- success rate without critique versus with critique, same suite,
- critique rounds distribution,
- false-critique rate: correct drafts flagged by the critic,
  divided by the number of correct drafts,
- tasks still failing after max rounds, with reasons,
- mean steps and mean cost per task in both modes (cost is total
  tool steps across draft plus revisions; critique checks are
  counted as critique rounds, not tool steps),
- critique outcome accuracy: tasks whose observed critique
  outcome matches the label written before the run.

### Acceptance criteria

- python3 -m unittest discover -s tests passes, including Deep
  unit tests for critic rules, the revision bound, logging, and
  determinism.
- The runner writes level-3-deep/results_deep.json and the file
  is identical across two runs (no wall time fields).
- Every number in the Deep README comes from results_deep.json.
- Em dash count is 0 in every file touched.
- The level ships through a pull request with green CI, a merge,
  and release v1.0.
- Assigned node is BlackBoxV2. Work run on the Muse VM (CPU)
  is recorded as such in REPORT.md.
