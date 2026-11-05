# Level 2, Build: agent-from-scratch

Status: DONE (2026-11-05). A plan-then-execute agent with no
framework, built with the Python standard library only. The design
was written first, in BUILD-SPEC.md in this folder.

## Honest scope line

The planner in this level is a deterministic, scripted policy. It
is not an LLM, it calls no API, and it does not learn. It builds a
plan from the task type and fields by fixed rules. That is the
same honesty rule as Learn: the value of this level is the
planning, memory, and recovery machinery around the planner, not
a claim about intelligence.

## Method

1. Plan before execution. Planner.plan(task) emits the whole plan
   up front: ordered steps, each with a tool name, a purpose, and
   arguments. The plan is stored in every task result, and
   execution follows it in order. A step argument of "$prev" is
   replaced at execution time with the previous observation, which
   is how chains pass values between steps.
2. One replan at most. When a step fails, the agent may replan
   once. A second failure aborts the task. There is no retry loop.
3. Persistent memory. MemoryStore is a dict bound to a JSON file:
   it loads on start and saves on every write. One suite run
   shares one store, so memory survives across tasks, and two
   Agent instances that share a file see the same memory. The
   Learn remember and recall tools work through it unchanged,
   because it is a dict.
4. Recovery by error class, logged by name. retry_correct for a
   bad argument shape when the task carries corrected arguments;
   fallback_tool when kb_lookup misses a key and the task carries
   a fallback query, switching the step to kb_search; skip_step
   when an optional step fails, dropping it and continuing; abort
   for unrecoverable errors such as division by zero, a recall of
   a key never stored, or a failure after the one replan.
5. Tools. Reused from Learn, loaded from level-1-learn/agent.py:
   calculator, kb_lookup, word_count, remember, recall. New in
   Build: unit_converter (km_to_miles, miles_to_km, c_to_f, f_to_c,
   kg_to_lb, lb_to_kg, using the exact factors 1.609344 km per
   mile and 0.45359237 kg per pound) and kb_search (keyword
   overlap scoring over the knowledge base values, returning the
   best entry key).

## Run it

    python level-2-build/run_build.py
    python -m unittest discover -s tests

The runner uses a temporary memory file for the suite and writes
level-2-build/results_build.json deterministically: run it twice
and the file is identical (verified by diff).

## Results (measured 2026-11-05, Muse VM, Python 3.12)

All numbers below come from level-2-build/results_build.json.

| Measure | Result |
| --- | --- |
| Tasks matched expectations | 20 of 20 |
| Tasks succeeded | 18 of 20 |
| Expected-failure tasks that failed as expected | 2 of 2 |
| Success rate on expected-success tasks | 1.0 (18 of 18) |
| Mean steps per task | 1.5 |
| Replans used | 3 |
| Recovery: retry_correct | 1 |
| Recovery: fallback_tool | 1 |
| Recovery: skip_step | 1 |
| Recovery: abort | 2 |

Per category, passed of total:

| Category | Passed |
| --- | --- |
| single_tool | 2 of 2 |
| kb_search | 2 of 2 |
| converter | 4 of 4 |
| multi_step | 4 of 4 |
| memory_persistence | 3 of 3 |
| recovery | 3 of 3 |
| expected_failure | 2 of 2 |

Unit tests: 19 Build tests in tests/test_build_agent.py, all
passing, and 35 tests in the full suite (16 Learn plus 19 Build),
all passing, plus the scaffold smoke test.

Hand checks: 10 km is 10 / 1.609344 = 6.2137119224 miles rounded
to 10 places. 100 degrees Celsius is 100 * 9/5 + 32 = 212 degrees
Fahrenheit. 10 kg is 10 / 0.45359237 = 22.0462262185 pounds
rounded to 10 places. 9 * 9 = 81, 3 * 5 = 15, 6 * 7 = 42.

## Failure modes and limits

- The planner is scripted per task type. An unseen task type
  fails at planning time. It cannot invent a plan, and the plan
  can only chain steps its rules already know.
- Recovery is bounded: one replan per task. A task whose
  corrected arguments are also wrong aborts, by design, and a
  test pins that bound.
- abort is final. Division by zero and recall of a missing key
  end the task as failed; nothing retries them silently.
- kb_search is keyword overlap over a five-entry toy knowledge
  base. Ties break by entry order. It is not semantic search,
  and a query with no overlapping words raises an error.
- The task suite is synthetic and written by the same author as
  the agent, so a perfect score shows the machinery works on
  known cases, not that it generalises. The outside evaluation
  in P06 exists for that reason.
- Memory is one JSON file with no locking. Two processes writing
  at once can lose updates, and nothing expires or is validated
  beyond JSON shape.
- The unit converter rounds to 10 decimal places, which is a
  stated precision limit, not full float accuracy.
- This level was run on the Muse VM (CPU), not on its fleet
  node BlackBoxV2.

## What Deep adds next

A self-critique loop and an agent evaluation suite with scored
tasks, per SPEC.md, plus the failure taxonomy write-up shared
with the P06 Deep track.
