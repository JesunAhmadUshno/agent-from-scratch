# agent-from-scratch

A tool-using agent loop built with no framework: prompt, tool call, observe, repeat. Built in three levels with measured results at each level. The planner and the critic are deterministic policies, not LLMs: they call no API and learn nothing. That is stated plainly in every level README.

- Learn: the core agent loop, a tool registry with validation, a safe calculator, a small knowledge base, in-memory memory, and one-retry error recovery. 8 of 8 labelled tasks matched expectations.
- Build: a plan-then-execute agent with persistent memory and recovery by error class. 20 of 20 labelled tasks matched expectations, with success 1.000 on expected-success tasks (18 of 18).
- Deep (compressed): a self-critique loop and a scored evaluation suite. On the 28 expected-success tasks, success rises from 15 of 28 without critique to 28 of 28 with critique, with a false-critique rate of 0.0. The critic recomputes each answer independently and never reads the draft answer as its source.

Grades on record (of 10,000): Learn 8,500, Build 8,500, Deep 7,900.

Every number above is already published in this repo (README.md and the level write-ups) and reproduced by the runners in this repo, checked in CI. The full write-ups are in the level folders: level-1-learn, level-2-build, level-3-deep.

Releases: https://github.com/JesunAhmadUshno/agent-from-scratch/releases
