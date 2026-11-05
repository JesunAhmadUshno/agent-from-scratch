# Paper candidate brief: agent failure taxonomy with a self-critique study

Project: P07 agent-from-scratch
Status: CANDIDATE, brief written 2026-11-05
Submission note: submission is Jesun's tap. Nothing is submitted by
this brief, and no venue has been contacted. The publications
tracker is updated by the coordinator, not by this file.

## Working title

Verified revision for a deterministic tool-using agent: a
self-critique loop measured on a scored suite, with a failure
taxonomy shared with the P06 evaluation track

## Abstract draft

Based only on the measured v1.0 results recorded in the repo.
Numbers below are from synthetic suites and are stated as such.
The planner and the critic in this work are deterministic code,
not LLMs.

Tool-using agents fail in named ways, yet small agent stacks are
often reported with a single success number and no failure
breakdown. This work presents an open, dependency-free agent stack
and measures a self-critique loop on the same scored suite with and
without critique. At Learn level, a tool-using loop with five tools
matched expectations on 8 of 8 tasks, with 7 succeeding, 1 failing
by design (division by zero), and 1 recovering after a bad argument,
with 16 unit tests. At Build level, a plan-then-execute agent with
persistent JSON memory and recovery logged by name matched
expectations on 20 of 20 tasks, with success 1.0 on the 18
expected-success tasks, mean steps 1.5, and recoveries
retry_correct 1, fallback_tool 1, skip_step 1, and abort 2, with 19
tests (35 in total). At Deep level, on a 32-task suite (14 clean,
14 critique-target with seeded errors in six named kinds, and 4
expected-failure), success on the 28 expected-success tasks was
0.5357 without critique (15 of 28) and 1.000 with critique (28 of
28). Critique outcomes matched pre-run labels on 32 of 32 tasks
(pass 14, flag_then_fix 13, flag_then_fix_plan 1, flag_unfixable
4), the false-critique rate was 0.0 (0 of 15 correct drafts), total
revisions were 14, and mean steps were 1.3438 without critique and
2.0 with critique. The stack ships with 52 unit tests. The suites
are synthetic and same-author, the Deep errors are seeded, and the
critic shares tools with the executor; the paper claims the
critique mechanism and its measured gain on these sets, not
performance in the wild.

## Method outline

1. Tool layer: five Learn tools (calculator with an ast-based safe
   parser that never uses eval, kb_lookup, word_count, remember,
   recall), plus two Build tools (unit_converter with pinned
   factors, kb_search by keyword overlap). Every tool validates its
   arguments and raises a named ToolError on misuse.
2. Learn loop: plan, act, observe, repeat under a deterministic
   policy, max_steps 10, with one retry on corrected arguments.
3. Build planning: the deterministic planner emits the whole plan
   up front, the plan is stored per result, a step argument of
   $prev is replaced with the previous observation, and at most one
   replan is allowed per task.
4. Build memory and recovery: a JSON file-backed MemoryStore shared
   across one suite run, with recovery classified by error class
   and logged by name.
5. Deep draft errors: on the 14 critique-target tasks, a seeded
   first-pass policy errs by a named kind per task
   (arithmetic_slip, unit_inverted, kb_wrong, stale_memory,
   word_count_slip, plan_incomplete).
6. Deep critique: the deterministic critic recomputes arithmetic
   and conversions with the tools, re-lookups and re-searches
   knowledge base facts, recounts words, checks memory against the
   store snapshot, and checks plan completeness against a fresh
   plan. It never uses the draft answer as its source.
7. Deep revision: on a failed critique, a clean re-run with the
   Build agent, rechecked by the critic, within
   MAX_CRITIQUE_ROUNDS = 2. Unfixable tasks (where the recompute
   itself fails) get no revision and stay failed with reasons.
8. Scoring: success on expected-success tasks, critique outcomes
   against pre-run labels, false-critique rate on correct drafts,
   and mean tool steps as the cost model. Every task record carries
   its full trace in results_deep.json.

## Results table

Measured 2026-11-05, synthetic suites only, from the level READMEs
in the repo.

| Level | Set | Headline result | Steps and cost | Tests |
| --- | --- | --- | --- | --- |
| Learn | 8 tasks | 8 of 8 matched, 7 succeeded, 1 recovered | max_steps 10 | 16 |
| Build | 20 tasks | 20 of 20 matched, success 1.0 (18 of 18) | Mean steps 1.5, replans 3 | 19 (35 total) |
| Deep, without critique | 32 tasks, 28 expected-success | Success 0.5357 (15 of 28) | Mean steps 1.3438 | 17 Deep (52 total) |
| Deep, with critique | Same suite | Success 1.000 (28 of 28), outcomes matched 32 of 32, false-critique rate 0.0 | Mean steps 2.0, revisions 14 | 17 Deep (52 total) |

Named cases: D27 and D29 fail unfixable on division by zero in the
independent recompute, D28 on recall of a key never stored, and D30
on a search with no matching entry. No expected-success task still
fails after critique.

## Venue class note

Per SPEC.md, the paper angle for P07 is an agent failure taxonomy
note, shared as one write-up with the P06 Deep track data. Venue
class is a workshop or conference in agents or NLP, or a journal of
the AJSE class, per the publications pipeline tracker rules. One
venue at a time. No venue is named as submitted, accepted, or
contacted in this brief. Fees, if any, arise only after acceptance
and remain Jesun's call under the free-only rule.

## Limits the paper must carry

- Synthetic suites only (8, then 20, then 32 tasks). No scale,
  latency, or real-world accuracy claim.
- The planner and the critic are deterministic code, not LLMs. No
  external model is used.
- The Deep errors are seeded in six named kinds, designed for the
  critic. Wild error performance is unknown by an unmeasured
  amount, as the Deep grade deduction states.
- The critic and the executor share tools, so tool-internal bugs
  are invisible to the critique.
- Revision is a clean re-run, not a targeted correction, and cost
  is counted in tool steps only.
- Compressed Deep only. The v1.1 backlog (natural error study,
  independent critic tools, targeted revision, cross-task cases,
  larger scale, critique bounds study) is future work, named in
  ROADMAP.md in the repo.

## Submission gate

Submission is Jesun's tap and nothing is submitted. This brief is
the candidate only.
