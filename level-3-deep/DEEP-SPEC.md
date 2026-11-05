# DEEP-SPEC: Level 3 Deep, agent-from-scratch (P07)

Status: written before the Deep code, 2026-11-05, ROADMAP-V3-BATCH.
Compressed Deep under the December Compression Protocol: the single
hardest capability in SPEC.md is built here. The rest of the v2 Deep
scope goes to the repo-root ROADMAP.md as the v1.1 backlog.

## Scope

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

## Metrics reported

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

## Acceptance criteria

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
  carries the named node deduction in the grade.
