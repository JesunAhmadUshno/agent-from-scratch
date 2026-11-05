# PUBLICITY: agent-from-scratch (P07)

Publicity log under the documentation and publishing standard,
Section 7. Every finished level produces its written fan-out set,
each piece graded on the 1,000-point publicity rubric (accuracy 300,
research 200, gap fit 200, clarity 150, reach format 150), ship line
900. Drafts are prepared by the loop. Actual social posting follows
the standing platform rules and gates. The loop itself never posts
to social.

Fan-out set state: NOT STARTED yet. The written fan-out set for
this project (blog, tutorial, website page copy, LinkedIn draft,
release notes) is Sprint 2 exit work and has not been prepared in
this cycle. No fan-out piece is claimed, graded, or shipped here.
Project state: v1.0, Learn, Build, and compressed Deep done
2026-11-05, 52 tests passing. Level grades on record: Learn 8,500
of 10,000, Build 8,500 of 10,000, Deep 7,900 of 10,000.

## Actions polish pack (2026-11-05)

Applied through a pull request on 2026-11-05, following the Actions
polish pack standard. The pack adds: CI on a Python 3.11 and 3.12
matrix with a ruff lint step (all pre-existing P07 CI steps
preserved verbatim and in order: scaffold smoke test, Learn tests
tests.test_learn_agent and runner, Build tests
tests.test_build_agent and runner, Deep tests tests.test_deep_agent
and runner), CodeQL scanning, Dependabot for pip and GitHub
Actions, a release workflow that attaches a source tarball named
agent-from-scratch-<tag>.tar.gz to v* tag releases, Labeler,
Greetings (snake_case inputs for actions/first-interaction@v3:
repo_token, issue_message, pr_message), Stale in comment-only mode
(days-before-close: -1, never closes), and a docs summary page at
docs/index.md for GitHub Pages. Ruff scope is recorded in
ruff.toml (E, F, I, line-length 120). Ruff fixes in this pull
request were style only: 4 initial errors (3 import order or
format, 1 line too long), fixed by ruff fix output and by
splitting one over-length expected-answer string in
tests/test_deep_agent.py into two concatenated literals with the
exact same value, with no change to behaviour. All three results
files (results_learn.json, results_build.json, results_deep.json)
stayed byte-identical across the runners. requirements.txt records
the standard-library-only fact so Dependabot pip has a manifest
to watch.

| Channel | Outcome on 2026-11-05 |
| --- | --- |
| GitHub Pages | Docs page added at docs/index.md in this pull request. Pages enablement and live build status are verified after merge and recorded in the batch ledger; no live claim is made in this file before that check. |
| PyPI publishing | Held: needs a PyPI token, a new credential. Jesun's tap only. Not set up. |
| Social channels (LinkedIn, X, Facebook, Instagram, Threads) | Held: no posts made. The loop never posts to social; Threads waits for Jesun's tap per post under the standing gates. |

Publicity grade for this polish pack log piece, on the 1,000
point rubric (accuracy 300, research 200, gap fit 200, clarity
150, reach format 150), ship line 900:

| Piece | Accuracy /300 | Research /200 | Gap fit /200 | Clarity /150 | Reach /150 | Total /1000 |
| --- | --- | --- | --- | --- | --- | --- |
| PUBLICITY.md polish pack section (2026-11-05) | 295 | 180 | 195 | 145 | 95 | 910 |

At or above the 900 ship line. That is 9,100 of 10,000 on the
pack scale. Named deductions: release workflow unproven until a
v* tag release runs it (minus 300 on the pack scale); ruff scope
is the E, F, I subset, not the full rule set (minus 300); the
docs site is a single summary page, not a full documentation set
(minus 200); Greetings has no live first-interaction proof yet
(minus 100). On the rubric above those map mainly to research
minus 20 (the pack is a standard applied across repos and this
section records its application rather than new research), reach
minus 55 (docs page is copy in this pull request with no live
Pages claim yet, PyPI publishing is held, and no social channel
carries this piece by the standing gates), accuracy minus 5, gap
fit minus 5, and clarity minus 5 for summary compression of the
full pack standard, which lives in the batch files.
