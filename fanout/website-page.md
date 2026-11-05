# Website project page copy: agent-from-scratch

Site: jesunahmadushno.com
Status: COPY ONLY, draft for the project page. Dated 2026-11-05.
Nothing on any website was changed by this file.

## Headline

agent-from-scratch: a tool-using agent loop, planning, recovery, and self-critique, with no framework

## Summary

agent-from-scratch is an open agent project built by Jesun Ahmad
Ushno as project P07 in Roadmap v3. It builds the agent stack in
three levels: a tool-using loop with a safe calculator and cited
tool results, a plan-then-execute agent with persistent JSON memory
and recovery logged by name, and a self-critique loop where an
independent deterministic critic recomputes each draft answer and
triggers a bounded clean re-run. It runs on the Python standard
library only. The planner and the critic are deterministic code,
not LLMs. No language model, no API, and no credential are used.

Status: v1.0, 2026-11-05. Learn, Build, and compressed Deep are
done. Total tests: 52, all passing at v1.0. Level grades: Learn
8,500 of 10,000, Build 8,500 of 10,000, Deep 7,900 of 10,000.

## Results

All results below are measured runs on synthetic suites, recorded
in the level READMEs in the GitHub repo. They prove the agent loop,
the planning and recovery machinery, and the critique mechanism,
not production quality.

| Level | Set | Headline result | Notes |
| --- | --- | --- | --- |
| Learn | 8 tasks | 8 of 8 matched expectations, 7 succeeded, 1 recovered | T08 fails by design (division by zero); 16 tests |
| Build | 20 tasks | 20 of 20 matched, success 1.0 on 18 expected-success tasks, mean steps 1.5 | Recoveries retry_correct 1, fallback_tool 1, skip_step 1, abort 2; 19 tests, 35 total |
| Deep (compressed) | 32 tasks (14 clean, 14 critique-target, 4 expected-failure) | Success on 28 expected-success tasks 0.5357 without critique (15 of 28) to 1.000 with critique (28 of 28) | Outcomes matched 32 of 32; false-critique rate 0.0 (0 of 15); mean steps 1.3438 without, 2.0 with; 17 tests, 52 total |

## Honest limits

- Synthetic suites only, at every level, written by the same author
  as the agent and the critic.
- The planner and the critic are deterministic code, not LLMs.
  There are no dense models and no external model in v1.0.
- The critic and the executor share tools, so a tool-internal bug
  can pass both stages.
- Compressed Deep is not the full v2 Deep scope. The remainder is
  the v1.1 backlog in the repo ROADMAP.md.

## Links

- GitHub repo: https://github.com/JesunAhmadUshno/agent-from-scratch
- Release v0.1 (Learn): https://github.com/JesunAhmadUshno/agent-from-scratch/releases/tag/v0.1
- Release v0.5 (Build): https://github.com/JesunAhmadUshno/agent-from-scratch/releases/tag/v0.5
- Release v1.0 (Learn, Build, compressed Deep): https://github.com/JesunAhmadUshno/agent-from-scratch/releases/tag/v1.0
- Tutorial: fanout/tutorial.md in the GitHub repo
- Blog post draft: fanout/blog-post.md in the GitHub repo

## License note

Code: Apache-2.0. Tutorials: CC BY 4.0.
