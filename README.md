# agent-from-scratch

A tool-using agent loop built with no framework: prompt, tool call, observe, repeat.

Status: Learn DONE, Build DONE, and Deep DONE (2026-11-05, ROADMAP-V3-BATCH). Level 3 compressed Deep is built, tested, and measured below: on a 32-task scored suite, success on expected-success tasks rises from 0.5357 without critique to 1.0 with critique, with 0 false critiques and 4 unfixable tasks still failing by design. Release v1.0.
Project: P07. Fleet node: BlackBoxV2. Wave: Wave 3. All levels were run on the Muse VM (CPU); see the level READMEs for the named deduction.

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
| Deep tasks in scored suite | 32 (14 clean, 14 critique-target, 4 expected-failure) |
| Deep success rate without critique | 0.5357 (15 of 28 expected-success) |
| Deep success rate with critique | 1.0 (28 of 28 expected-success) |
| Deep critique outcomes matched | 32 of 32 |
| Deep false-critique rate | 0.0 (0 of 15 correct drafts) |
| Deep mean steps | 1.3438 without critique, 2.0 with critique |
| Full test suite at Deep ship | 52 passed (16 Learn plus 19 Build plus 17 Deep) |
| Determinism (Deep) | results_deep.json identical across two runs (diff verified) |
| Deep grade | 7,900 of 10,000 (deductions in the Deep README) |

The rest of the v2 Deep scope is the v1.1 backlog in ROADMAP.md.

## Novelty

PROPOSED. See NOVELTY.md. The novelty text is a draft until the Jev claim_check gate passes on it.

## License

Code: Apache-2.0 (see LICENSE). Tutorials: CC BY 4.0. Ruled in D-V3-11, 2026-11-04.
