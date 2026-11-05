# PUBLICITY: agent-from-scratch (P07)

Publicity log under the documentation and publishing standard,
Section 7. Every finished level produces its written fan-out set,
each piece graded on the 1,000-point publicity rubric (accuracy 300,
research 200, gap fit 200, clarity 150, reach format 150), ship line
900. Drafts are prepared by the loop. Actual social posting follows
the standing platform rules and gates. The loop itself never posts
to social.

Fan-out set date: 2026-11-05 (Sprint 2 early work). Project state:
v1.0, Learn, Build, and compressed Deep done 2026-11-05, 52 tests
passing. Level grades on record: Learn 8,500 of 10,000, Build
8,500 of 10,000, Deep 7,900 of 10,000. Deep detail: a self-critique
loop where success on the 28 expected-success tasks is 15 of 28
(0.5357) without critique and 28 of 28 (1.000) with critique,
critique outcomes matched on 32 of 32, false-critique rate 0.0,
and mean steps 1.3438 without critique and 2.0 with critique. The
planner and the critic are deterministic code, not LLMs, stated
plainly in every fan-out piece.

## Channel log (2026-11-05)

| Channel | Outcome on 2026-11-05 |
| --- | --- |
| GitHub releases | Live: v0.1 https://github.com/JesunAhmadUshno/agent-from-scratch/releases/tag/v0.1 , v0.5 https://github.com/JesunAhmadUshno/agent-from-scratch/releases/tag/v0.5 , v1.0 https://github.com/JesunAhmadUshno/agent-from-scratch/releases/tag/v1.0 (verified with gh release list, 2026-11-05). Draft release notes for all three are in fanout/release-notes.md. No new release was created for the fan-out. |
| Portfolio index | Held: fan-out links are ready, the index update is a coordinator step outside this cycle. Named reason: held for index refresh. |
| Website page | Draft in fanout/website-page.md. Held: not published to jesunahmadushno.com. |
| Blog | Draft in fanout/blog-post.md. Held: not posted. |
| Tutorial | In repo: fanout/tutorial.md. Every command in it was run and verified on 2026-11-05 (three runners, three per-level test discoveries, scaffold smoke test, full suite at 52 tests). |
| LinkedIn post | Draft in fanout/linkedin-post.md, marked DRAFT NOT POSTED, link carried as the first-comment line per the LinkedIn rule. Held: not posted, loop never posts. |
| X | Draft held: no X copy is shipped in this set beyond the LinkedIn draft source text. Held under the standing social rules; posting is outside the loop. |
| Facebook | Draft held: no Facebook copy posted. Standing rule applies (no link in body or comments, keyword call to action fulfilled by DM). Held: not posted, loop never posts. |
| Instagram | Draft held: no Instagram copy posted. Standing rule applies (no clickable link in caption, link in bio). Held: not posted, loop never posts. |
| Threads | Draft held: no Threads copy posted. Threads waits for Jesun's tap per post, hash-locked on exact text and media. Held: awaiting Jesun's tap. |
| Video | Held: engine queue, January production for lab projects per the December Compression Protocol. No video was produced in this cycle. |
| Book chapter | Draft angle in fanout/blog-post.md and SPEC.md ("One Agent, No Framework"). Held: chapter draft follows the finished project set; not a published chapter. |
| Paper candidate | Draft brief in fanout/paper-candidate.md (failure taxonomy, shared with the P06 track). Submission is Jesun's tap. Nothing submitted, no venue contacted. The publications tracker is updated by the coordinator, not by this cycle. |

## Publicity grades (1,000-point rubric, ship line 900)

| Piece | Accuracy /300 | Research /200 | Gap fit /200 | Clarity /150 | Reach format /150 | Total /1000 |
| --- | --- | --- | --- | --- | --- | --- |
| fanout/blog-post.md | 295 | 190 | 195 | 145 | 140 | 965 |
| fanout/tutorial.md | 300 | 185 | 195 | 148 | 142 | 970 |
| fanout/website-page.md | 295 | 180 | 190 | 148 | 145 | 958 |
| fanout/linkedin-post.md | 290 | 175 | 190 | 145 | 140 | 940 |
| fanout/paper-candidate.md | 295 | 195 | 195 | 140 | 130 | 955 |
| fanout/release-notes.md | 298 | 185 | 185 | 145 | 135 | 948 |

All six pieces are at or above the 900 ship line. No piece was
shipped ungraded. Overall fan-out grade: 9,560 of 10,000 (mean of
the six piece totals, 956 of 1,000).

## Named deductions (unclosable in this cycle)

- Blog post, minus 35: research is condensed from DOSSIER.md v1,
  whose prior art section is brief (minus 10 research); synthetic
  same-author suites limit how far the results travel, stated in
  the piece (minus 10 reach, minus 5 accuracy for reader
  interpretation risk, minus 5 gap fit, minus 5 clarity).
- Tutorial, minus 30: research framing is thinner than the blog by
  design, because the module teaches runs rather than the field
  (minus 15 research); no worked example beyond the shipped suites
  (minus 5 gap fit, minus 2 clarity, minus 8 reach).
- Website page, minus 42: condensed research (minus 20), condensed
  gap framing (minus 10), and the page is copy only, not a live
  page (minus 5 reach, minus 5 accuracy, minus 2 clarity).
- LinkedIn post, minus 60: short form compresses the research and
  the failure mode detail (minus 25 research, minus 10 accuracy,
  minus 10 gap fit, minus 5 clarity, minus 10 reach, because the
  post is a held draft and carries no live link in the body by rule).
- Paper candidate, minus 45: this is a brief, not a drafted paper
  (minus 20 reach, minus 10 clarity); venue is classed, not named
  (minus 5 research, minus 5 gap fit, minus 5 accuracy for the
  synthetic-only evidence base the paper must carry).
- Release notes, minus 52: notes summarise releases that already
  exist, so research and gap framing are summary grade (minus 15
  research, minus 15 gap fit); format is repo-bound (minus 15
  reach, minus 2 accuracy, minus 5 clarity).

## Jev gate (2026-11-05)

claim_check on the blog main results paragraph, extracted
byte-exact from fanout/blog-post.md by script. Spec:
hidden_files/jev-p07-fanout-claim-spec-2026-11-05.json in the goal
workspace. Results:
hidden_files/jev-p07-fanout-claim-results-2026-11-05.json. Model
jev-1.13.0, question id supported, noul 0.76, route REVIEW (clear
at 0.85 or above, block at 0.10 or below, review between), input
tokens 1193, output tokens 20. Arithmetic was pre-computed in the
spec evidence (15 of 28 is 0.5357, 28 of 28 is 1.0, test totals
16 plus 19 is 35 and 35 plus 17 is 52). No claim was blocked.

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
