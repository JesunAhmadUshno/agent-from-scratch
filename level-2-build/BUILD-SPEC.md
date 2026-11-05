# BUILD-SPEC: Level 2 Build, agent-from-scratch (P07)

Status: written before the Build code, 2026-11-05, ROADMAP-V3-BATCH.

## Scope

A plan-then-execute agent with no framework, Python standard library
only. It extends Level 1 Learn, reusing its calculator, kb_lookup,
word_count, remember, and recall tools and its knowledge base.

In scope:

1. Explicit planning. A deterministic Planner emits a plan before any
   execution: an ordered list of steps, each with a tool name, a
   purpose, and arguments. The plan is stored in every task result.
   Execution follows the plan in order.
2. Replanning. At most one replan per task, and only when a step
   fails and a named recovery strategy applies.
3. Persistent memory. A JSON file-backed MemoryStore loads on start
   and saves on every write. It survives across tasks in one suite
   run and across Agent instances that share the same file. The
   Learn remember and recall tools keep working through it.
4. Recovery strategies, chosen by error class and logged by name:
   retry_correct, fallback_tool, skip_step, and abort.
5. New tools: unit_converter and kb_search.
6. A labelled suite of 20 tasks, a deterministic runner, and unit
   tests for the behaviours above.

Out of scope: any LLM, any API call, any third-party package, a
self-critique loop, and an outside evaluation harness. Those are
Deep level or P06 scope. The planner in this level is a
deterministic policy, not an LLM, and the docs say so plainly.

## Design

### Planner

Planner.plan(task) returns the full plan up front from the task
type and fields. Step arguments may carry the placeholder "$prev",
which execution replaces with the previous step observation. That
is how chains pass a calculator result into remember, a kb_search
result key into kb_lookup, and a converter result into memory.

### Execution and recovery

The Agent walks the current plan in order. On a ToolError it
classifies the error and picks one strategy:

- retry_correct: the error is a bad argument shape and the task
  carries corrected_args. The replan replaces the failed step
  arguments with the corrected ones and retries the step.
- fallback_tool: the failed step is kb_lookup with a missing key
  and the task carries a fallback_query. The replan replaces the
  step with kb_search on that query.
- skip_step: the failed step is marked optional. The replan drops
  the step and execution continues with the next step.
- abort: the error is unrecoverable, for example division by zero
  or a recall of a key that was never stored, or a second failure
  after the one allowed replan. The task ends as failed.

Every recovery is recorded by name in the result, with the replan
count. A recovery that lets the task finish marks it recovered.

### MemoryStore

MemoryStore is a dict subclass bound to a JSON file path. On start
it loads the file if it exists (an absent or empty file means an
empty store). Every write through item assignment saves the whole
store back to the file as JSON. With no path it behaves as a plain
in-memory dict, which unit tests use for isolated tools.

### Tools

Reused from Learn, loaded from level-1-learn/agent.py: calculator
(ast based, never eval), kb_lookup, word_count, remember, recall.

New in Build:

- unit_converter: arguments value and conversion, one of
  km_to_miles, miles_to_km, c_to_f, f_to_c, kg_to_lb, lb_to_kg.
  Exact defining factors: 1 mile is 1.609344 km, 1 pound is
  0.45359237 kg, and the Celsius and Fahrenheit scales use
  multiply by 9/5 plus 32 and its inverse. Results are rounded to
  10 decimal places, and a whole result is returned as an int.
- kb_search: argument query. It tokenizes the query and each KB
  value into lowercase word sets, scores each entry by keyword
  overlap with the value, and returns the key of the best entry.
  Ties break by knowledge base order. No overlap raises ToolError.

## Task suite

level-2-build/tasks_build.json holds 20 tasks written before the
run. Each task has id, description, category, type,
expected_answer (which may be null), and expected_success.
Coverage: multi-step chains, memory persistence across tasks in
the same suite run (a later task recalls a value an earlier task
stored), each recovery strategy at least once, converter tasks,
kb_search tasks, and at least 2 expected-failure tasks.

## Acceptance criteria

- python3 -m unittest discover -s tests passes, including at
  least 16 new Build unit tests.
- The runner writes level-2-build/results_build.json and the
  file is identical across two runs (no wall time fields).
- Every number in the level README comes from results_build.json.
- The plan in each result matches the tools executed, apart from
  steps a logged replan replaced, dropped, or retried.
- Em dash count is 0 in every file touched.
- The level ships through a pull request with green CI, a merge,
  and release v0.5.
