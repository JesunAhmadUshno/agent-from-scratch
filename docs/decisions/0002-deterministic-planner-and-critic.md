# 0002: The planner and the critic are deterministic code, not language models

Date: 2026-11-05 (recorded 2026-11-08). Status: accepted. Decided by:
Jesun Ahmad Ushno.

## Context

The project studies one agent's internals: the loop, tool registry,
memory, planning, recovery and critique. A language-model planner would
add cost, run-to-run variance and a credential, and would make every
result depend on a model version.

## Decision

The planner, the seeded draft policy and the critic are fixed rules in
Python's standard library. No API, no model, no randomness, no
timestamps in results. Every result is byte-identical across runs and
re-checked in CI and by the JavaScript port.

## Consequences

The machinery is fully reproducible and cheap to test. The price is
validity: errors must be seeded, the critic recomputes from the same
task fields, and nothing here speaks to errors a real model makes.
Measuring that (REPORT.md, v1.1 backlog item 1) needs a stochastic or
language-model planner, GPU time or a paid API, and a newly locked
proposal.
