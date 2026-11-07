# Research review

A review of agent-from-scratch against a PhD-level research rubric,
written after v1.0 and the extra Deep analyses. Every number here is
read from a committed file named beside it. Grades are the reviewer's
judgement, not a measurement.

Overall: about 6 of 10 as research (5.5 before the extra analyses),
about 8 of 10 as engineering and teaching. The code is clean,
deterministic, dependency-free and well tested, and the write-ups list
their own limits. The research claim is narrow: the evaluation is
circular by construction, so the headline gain shows that the critic
works on the errors it was built for, not that self-critique helps an
agent in general.

## Scorecard

| Criterion | Grade | Evidence and gap |
| --- | --- | --- |
| Research question | 6 | Implicit: does a bounded, tool-grounded critique loop fix first-pass errors at an acceptable step cost? Never stated as a falsifiable question in the write-ups. |
| Hypotheses | 5 | Pre-run labels per task (expected outcome, expected critique outcome) are written into tasks_deep.json before the run, which is good practice. No stated hypothesis about effect size or about natural errors. |
| Method | 6 | Clear and reproducible: draft, independent recompute, at most 2 critique rounds, clean re-run (level-3-deep/README.md, Method). The critic recomputes from the same task fields the seeded errors live in, which makes the result close to true by construction. |
| Baselines | 5 | One baseline: the same agent without critique. Now also 0, 1, 2 and 3 rounds and clean versus targeted revision (results_deep_rounds.json). No external baseline (no LLM agent, no public benchmark). |
| Statistics and uncertainty | 6 | Added: Wilson 95% intervals (0.3581 to 0.7047 without, 0.8794 to 1.0 with) and exact McNemar p = 0.000244 on 13 versus 0 discordant pairs (results_deep_stats.json). Valid for the seeded suite only. The system is deterministic, so there is no run-to-run variance to report. |
| Reproducibility | 9 | Standard library only, no randomness, no timestamps in results; CI re-runs every runner on Python 3.11 and 3.12 and fails on any diff. A second implementation in JavaScript (site/src/agent.js) reproduces all 60 recorded rows at every site build. |
| Threats to validity | 6 | Named honestly in the Deep README grade (seeded errors -600, shared tools -450, toy scale -350). Construct validity is the main threat: seeded slips are not a sample of real agent errors. |
| Related work | 3 | Not positioned. NOVELTY.md is a draft pending a claim check. See the related-work section below for the minimum set. |
| Limitations | 8 | Explicit in every level README and in ROADMAP.md, with a v1.1 backlog. |
| Engineering rigor | 8 | 52-test v1.0 suite plus tests/test_deep_extras.py, ruff and CodeQL in CI, deterministic artefacts, safe ast-based calculator with no eval. |

## What was fixed now (cheap, CPU, seconds)

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
4. Cross-task memory suite (item 4, and the -200 deduction). Six tasks
   share memory; without critique a stale value leaks from X03 through
   X04 into X05 (4 of 6), with critique 6 of 6 (results_deep_cross.json).
5. Wall-clock timing (part of item 5) in timing_deep.json, kept outside
   the deterministic files.
6. Cross-implementation check. The JavaScript port of the tools,
   planner, draft policy and critic must reproduce every recorded row
   before the site builds (site/src/agent.check.mjs). It was written
   from the Python code, so it is not an independent critic, but it
   would catch a port-specific or platform-specific drift.

## Seeded error taxonomy (item 6, partial)

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

## Remaining gaps and exactly what each needs

1. Natural errors (item 1, the biggest gap). Needs a stochastic or
   language-model planner producing drafts the author did not seed.
   Minimum: an open-weights instruct model (7B to 8B class) served
   locally, the same 32 task prompts plus 100 to 200 new tasks written
   by someone other than the author, about 1 to 3 GPU-hours for 5
   seeds per task. Report the critic's precision and recall on the
   errors that actually occur.
2. Independent critic tools (item 2, -450). Needs a second calculator
   and converter written from the specification, not from the Python
   code (for example a decimal-arithmetic evaluator), plus fault
   injection: deliberately break one tool and show the critic still
   catches it. CPU only, a few hours of work.
3. External benchmark. Needs a public tool-use suite (tau-bench or
   ToolBench style tasks) and a language-model policy to run them; the
   rule planner cannot parse free-form tasks. GPU or paid API budget
   required, so not done here.
4. Scale (item 5, -350). Needs a knowledge base of hundreds of entries
   with near-duplicate keys and multi-step chains of 5 or more tools,
   so retrieval and planning can actually fail. CPU only.
5. Pre-registration of a hypothesis with an expected effect size and a
   stopping rule before any run with a stochastic planner.

## Related work to position against (no claim of novelty is made here)

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

These references should be checked and summarised in DOSSIER.md
before any novelty claim in NOVELTY.md is upgraded from draft.
