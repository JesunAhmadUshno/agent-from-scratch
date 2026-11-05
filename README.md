# agent-from-scratch

A tool-using agent loop built with no framework: prompt, tool call, observe, repeat.

Status: Learn DONE and Build DONE (2026-11-05, ROADMAP-V3-BATCH). Level 2 is built, tested, and measured below: 20 of 20 Build tasks matched expectations, success rate 1.0 on expected-success tasks, mean 1.5 steps, recoveries retry_correct 1, fallback_tool 1, skip_step 1, abort 2. Deep is not started.
Project: P07. Fleet node: BlackBoxV2. Wave: Wave 3. Learn was run on the Muse VM (CPU); see the level README for the named deduction.

## Start here

1. Read SPEC.md for scope and acceptance criteria.
2. Read DOSSIER.md for the past, present, and future of this problem (v1).
3. Read NOVELTY.md for the proposed novelty (DRAFT, pending the Jev claim_check gate).
4. Start at level-1-learn/README.md, then level-2-build, then level-3-deep.

## Level map

- Level 1, Learn: the core idea, built small and clean, with a teaching path.
- Level 2, Build: a real working system other people can run.
- Level 3, Deep: benchmarks, optimization, evaluation, hard cases.

## Benchmarks

Measured 2026-11-05 with level-1-learn/run_learn.py on the Muse VM, Python 3.12. The planner is a deterministic policy, not an LLM.

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

## Novelty

PROPOSED. See NOVELTY.md. The novelty text is a draft until the Jev claim_check gate passes on it.

## License

Code: Apache-2.0 (see LICENSE). Tutorials: CC BY 4.0. Ruled in D-V3-11, 2026-11-04.
