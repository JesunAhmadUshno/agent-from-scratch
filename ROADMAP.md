# ROADMAP: agent-from-scratch (P07)

## Shipped

- v0.1 Learn: deterministic tool-using agent loop (2026-11-05).
- v0.5 Build: plan-then-execute agent, persistent JSON memory,
  four recovery strategies, at most one replan (2026-11-05).
- v1.0 Deep (compressed, 2026-11-05): self-critique loop with an
  independent deterministic critic, bounded revision
  (MAX_CRITIQUE_ROUNDS = 2), per-task critique logging, and a
  32-task scored evaluation suite reporting success without
  critique (0.5357) versus with critique (1.0) on the same suite.

## v1.1 backlog (the rest of the v2 Deep scope)

Named here under the December Compression Protocol. None of this
is built, and nothing below is claimed as done.

Update after v1.0: items 3, 4 and 7 are now measured by
level-3-deep/analyze_deep.py, and item 5 has wall-clock timing
(the knowledge base is still five entries). See
docs/research-review.md for the status of each item.

1. Natural error study: run the agent on tasks not written by
   the agent author, collect errors that occur without seeding,
   and measure the critic on those.
2. Independent critic tools: a second implementation of the
   calculator and converter checks, so a tool-internal bug
   cannot pass both stages.
3. Targeted revision: correct only the flagged step instead of
   a clean full re-run, and compare cost against the v1.0 loop.
4. Cross-task Deep cases: memory persistence and stale-memory
   critique across tasks in one suite run, not only per task.
5. Larger knowledge base and longer multi-step chains, with a
   time-based cost model beside the step count.
6. Failure taxonomy write-up shared with the P06 Deep track
   (paper candidate), using the Deep critique log as data.
7. Harder critique bounds study: measure 1, 2, and 3 critique
   rounds on the same suite and report the gain per round.
