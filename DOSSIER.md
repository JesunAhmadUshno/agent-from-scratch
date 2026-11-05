# DOSSIER: agent-from-scratch (P07) v1, 2026-11-04

Written under the documentation and publishing standard (past, present, future). Updated at ship time.

## Past

Prior art for this project is named in NOVELTY.md (framework agent examples (LangGraph class)). The history of the problem, the key papers and systems, and what was tried before are recorded in the Roadmap v2 section text in SPEC.md and will be expanded with dated sources at the project's wave, before Build opens.

## Present

Current demand evidence: hiring value 4 of 5 (agents in 12/56) [confirmed, fleet and scoring pass 2026-11-04; for P23 to P29, the decision pack 2026-11-04]. The Round 3 research (2026-11-04) found the market centre at post-training, evals, environments, and inference depth [confirmed as the research finding; the report is at ~/workspace/research_notes/roadmap-v3-revaluation-research-20261104-0949/report.md]. Tools and versions are pinned at Build time, not in this v1.

Build ship state (2026-11-05): Level 1 Learn and Level 2 Build are both DONE. Build is a plan-then-execute agent (deterministic planner, not an LLM) with an explicit plan stored per result, at most one replan per task, a JSON file-backed persistent MemoryStore, recovery strategies logged by name (retry_correct, fallback_tool, skip_step, abort), and two new tools (unit_converter, kb_search) alongside the five Learn tools it reuses. Measured on the Muse VM with Python 3.12: 20 of 20 suite tasks matched expectations, success rate 1.0 on the 18 expected-success tasks, mean 1.5 steps per task, recovery counts retry_correct 1, fallback_tool 1, skip_step 1, abort 2, and 35 unit tests passing in the full suite (16 Learn plus 19 Build). Results live in level-2-build/results_build.json, identical across two runs. Deep is not started.

## Future

Open problems and the project's next steps sit in the Deep level scope in SPEC.md. Any forecast about this field is [unverified] unless a dated primary source is added here at the wave update.
