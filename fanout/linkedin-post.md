# LinkedIn post draft: P07 agent-from-scratch v1.0

Status: DRAFT NOT POSTED
Date drafted: 2026-11-05
Author: Jesun Ahmad Ushno
Rule for this platform: the link goes in the first comment, not in the
post body. The first comment line is at the end of this file.

## Post body

Frameworks hide the agent loop. So I built one with no framework,
and measured what a self-critique loop actually adds.

agent-from-scratch v1.0 is done: Learn, Build, and a compressed
Deep, Python standard library only. The planner and the critic are
deterministic code, not LLMs. No model, no API, no credential.

Learn: a tool-using loop (calculator, knowledge base lookup, word
count, remember, recall) with one-retry recovery. 8 of 8 tasks
matched expectations, 7 succeeded, and 1 recovered. 16 tests.
Grade 8,500 of 10,000.

Build: plan-then-execute, with the plan stored per result, at most
one replan, persistent JSON memory, and recovery logged by name.
20 of 20 tasks matched, success 1.0 on the 18 expected-success
tasks, mean steps 1.5. 19 tests, 35 in total. Grade 8,500 of
10,000.

Deep (compressed): a self-critique loop. The critic recomputes
each draft answer independently and triggers a bounded clean
re-run. On a 32-task suite, success on the 28 expected-success
tasks rose from 0.5357 without critique (15 of 28) to 1.000 with
critique (28 of 28). Outcomes matched on 32 of 32, false-critique
rate 0.0, mean steps 1.3438 without and 2.0 with. 52 tests in
total. Grade 7,900 of 10,000, with deductions named in the repo.

The honest limits, in the post and not in a footnote: synthetic
suites only, written by the same author as the agent and the
critic; the Deep errors are seeded in six named kinds; the critic
and the executor share tools, so a tool-internal bug can pass both
stages; and revision is a clean re-run, not a targeted correction.
The rest of the Deep scope is named as the v1.1 backlog in the
repo, not claimed as done.

If you build agents: do you verify draft answers by independent
recompute, or do you trust the first pass?

## First comment (post this as the first comment, per the standing rule)

Repo, releases v0.1, v0.5, and v1.0, and the full tutorial: https://github.com/JesunAhmadUshno/agent-from-scratch
