"""Tests for the extra Deep analyses in level-3-deep/analyze_deep.py.

Expected values are worked by hand here, not copied from the outputs.
"""
import json
import os
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEEP_DIR = os.path.join(ROOT, "level-3-deep")
sys.path.insert(0, DEEP_DIR)
import analyze_deep as ad  # noqa: E402


class TestStatsHelpers(unittest.TestCase):
    def test_mcnemar_all_discordant_one_way(self):
        # 13 discordant pairs all in one direction: p = 2 * 0.5**13 = 1/4096
        self.assertAlmostEqual(ad.mcnemar_exact(13, 0), 1 / 4096)

    def test_mcnemar_balanced_is_one(self):
        self.assertEqual(ad.mcnemar_exact(3, 3), 1.0)
        self.assertEqual(ad.mcnemar_exact(0, 0), 1.0)

    def test_wilson_perfect_score(self):
        # k = n: upper bound 1, lower bound n / (n + z^2) = 28 / 31.8415 = 0.8794
        self.assertEqual(ad.wilson(28, 28), [0.8794, 1.0])

    def test_wilson_zero(self):
        # k = 0: lower 0, upper z^2 / (n + z^2) = 3.8415 / 18.8415 = 0.2039
        self.assertEqual(ad.wilson(0, 15), [0.0, 0.2039])


class TestVariantRuns(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tasks = ad.load("tasks_deep.json")
        cls.deep = ad.load("results_deep.json")

    def test_two_rounds_reproduce_results_deep(self):
        s = self.deep["summary"]
        r = ad.rounds_ablation(self.tasks)
        self.assertEqual(r["2"]["success_rate"], s["success_rate_with_critique"])
        self.assertEqual(r["2"]["mean_steps"], s["mean_steps_with_critique"])
        self.assertEqual(r["0"]["success_rate"], s["success_rate_without_critique"])

    def test_one_round_flags_but_cannot_fix(self):
        # With one round the critic can flag, but no recheck follows, so
        # no revision runs and success stays at the draft level.
        r = ad.rounds_ablation(self.tasks)["1"]
        self.assertEqual(r["succeeded"], self.deep["summary"]["succeeded_without_critique"])
        self.assertEqual(r["revisions"], 0)
        self.assertEqual(r["outcomes"]["flag_still_failing"], 14)

    def test_targeted_revision_saves_one_step_on_d24(self):
        # D24's draft already ran the calculator step, so the targeted fix
        # runs only remember and recall: 2 steps instead of a clean 3.
        v = ad.revision_variants(self.tasks)
        self.assertEqual(v["clean"]["total_steps"] - v["targeted"]["total_steps"], 1)
        self.assertEqual(v["targeted"]["succeeded"], 28)

    def test_interval_stats_from_rows(self):
        st = ad.interval_stats(self.deep)
        self.assertEqual((st["without"]["k"], st["with"]["k"], st["n"]), (15, 28, 28))
        self.assertEqual(st["mcnemar"]["fixed_by_critique"], 13)
        self.assertEqual(st["mcnemar"]["broken_by_critique"], 0)


class TestCrossTask(unittest.TestCase):
    def test_shared_memory_suite(self):
        out = ad.cross_task(ad.load("tasks_deep_cross.json"))
        w = {r["task_id"]: r for r in out["with_critique"]["rows"]}
        wo = {r["task_id"]: r for r in out["without_critique"]["rows"]}
        self.assertEqual(out["with_critique"]["matched"], 6)
        self.assertEqual(out["without_critique"]["matched"], 6)
        # Without critique the stale 35 from X03 leaks into X04 and X05.
        self.assertEqual((wo["X04"]["answer"], wo["X05"]["answer"]), (35, 35))
        # With critique X04 is fixed to 8 * 5 = 40, and the fix persists.
        self.assertEqual((w["X04"]["answer"], w["X05"]["answer"]), (40, 40))
        # The revision drops only x_total, so X01's note survives.
        self.assertEqual(w["X06"]["answer"], "Ottawa")


class TestCommittedOutputs(unittest.TestCase):
    def test_committed_files_match_a_fresh_run(self):
        tasks = ad.load("tasks_deep.json")
        with open(os.path.join(DEEP_DIR, "results_deep_rounds.json"), encoding="utf-8") as f:
            committed = json.load(f)
        self.assertEqual(committed["rounds"], ad.rounds_ablation(tasks))


if __name__ == "__main__":
    unittest.main()
