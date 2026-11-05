# Level 1, Learn: agent-from-scratch

Status: DONE (2026-11-05). A tool-using agent loop with no framework,
built with the Python standard library only.

## Honest scope line

The planner in this level is a deterministic, scripted policy. It is
not an LLM, it calls no API, and it does not learn. It reads the task
type and emits the next tool call from a fixed rule. A real LLM
planner is Build level scope.

## Method

1. Tool registry with validation. Five tools are registered by name:
   calculator, kb_lookup, word_count, remember, and recall. Each tool
   validates its arguments first. An unknown tool name or a bad
   argument raises a named ToolError.
2. Calculator safety. The calculator parses arithmetic with the ast
   module and walks only numeric constants, the arithmetic operators,
   and unary plus and minus. It never uses eval, so a function call
   or a name in an expression is rejected.
3. Knowledge base. kb_lookup reads a small labelled dict with five
   entries: agent, tool, memory, planning, and loop. A miss raises
   ToolError.
4. Memory. remember and recall share an in-memory dict that lives
   for one task run. Recall of a missing key raises ToolError.
5. Agent loop. Plan, act, observe, repeat. The deterministic policy
   chooses the next call, the loop executes it, records the
   observation in a step trace, and continues until the policy has
   no next call or max_steps (10 by default) is reached.
6. Error recovery. On ToolError the loop records the error and the
   policy retries once with corrected arguments. If the retry
   succeeds, the task is marked recovered. If the retry also fails,
   the task ends as failed. The loop never retries in a circle.

## Run it

    python level-1-learn/run_learn.py
    python -m unittest tests.test_learn_agent -v
    python tests/test_smoke.py

The runner writes level-1-learn/results_learn.json deterministically:
run it twice and the file is identical (verified by hash).

## Results (measured 2026-11-05, Muse VM, Python 3.12)

| Task | Type | Steps | Tools used | Recovered | Success | Answer |
| --- | --- | --- | --- | --- | --- | --- |
| T01 | calculator | 1 | calculator | no | yes | 84 |
| T02 | calculator | 1 | calculator | no | yes | 25 |
| T03 | lookup | 1 | kb_lookup | no | yes | An agent is a system that perceives, plans, and acts using tools to complete a task. |
| T04 | word_count | 1 | word_count | no | yes | 6 |
| T05 | memory | 2 | remember, recall | no | yes | agent-from-scratch |
| T06 | multi_step | 3 | calculator, remember, recall | no | yes | 42 |
| T07 | recovery | 2 | calculator, calculator | yes | yes | 81 |
| T08 | unrecoverable | 2 | calculator, calculator | no | no (as expected) | none |

Summary: 8 of 8 tasks matched their expected answer and their
expected success or failure label. 7 succeeded, 1 failed as designed
(T08, division by zero), 1 recovered after a bad argument (T07).
Unit tests: 16 tests, all passing, plus the scaffold smoke test.

Hand checks: 12 * (3 + 4) = 84. 15 / 3 + 2 * 10 = 5 + 20 = 25.
6 * 7 = 42. 9 * 9 = 81. The sentence in T04 has 6 words.

## Failure modes and limits

- The policy is scripted per task type. An unseen task type raises
  ToolError and the task fails. It cannot invent a plan.
- Recovery is one retry only, and only a task that carries corrected
  arguments can truly correct itself. Other failures retry the same
  call once and then fail, as T08 shows.
- Memory is in-memory only and resets per task. Nothing persists
  across runs.
- The knowledge base has five entries. Every other key is a miss.
- The calculator handles arithmetic only. Names, calls, and other
  syntax are rejected by design.
- max_steps bounds every run, so no task can loop forever, but a
  task cut by max_steps is reported as failed, not as partial.
- This level was run on the Muse VM (CPU), not on its fleet node
  BlackBoxV2. That costs a grade deduction, named in the grade.

## What Build adds next

A real LLM planner behind the same tool registry and loop, persistent
memory, and a wider task suite. See the root README level map.
