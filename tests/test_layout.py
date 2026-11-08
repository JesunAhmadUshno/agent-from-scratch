"""Portfolio standard v2 checks: the required files exist and no public file carries a grade.

There is no lock-hash test: the repo is not pre-registered (PROPOSAL.md, Status).
"""
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

REQUIRED = [
    "README.md", "PROPOSAL.md", "REPORT.md", "CHANGELOG.md", "CITATION.cff", "SECURITY.md", "LICENSE",
    "docs/decisions/0001-keep-stage-folders.md",
    "level-1-learn/agent.py", "level-1-learn/run_learn.py", "level-1-learn/tasks.json",
    "level-1-learn/results_learn.json",
    "level-2-build/agent_build.py", "level-2-build/run_build.py", "level-2-build/tasks_build.json",
    "level-2-build/results_build.json",
    "level-3-deep/agent_deep.py", "level-3-deep/run_deep.py", "level-3-deep/analyze_deep.py",
    "level-3-deep/tasks_deep.json", "level-3-deep/results_deep.json", "level-3-deep/results_deep_stats.json",
]

# "7,900 of 10,000", "x/10000", "Grade:", rubric columns like "Accuracy /300" or "Total /1000".
GRADE = re.compile(r"of 10,000|/ ?10,?000\b|\bGrade:|\bgrade \d|/[1-9]\d{2,3}\b \|", re.IGNORECASE)


def public_text_files():
    skip_dirs = {".git", "node_modules", "dist", "__pycache__", ".rubric", "tests"}
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        for name in files:
            if name.endswith((".md", ".jsx", ".js", ".mjs", ".html", ".cff")):
                yield os.path.join(base, name)


class LayoutTest(unittest.TestCase):
    def test_required_files_exist(self):
        missing = [p for p in REQUIRED if not os.path.exists(os.path.join(ROOT, p))]
        self.assertEqual(missing, [], "missing: " + ", ".join(missing))

    def test_readme_opens_with_the_abstract(self):
        with open(os.path.join(ROOT, "README.md"), encoding="utf-8") as f:
            text = f.read()
        positions = [text.find(k) for k in ("**Question.**", "**Headline.**", "**Field.**", "**Job family.**",
                                            "**Verdict.**", "## Reproduce", "## Lifecycle", "## Layout")]
        self.assertNotIn(-1, positions)
        self.assertEqual(positions, sorted(positions))
        self.assertIn("not pre-registered", text)

    def test_no_public_grade(self):
        hits = []
        for path in public_text_files():
            with open(path, encoding="utf-8") as f:
                for n, line in enumerate(f, 1):
                    if GRADE.search(line):
                        hits.append(f"{os.path.relpath(path, ROOT)}:{n}: {line.strip()}")
        self.assertEqual(hits, [], "grades are internal:\n" + "\n".join(hits))

    def test_grade_pattern_catches_the_old_forms(self):
        for line in ("Grade: 7,900 of 10,000 (self-graded)", "Learn DONE (grade 8,500 of 10,000)",
                     "| Piece | Accuracy /300 | Total /1000 |", "scored 9100/10000"):
            self.assertTrue(GRADE.search(line), line)
        self.assertFalse(GRADE.search("15 of 28 expected-success tasks, Wilson 95% 0.3581 to 0.7047"))


if __name__ == "__main__":
    unittest.main()
