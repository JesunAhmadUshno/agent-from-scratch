# agent-from-scratch

**Question.** Inside one agent built with no framework, does a bounded,
tool-grounded self-critique loop fix first-pass errors, and at what cost
in tool steps?

**Headline.** On a 32-task suite whose first-pass errors were seeded by
the author, critique lifts success on the 28 expected-success tasks from
15 of 28 (0.5357, Wilson 95% 0.3581 to 0.7047) to 28 of 28 (1.0, Wilson
95% 0.8794 to 1.0), with 0 false critiques on 15 correct drafts, for 2.0
instead of 1.3438 tool steps per task; this shows the critic catches the
slip kinds it was built for, not that self-critique helps an agent in
general.

**Field.** Software product. **Job family.** AI agent engineering.

**Verdict.** Functional; not pre-registered. Tests pass in CI on Python
3.11 and 3.12, one command re-runs every agent and fails if any results
file changes, and the agents have run end to end on all 60 recorded
tasks (plus the 6-task cross-task suite). No plan with hypotheses and
pass lines was committed before code or results, so the repo is capped
at Functional (METHOD section 7). The planner and the critic are
deterministic code, not language models.

Scope: this repo is one agent's internals (loop, tools, memory,
planning, recovery, critique). Many agents coordinated is P08.

Live dashboard: https://jesunahmadushno.github.io/agent-from-scratch/
(every number is read from the results files at build time; the
playground re-runs the agent in your browser).

## Reproduce

```text
python level-1-learn/run_learn.py && python level-2-build/run_build.py && python level-3-deep/run_deep.py && python level-3-deep/analyze_deep.py --no-timing && git diff --exit-code -- level-1-learn level-2-build level-3-deep
python -m unittest discover -s tests -v
```

Python 3 standard library only, no dependencies, no randomness, no
timestamps in the results files. The first line re-runs every agent and
fails if any committed result changes; CI runs the same steps.

## Lifecycle

- Question: DONE 2026-11-08
- Proposal: OPEN 2026-11-08
- Baseline: DONE 2026-11-05
- Build: DONE 2026-11-05
- Evaluate: OPEN 2026-11-08
- Report: DONE 2026-11-08
- Review: OPEN 2026-11-08
- Release: OPEN 2026-11-08

The question was written down at migration (2026-11-08); the plans in
PROPOSAL.md were committed with or after the code, so the proposal is
not locked. Baseline is the same agent without critique on the same
suite. Evaluate stays open until the Software product profile is met
(coverage report, dependency audit and secret scan) under a locked
proposal. The tags v0.1, v0.5 and v1.0 are the old Learn, Build and
Deep releases, not a v1.0 Released verdict under this standard.

## Layout

| Path | What it holds |
| --- | --- |
| PROPOSAL.md | Question, scope, prior work and the plans as committed (not pre-registered) |
| REPORT.md | Method and results of each stage, extra analyses, threats, misses, open work |
| CHANGELOG.md | Releases v0.1, v0.5, v1.0 and every change since |
| level-1-learn/ | Code: the tool-using loop (agent.py, run_learn.py); evidence: tasks.json; results: results_learn.json |
| level-2-build/ | Code: plan-then-execute agent (agent_build.py, run_build.py); evidence: tasks_build.json; results: results_build.json |
| level-3-deep/ | Code: critic and suite (agent_deep.py, run_deep.py, analyze_deep.py); evidence: tasks_deep*.json, timing_deep.json; results: results_deep*.json |
| tests/ | Unit tests for every stage, the extra analyses and the repo layout (run in CI) |
| docs/decisions/ | Records of hard-to-reverse choices |
| docs/index.md | One-page summary |
| docs/publicity.md | Channel log for the fan-out drafts |
| fanout/ | Dated 2026-11-05 drafts (blog, tutorial, page, post, paper brief, release notes); file references inside them use the pre-v2 layout |
| site/ | The live dashboard, built from the files above; a JavaScript port must reproduce every recorded row before it builds |

The code keeps its stage folder names (decision 0001): code, task
suites and results sit together per stage, so there is no separate
src/, experiments/ or results/ folder. Task suites are inputs written
before each run; results files are regenerated from them by the
runners, and CI fails on any difference.

## License

Code: Apache-2.0 (see LICENSE). Tutorials: CC BY 4.0. Ruled in D-V3-11, 2026-11-04.
