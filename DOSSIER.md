# DOSSIER: agent-from-scratch (P07) v1, 2026-11-04

Written under the documentation and publishing standard (past, present, future). Updated at ship time.

## Past

Prior art for this project is named in NOVELTY.md (framework agent examples (LangGraph class)). The history of the problem, the key papers and systems, and what was tried before are recorded in the Roadmap v2 section text in SPEC.md and will be expanded with dated sources at the project's wave, before Build opens.

## Present

Current demand evidence: hiring value 4 of 5 (agents in 12/56) [confirmed, fleet and scoring pass 2026-11-04; for P23 to P29, the decision pack 2026-11-04]. The Round 3 research (2026-11-04) found the market centre at post-training, evals, environments, and inference depth [confirmed as the research finding; the report is at ~/workspace/research_notes/roadmap-v3-revaluation-research-20261104-0949/report.md]. Tools and versions are pinned at Build time, not in this v1.

Build ship state (2026-11-05): Level 1 Learn and Level 2 Build are both DONE. Build is a plan-then-execute agent (deterministic planner, not an LLM) with an explicit plan stored per result, at most one replan per task, a JSON file-backed persistent MemoryStore, recovery strategies logged by name (retry_correct, fallback_tool, skip_step, abort), and two new tools (unit_converter, kb_search) alongside the five Learn tools it reuses. Measured on the Muse VM with Python 3.12: 20 of 20 suite tasks matched expectations, success rate 1.0 on the 18 expected-success tasks, mean 1.5 steps per task, recovery counts retry_correct 1, fallback_tool 1, skip_step 1, abort 2, and 35 unit tests passing in the full suite (16 Learn plus 19 Build). Results live in level-2-build/results_build.json, identical across two runs.

Deep ship state (2026-11-05): Level 3 Deep is DONE at compressed scope, release v1.0. A self-critique loop (deterministic critic, not an LLM) independently recomputes each draft answer with the tools, re-lookups knowledge base facts, checks memory against the store snapshot, and checks plan completeness, then revises by clean re-run within a bound of 2 critique rounds. On a 32-task scored suite written before the run (14 clean, 14 critique-target with seeded first-pass errors, 4 expected-failure), success on the 28 expected-success tasks is 0.5357 without critique and 1.0 with critique, mean steps 1.3438 versus 2.0, false-critique rate 0.0 (0 of 15 correct drafts), critique outcomes matched pre-run labels on 32 of 32 tasks, and the 4 expected-failure tasks stay failing as unfixable with reasons logged. Results live in level-3-deep/results_deep.json, identical across two runs. Full suite: 52 unit tests passing. Grade 7,900 of 10,000 with itemized deductions in the Deep README (largest: minus 600 for seeded synthetic errors on a same-author suite, minus 450 because critic and executor share tools). The rest of the v2 Deep scope is the v1.1 backlog in ROADMAP.md.

## Future

Next steps are the v1.1 backlog in ROADMAP.md (natural error study, independent critic tools, targeted revision, cross-task Deep cases, larger scale, failure taxonomy write-up with P06, critique bounds study). Any forecast about this field is [unverified] unless a dated primary source is added here at the wave update.
