"""Unit tests for the Level 3 Deep self-critique agent.

Hand-computed expectations. The critic expectations are computed
by hand here, not copied from the runner output.
"""
import json
import os
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "level-3-deep"))
from agent_deep import (  # noqa: E402
    MAX_CRITIQUE_ROUNDS,
    Critic,
    DeepAgent,
    independent_expected,
    run_draft,
)

sys.path.insert(0, os.path.join(ROOT, "level-2-build"))
from agent_build import Agent as BuildAgent  # noqa: E402

DEEP_DIR = os.path.join(ROOT, "level-3-deep")


def _task(**kw):
    base = {"id": "X", "category": "critique_target",
            "expected_success": True}
    base.update(kw)
    return base


class TestIndependentExpected(unittest.TestCase):
    def test_recompute_arithmetic(self):
        # 12 * 3 + 4 = 40 by hand
        self.assertEqual(
            independent_expected({"type": "calculator", "expression": "12 * 3 + 4"}, {}), 40)

    def test_recompute_conversion(self):
        # 10 km is 10 / 1.609344 = 6.2137119224 miles rounded to 10 places
        self.assertEqual(
            independent_expected({"type": "converter", "value": 10,
                                  "conversion": "km_to_miles"}, {}), 6.2137119224)

    def test_recompute_raises_on_division_by_zero(self):
        with self.assertRaises(Exception):
            independent_expected({"type": "unrecoverable", "expression": "10 / 0"}, {})


class TestCriticRules(unittest.TestCase):
    def setUp(self):
        self.critic = Critic()

    def test_critic_passes_correct_draft(self):
        task = _task(type="calculator", expression="7 * 8 + 4", expected_answer=60)
        draft = BuildAgent().run_task(
            {"id": "X", "type": "calculator", "expression": "7 * 8 + 4",
             "expected_answer": 60, "expected_success": True, "category": "clean"})
        verdict = self.critic.verify(task, draft, {})
        self.assertTrue(verdict["passed"])
        self.assertEqual(verdict["issues"], [])

    def test_critic_flags_arithmetic_slip(self):
        task = _task(type="calculator", expression="12 * 3 + 4",
                     expected_answer=40, draft_error="arithmetic_slip",
                     draft_expression="12 * 3")
        agent = DeepAgent()
        draft = run_draft(task, agent.build_agent)
        self.assertEqual(draft["answer"], 36)
        verdict = self.critic.verify(task, draft, {})
        self.assertFalse(verdict["passed"])
        self.assertIn("answer_mismatch", verdict["issues"])

    def test_critic_flags_inverted_unit_conversion(self):
        task = _task(type="converter", value=10, conversion="km_to_miles",
                     expected_answer=6.2137119224, draft_error="unit_inverted",
                     draft_conversion="miles_to_km")
        agent = DeepAgent()
        draft = run_draft(task, agent.build_agent)
        self.assertEqual(draft["answer"], 16.09344)
        verdict = self.critic.verify(task, draft, {})
        self.assertFalse(verdict["passed"])

    def test_critic_flags_wrong_kb_entry(self):
        task = _task(type="lookup", key="agent", draft_error="kb_wrong",
                     draft_wrong_key="tool",
                     expected_answer="An agent is a system that perceives, plans, and acts using tools "
                                     "to complete a task.")
        agent = DeepAgent()
        draft = run_draft(task, agent.build_agent)
        verdict = self.critic.verify(task, draft, {})
        self.assertFalse(verdict["passed"])
        self.assertIn("answer_mismatch", verdict["issues"])

    def test_critic_flags_stale_memory(self):
        task = _task(type="multi_step", expression="8 * 5",
                     memory_key="k_stale", seed_memory={"k_stale": 35},
                     draft_error="stale_memory", expected_answer=40)
        agent = DeepAgent()
        agent._reset_and_seed(task)
        draft = run_draft(task, agent.build_agent)
        self.assertEqual(draft["answer"], 35)
        verdict = self.critic.verify(task, draft, dict(agent.build_agent.memory))
        self.assertFalse(verdict["passed"])
        self.assertIn("memory_stale_or_wrong", verdict["issues"])

    def test_critic_flags_incomplete_plan_even_when_answer_correct(self):
        task = _task(type="multi_step", expression="3 * 5",
                     memory_key="k_plan", draft_error="plan_incomplete",
                     expected_answer=15)
        agent = DeepAgent()
        agent._reset_and_seed(task)
        draft = run_draft(task, agent.build_agent)
        self.assertEqual(draft["answer"], 15)
        verdict = self.critic.verify(task, draft, dict(agent.build_agent.memory))
        self.assertFalse(verdict["passed"])
        self.assertIn("plan_incomplete", verdict["issues"])

    def test_critic_marks_unfixable_task(self):
        task = _task(type="unrecoverable", expression="10 / 0",
                     expected_answer=None, expected_success=False)
        draft = BuildAgent().run_task(
            {"id": "X", "type": "unrecoverable", "expression": "10 / 0",
             "expected_answer": None, "expected_success": False,
             "category": "expected_failure"})
        verdict = self.critic.verify(task, draft, {})
        self.assertFalse(verdict["passed"])
        self.assertTrue(verdict["unfixable"])


