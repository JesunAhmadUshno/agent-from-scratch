# Release notes draft: agent-from-scratch

Status: DRAFT notes for releases that already exist. Dated 2026-11-05.
These notes summarise the existing GitHub releases. No new release is
created by this file.

Releases verified with gh release list on 2026-11-05:
v0.1, v0.5, and v1.0, at the URLs below.

## v0.1, Learn: tool-using agent loop, no framework

URL: https://github.com/JesunAhmadUshno/agent-from-scratch/releases/tag/v0.1

- Core loop built with the Python standard library only: a tool
  registry with validation (calculator, kb_lookup, word_count,
  remember, recall), a safe calculator that parses with the ast
  module and never uses eval, and a plan, act, observe loop with
  one-retry recovery. The planner is deterministic code, not an LLM.
- Measured run: 8 tasks, 8 of 8 matched expectations, 7 succeeded,
  1 failed as designed (T08, division by zero), 1 recovered (T07,
  corrected to 9 * 9 = 81).
- Tests: 16 unit tests in tests/test_learn_agent.py, plus the
  scaffold smoke test.
- Grade: 8,500 of 10,000, per the batch ledger.
- Limits carried in the release: scripted policy per task type,
  in-memory memory only, five-entry knowledge base, arithmetic only.

## v0.5, Build: plan-then-execute, persistent memory, recovery

URL: https://github.com/JesunAhmadUshno/agent-from-scratch/releases/tag/v0.5

- Plan-then-execute agent on the Learn tools: the deterministic
  planner (not an LLM) emits the whole plan up front, the plan is
  stored per result, at most one replan per task, a JSON
  file-backed persistent MemoryStore, and recovery logged by name
  (retry_correct, fallback_tool, skip_step, abort). New tools:
  unit_converter and kb_search.
- Measured run: 20 tasks, 20 of 20 matched expectations, success
  1.0 on the 18 expected-success tasks (18 of 18), mean steps 1.5,
  replans 3, recoveries retry_correct 1, fallback_tool 1,
  skip_step 1, abort 2.
- Tests: 19 Build unit tests, 35 in total with Learn.
- Grade: 8,500 of 10,000, per the batch ledger.
- Limits carried in the release: scripted planner, one JSON file
  with no locking, keyword search only, synthetic same-author suite.

## v1.0, Deep: self-critique loop and scored evaluation suite

URL: https://github.com/JesunAhmadUshno/agent-from-scratch/releases/tag/v1.0

- Compressed Deep under the December Compression Protocol: a
  self-critique loop on the Build agent. The critic is
  deterministic code, not an LLM. It recomputes each draft answer
  independently with the tools, checks memory against the store
  snapshot, and checks plan completeness, then revises by clean
  re-run within a bound of 2 critique rounds.
- Evaluation set: 32 tasks written before the run (14 clean, 14
  critique-target with seeded errors in six named kinds, 4
  expected-failure). Full traces are in
  level-3-deep/results_deep.json, identical across two runs.
- Measured run: success on the 28 expected-success tasks 0.5357
  without critique (15 of 28) and 1.000 with critique (28 of 28);
  critique outcomes matched on 32 of 32 (pass 14, flag_then_fix
  13, flag_then_fix_plan 1, flag_unfixable 4); false-critique rate
  0.0 (0 of 15 correct drafts); total revisions 14; mean steps
  1.3438 without critique and 2.0 with critique.
- Tests: 17 Deep unit tests, 52 in total with Learn and Build.
- Grade: 7,900 of 10,000, deductions itemized in the Deep README
  (total deductions 2,100).
- The rest of the v2 Deep scope is the v1.1 backlog in ROADMAP.md.
  It is not part of v1.0 and is not claimed by these notes.
