# Tutorial: P07 agent-from-scratch, course module

Module: P07-agent-from-scratch
By Jesun Ahmad Ushno
Date: 2026-11-05
License for this tutorial: CC BY 4.0. Code in the repo: Apache-2.0.

## What you will do

You will clone the agent-from-scratch repo, run all three levels,
run the test suite for each level, and read your own results against
the recorded v1.0 numbers. Every command below exists in the repo as
shipped at v1.0 and was run by the author of this module on
2026-11-05 to verify it. The project needs Python 3.12 and uses the
standard library only. No model, no API, and no credential are
needed. The planner and the critic are deterministic code, not LLMs.

All recorded numbers in this module come from synthetic suites. They
prove the agent loop, the planning and recovery machinery, and the
critique mechanism. They do not prove production quality.

## Step 0: Clone and enter the repo

```text
git clone https://github.com/JesunAhmadUshno/agent-from-scratch.git
cd agent-from-scratch
```

## Step 1: Level 1, Learn, the core loop

Read level-1-learn/README.md first. It explains the tool registry,
the safe calculator, the five-entry knowledge base, in-memory memory,
the plan, act, observe loop, and one-retry recovery.

Run the Learn task set:

```text
python level-1-learn/run_learn.py
```

Run the Learn tests:

```text
python -m unittest tests.test_learn_agent -v
```

Run the scaffold smoke test:

```text
python tests/test_smoke.py
```

Read your results:

- Expected summary: 8 of 8 tasks matched expectations, 7 succeeded,
  1 failed as designed (T08, division by zero), 1 recovered (T07).
- Expected tests: 16 tests, all passing.
- Expected smoke test line: scaffold smoke test PASS.

## Step 2: Level 2, Build, plan-then-execute with recovery

Read level-2-build/README.md and level-2-build/BUILD-SPEC.md. The
planner is deterministic code, not an LLM. It emits the whole plan
up front, allows at most one replan, uses a JSON file-backed
MemoryStore, and logs recovery by name (retry_correct,
fallback_tool, skip_step, abort).

Run the Build task set:

```text
python level-2-build/run_build.py
```

Run the Build tests:

```text
python -m unittest tests.test_build_agent -v
```

Read your results:

- Expected summary: 20 of 20 tasks matched expectations, success
  rate 1.0 on the 18 expected-success tasks, mean steps 1.5, and
  recoveries retry_correct 1, fallback_tool 1, skip_step 1, abort 2.
- The runner writes level-2-build/results_build.json.
- Expected tests: 19 Build tests, all passing.

## Step 3: Level 3, Deep, the self-critique loop

Read level-3-deep/README.md and level-3-deep/DEEP-SPEC.md. The
critic is deterministic code, not an LLM. It recomputes each draft
answer independently with the tools, checks memory against the
store snapshot, and checks plan completeness. Revision is a clean
re-run within a bound of 2 critique rounds.

Run the Deep evaluation:

```text
python level-3-deep/run_deep.py
```

Run the Deep tests:

```text
python -m unittest tests.test_deep_agent -v
```

Read your results:

- The suite holds 32 tasks: 14 clean, 14 critique-target, and 4
  expected-failure.
- Expected summary: with critique 32 of 32 tasks matched all
  expectations, success rate without critique 0.5357 and with
  critique 1.0, false-critique rate 0.0.
- Expected critique outcomes: pass 14, flag_then_fix 13,
  flag_then_fix_plan 1, flag_unfixable 4.
- The runner writes level-3-deep/results_deep.json.
- Expected tests: 17 Deep tests, all passing.

## Step 4: Run the full test suite

```text
python -m unittest discover -s tests -v
```

Expected: 52 tests in total (16 Learn, 19 Build, 17 Deep), all
passing, plus the scaffold smoke test.

## Step 5: Check your understanding

1. Why does the calculator never use eval? (Answer: eval would run
   arbitrary code. The calculator parses with the ast module and
   walks only numeric constants, arithmetic operators, and unary
   plus and minus, so names and function calls are rejected.)
2. Build allows at most one replan. What happens on a second
   failure? (Answer: the task aborts. The bound is pinned by a test,
   so recovery cannot loop.)
3. The Deep critic shares tools with the executor. What class of
   bug can it therefore miss? (Answer: a bug inside a tool itself,
   such as a wrong conversion factor, produces the same wrong value
   in both stages and passes critique. Hand checks pin the factors
   from outside the shared code.)

## Limits to keep with the numbers

- Synthetic suites only, at every level.
- The planner and the critic are deterministic code, not LLMs. No
  external model is used anywhere in this repo.
- The Deep errors are seeded by design, in six named kinds.
- Revision is a clean re-run, not a targeted correction.
