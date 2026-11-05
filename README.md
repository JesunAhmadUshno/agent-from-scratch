# agent-from-scratch

A tool-using agent loop built with no framework: prompt, tool call, observe, repeat.

Status: Learn DONE (grade 8,500 of 10,000), Build DONE (grade 8,500 of 10,000), and Deep DONE (grade 7,900 of 10,000) (2026-11-05, ROADMAP-V3-BATCH). Level 3 compressed Deep is built, tested, and measured below: on a 32-task scored suite, success on expected-success tasks rises from 0.5357 without critique (15 of 28) to 1.000 with critique (28 of 28), with critique outcomes matched on 32 of 32, a false-critique rate of 0.0, mean steps 1.3438 without critique and 2.0 with critique, and 4 unfixable tasks still failing by design. The planner and the critic are deterministic code, not LLMs. Release v1.0.
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

## Fan-out

Written fan-out set for v1.0, dated 2026-11-05, in fanout/:

- fanout/blog-post.md: "One Agent, No Framework", the full story
  with the main results claim gated by Jev claim_check (model
  jev-1.13.0, noul 0.76, route REVIEW, no block).
- fanout/tutorial.md: course module P07-agent-from-scratch. Every
  command in it was executed and passed on 2026-11-05 (all three
  runners, all per-level tests, full suite at 52 tests).
- fanout/website-page.md: project page copy only, not published.
- fanout/linkedin-post.md: DRAFT NOT POSTED, link as the
  first-comment line per the LinkedIn rule.
- fanout/paper-candidate.md: failure taxonomy and self-critique
  brief at CANDIDATE. Submission is Jesun's tap, nothing submitted.
- fanout/release-notes.md: draft notes for the live releases
  v0.1, v0.5, and v1.0.

Publicity grades and the channel log are in PUBLICITY.md. Overall
fan-out grade: 9,560 of 10,000. The loop never posts to social:
all social channels are held with named reasons in PUBLICITY.md.

## License

Code: Apache-2.0 (see LICENSE). Tutorials: CC BY 4.0. Ruled in D-V3-11, 2026-11-04.
