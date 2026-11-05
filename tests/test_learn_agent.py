"""Unit tests for the Level 1 Learn agent. Hand-computed expectations."""
import os
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "level-1-learn"))
from agent import KB, Agent, ToolError, call_tool  # noqa: E402


class TestCalculator(unittest.TestCase):
    def test_calc_parentheses(self):
        # 12 * (3 + 4) = 12 * 7 = 84
        self.assertEqual(call_tool("calculator", {"expression": "12 * (3 + 4)"}, {}), 84)

    def test_calc_precedence(self):
        # 15 / 3 + 2 * 10 = 5 + 20 = 25
        self.assertEqual(call_tool("calculator", {"expression": "15 / 3 + 2 * 10"}, {}), 25)

    def test_calc_bad_type_rejected(self):
        with self.assertRaises(ToolError):
            call_tool("calculator", {"expression": 123}, {})

    def test_calc_division_by_zero(self):
        with self.assertRaises(ToolError):
            call_tool("calculator", {"expression": "10 / 0"}, {})

    def test_calc_rejects_function_call(self):
        with self.assertRaises(ToolError):
            call_tool("calculator", {"expression": "__import__('os')"}, {})


class TestLookupAndWordCount(unittest.TestCase):
    def test_lookup_hit(self):
        self.assertEqual(call_tool("kb_lookup", {"key": "agent"}, {}), KB["agent"])

    def test_lookup_miss(self):
        with self.assertRaises(ToolError):
            call_tool("kb_lookup", {"key": "nonexistent_term_xyz"}, {})

    def test_word_count(self):
        # the(1) agent(2) uses(3) tools(4) to(5) act(6)
        self.assertEqual(call_tool("word_count", {"text": "the agent uses tools to act"}, {}), 6)


class TestMemory(unittest.TestCase):
    def test_remember_recall(self):
        mem = {}
        call_tool("remember", {"key": "project", "value": "agent-from-scratch"}, mem)
        self.assertEqual(call_tool("recall", {"key": "project"}, mem), "agent-from-scratch")

    def test_recall_missing(self):
        with self.assertRaises(ToolError):
            call_tool("recall", {"key": "missing"}, {})

    def test_memory_across_steps_in_agent(self):
        task = {"id": "X", "type": "memory", "memory_key": "k", "memory_value": "v1",
                "expected_answer": "v1", "expected_success": True}
        r = Agent(max_steps=10).run_task(task)
        self.assertTrue(r["success"])
        self.assertEqual(r["answer"], "v1")
        self.assertEqual(r["steps"], 2)


class TestAgentLoop(unittest.TestCase):
    def test_unknown_tool_rejected(self):
        with self.assertRaises(ToolError):
            call_tool("no_such_tool", {}, {})

    def test_max_steps_termination(self):
        task = {"id": "X", "type": "memory", "memory_key": "k", "memory_value": "v",
                "expected_answer": "v", "expected_success": True}
        r = Agent(max_steps=1).run_task(task)
        self.assertFalse(r["success"])
        self.assertLessEqual(r["steps"], 1)

    def test_error_recovery_succeeds_once(self):
        task = {"id": "T07", "type": "recovery", "bad_args": {"expression": 123},
                "corrected_args": {"expression": "9 * 9"},
                "expected_answer": 81, "expected_success": True}
        r = Agent(max_steps=10).run_task(task)
        self.assertTrue(r["success"])
        self.assertTrue(r["recovered"])
        self.assertEqual(r["answer"], 81)

    def test_unrecoverable_fails_cleanly(self):
        task = {"id": "T08", "type": "unrecoverable", "expression": "10 / 0",
                "expected_answer": None, "expected_success": False}
        r = Agent(max_steps=10).run_task(task)
        self.assertFalse(r["success"])
        self.assertTrue(r["passed"])
        self.assertLessEqual(r["steps"], 10)

    def test_multi_step(self):
        task = {"id": "T06", "type": "multi_step", "expression": "6 * 7",
                "memory_key": "calc_result", "expected_answer": 42,
                "expected_success": True}
        r = Agent(max_steps=10).run_task(task)
        self.assertTrue(r["success"])
        self.assertEqual(r["answer"], 42)
        self.assertEqual(r["steps"], 3)


if __name__ == "__main__":
    unittest.main()