class TestRevisionLoop(unittest.TestCase):
    def test_critique_fixes_slip_and_logs_rounds(self):
        task = _task(type="calculator", expression="12 * 3 + 4",
                     expected_answer=40, draft_error="arithmetic_slip",
                     draft_expression="12 * 3",
                     expected_critique_outcome="flag_then_fix")
        r = DeepAgent().run_task(task, use_critique=True)
        self.assertTrue(r["success"])
        self.assertEqual(r["answer"], 40)
        self.assertEqual(r["draft_answer"], 36)
        self.assertEqual(r["critique_outcome"], "flag_then_fix")
        self.assertEqual(r["critique_rounds"], 2)
        self.assertEqual(r["revisions"], 1)
        self.assertFalse(r["critique_log"][0]["passed"])
        self.assertTrue(r["critique_log"][0]["revision_followed"])
        self.assertTrue(r["critique_log"][1]["passed"])

    def test_without_critique_the_slip_stands(self):
        task = _task(type="calculator", expression="12 * 3 + 4",
                     expected_answer=40, draft_error="arithmetic_slip",
                     draft_expression="12 * 3",
                     expected_without_critique_success=False)
        r = DeepAgent().run_task(task, use_critique=False)
        self.assertFalse(r["success"])
        self.assertEqual(r["answer"], 36)
        self.assertEqual(r["critique_log"], [])

    def test_clean_task_needs_no_revision(self):
        task = _task(type="calculator", expression="7 * 8 + 4",
                     expected_answer=60, category="clean")
        r = DeepAgent().run_task(task, use_critique=True)
        self.assertTrue(r["success"])
        self.assertEqual(r["critique_outcome"], "pass")
        self.assertEqual(r["critique_rounds"], 1)
        self.assertEqual(r["revisions"], 0)

    def test_unfixable_task_stays_failed_within_bound(self):
        task = _task(type="unrecoverable", expression="10 / 0",
                     expected_answer=None, expected_success=False)
        r = DeepAgent().run_task(task, use_critique=True)
        self.assertFalse(r["success"])
        self.assertEqual(r["critique_outcome"], "flag_unfixable")
        self.assertLessEqual(r["critique_rounds"], MAX_CRITIQUE_ROUNDS)
        self.assertEqual(r["revisions"], 0)

    def test_revision_bound_is_two_rounds(self):
        self.assertEqual(MAX_CRITIQUE_ROUNDS, 2)
        with open(os.path.join(DEEP_DIR, "tasks_deep.json"), encoding="utf-8") as f:
            suite = json.load(f)
        for task in suite:
            r = DeepAgent().run_task(task, use_critique=True)
            self.assertLessEqual(r["critique_rounds"], MAX_CRITIQUE_ROUNDS,
                                 msg=task["id"])


class TestSuiteSchema(unittest.TestCase):
    def test_suite_schema_and_coverage(self):
        with open(os.path.join(DEEP_DIR, "tasks_deep.json"), encoding="utf-8") as f:
            tasks = json.load(f)
        self.assertEqual(len(tasks), 32)
        self.assertEqual(len({t["id"] for t in tasks}), 32)
        targets = [t for t in tasks if t["category"] == "critique_target"]
        self.assertGreaterEqual(len(targets), 10)
        kinds = {t["draft_error"] for t in targets}
        for needed in ("arithmetic_slip", "unit_inverted", "kb_wrong",
                       "stale_memory", "word_count_slip", "plan_incomplete"):
            self.assertIn(needed, kinds)
        for t in tasks:
            self.assertIn("expected_answer", t)
            self.assertIn("expected_success", t)
            self.assertIn("expected_without_critique_success", t)
            self.assertIn("expected_critique_outcome", t)
        failures = [t for t in tasks if not t["expected_success"]]
        self.assertGreaterEqual(len(failures), 4)

    def test_results_file_matches_suite(self):
        with open(os.path.join(DEEP_DIR, "results_deep.json"), encoding="utf-8") as f:
            data = json.load(f)
        s = data["summary"]
        self.assertEqual(s["total"], 32)
        self.assertEqual(s["passed_with_critique"], 32)
        self.assertEqual(s["success_rate_without_critique"], 0.5357)
        self.assertEqual(s["success_rate_with_critique"], 1.0)
        self.assertEqual(s["false_critique_rate"], 0.0)
        self.assertEqual(len(s["still_failing_after_critique"]), 4)


if __name__ == "__main__":
    unittest.main()
