"""Unit tests for the Level 2 Build agent. Hand-computed expectations."""
import json
import os
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "level-2-build"))
from agent_build import Agent, MemoryStore, Planner, ToolError, call_tool  # noqa: E402

BUILD_DIR = os.path.join(ROOT, "level-2-build")


def _tmp_path(testcase):
    fd, path = tempfile.mkstemp(suffix=".json")
    os.close(fd)
    os.unlink(path)
    testcase.addCleanup(lambda: os.path.exists(path) and os.unlink(path))
    return path


class TestPlanner(unittest.TestCase):
    def test_plan_emitted_before_execution_and_matches_tools(self):
        task = {"id": "X", "type": "multi_step", "expression": "6 * 7",
                "memory_key": "calc_result", "expected_answer": 42,
                "expected_success": True, "category": "multi_step"}
        r = Agent().run_task(task)
        self.assertIn("plan", r)
        plan_tools = [s["tool"] for s in r["plan"]]
        self.assertEqual(plan_tools, ["calculator", "remember", "recall"])
        self.assertEqual(plan_tools, r["tools_used"])
        for s in r["plan"]:
            self.assertIn("purpose", s)
            self.assertTrue(s["purpose"])
            self.assertIn("step", s)

    def test_plan_steps_are_numbered_in_order(self):
        plan = Planner().plan({"type": "count_memory", "text": "a b",
                               "memory_key": "k"})
        agent = Agent()
        task = {"id": "X", "type": "count_memory", "text": "a b",
                "memory_key": "k", "expected_answer": 2,
                "expected_success": True, "category": "multi_step"}
        r = agent.run_task(task)
        self.assertEqual([s["step"] for s in r["plan"]], [1, 2, 3])
        self.assertEqual(len(plan), 3)


class TestPersistence(unittest.TestCase):
    def test_persistence_across_two_agent_instances(self):
        path = _tmp_path(self)
        a1 = Agent(memory_path=path)
        write = {"id": "W", "type": "memory_write", "memory_key": "note",
                 "memory_value": "Ottawa", "expected_answer": "Ottawa",
                 "expected_success": True, "category": "memory_persistence"}
        self.assertTrue(a1.run_task(write)["success"])
        a2 = Agent(memory_path=path)
        read = {"id": "R", "type": "recall_persist", "memory_key": "note",
                "expected_answer": "Ottawa", "expected_success": True,
                "category": "memory_persistence"}
        r = a2.run_task(read)
        self.assertTrue(r["success"])
        self.assertEqual(r["answer"], "Ottawa")

    def test_memory_store_saves_json_on_write(self):
        path = _tmp_path(self)
        store = MemoryStore(path)
        store["k"] = "v1"
        with open(path, encoding="utf-8") as f:
            self.assertEqual(json.load(f), {"k": "v1"})
        reloaded = MemoryStore(path)
        self.assertEqual(reloaded["k"], "v1")

    def test_learn_tools_work_through_memory_store(self):
        path = _tmp_path(self)
        store = MemoryStore(path)
        call_tool("remember", {"key": "project", "value": "p07"}, store)
        self.assertEqual(call_tool("recall", {"key": "project"}, store), "p07")
        self.assertEqual(MemoryStore(path)["project"], "p07")


class TestRecovery(unittest.TestCase):
    def test_retry_correct(self):
        task = {"id": "B14", "type": "recovery_retry",
                "bad_args": {"expression": 123},
                "corrected_args": {"expression": "9 * 9"},
                "expected_answer": 81, "expected_success": True,
                "category": "recovery"}
        r = Agent().run_task(task)
        self.assertTrue(r["success"])
        self.assertEqual(r["recoveries"], ["retry_correct"])
        self.assertTrue(r["recovered"])
        self.assertEqual(r["replans"], 1)

    def test_fallback_tool(self):
        task = {"id": "B15", "type": "recovery_fallback", "key": "agents_missing",
                "fallback_query": "system perceives plans acts using tools complete task",
                "expected_answer": "agent", "expected_success": True,
                "category": "recovery"}
        r = Agent().run_task(task)
        self.assertTrue(r["success"])
        self.assertEqual(r["answer"], "agent")
        self.assertEqual(r["recoveries"], ["fallback_tool"])
        self.assertEqual(r["tools_used"], ["kb_lookup", "kb_search"])

    def test_skip_step(self):
        task = {"id": "B16", "type": "recovery_skip", "key": "optional_missing",
                "expression": "3 * 5", "expected_answer": 15,
                "expected_success": True, "category": "recovery"}
        r = Agent().run_task(task)
        self.assertTrue(r["success"])
        self.assertEqual(r["answer"], 15)
        self.assertEqual(r["recoveries"], ["skip_step"])

    def test_abort_on_division_by_zero(self):
        task = {"id": "B17", "type": "unrecoverable", "expression": "10 / 0",
                "expected_answer": None, "expected_success": False,
                "category": "expected_failure"}
        r = Agent().run_task(task)
        self.assertFalse(r["success"])
        self.assertTrue(r["passed"])
        self.assertEqual(r["recoveries"], ["abort"])
        self.assertFalse(r["recovered"])

    def test_replan_bound_one_only(self):
        # Corrected args are also bad: the retry fails and no second
        # replan is allowed, so the task aborts after one replan.
        task = {"id": "X", "type": "recovery_retry",
                "bad_args": {"expression": 123},
                "corrected_args": {"expression": 456},
                "expected_answer": None, "expected_success": False,
                "category": "recovery"}
        r = Agent().run_task(task)
        self.assertFalse(r["success"])
        self.assertEqual(r["replans"], 1)
        self.assertEqual(r["recoveries"], ["retry_correct", "abort"])


class TestConverter(unittest.TestCase):
    def conv(self, value, conversion):
        return call_tool("unit_converter",
                         {"value": value, "conversion": conversion}, {})

    def test_km_to_miles(self):
        # 10 / 1.609344 = 6.21371192237334, rounded to 10 places
        self.assertEqual(self.conv(10, "km_to_miles"), 6.2137119224)

    def test_miles_to_km(self):
        # 10 * 1.609344 = 16.09344
        self.assertEqual(self.conv(10, "miles_to_km"), 16.09344)

    def test_c_to_f_and_back(self):
        # 100 * 9/5 + 32 = 212; (212 - 32) * 5/9 = 100
        self.assertEqual(self.conv(100, "c_to_f"), 212)
        self.assertEqual(self.conv(212, "f_to_c"), 100)

    def test_kg_to_lb_and_back(self):
        # 10 / 0.45359237 = 22.0462262185 rounded; 100 * 0.45359237 = 45.359237
        self.assertEqual(self.conv(10, "kg_to_lb"), 22.0462262185)
        self.assertEqual(self.conv(100, "lb_to_kg"), 45.359237)

    def test_converter_rejects_bad_inputs(self):
        with self.assertRaises(ToolError):
            self.conv("ten", "km_to_miles")
        with self.assertRaises(ToolError):
            self.conv(10, "yards_to_feet")


class TestKbSearch(unittest.TestCase):
    def test_kb_search_best_match_agent(self):
        self.assertEqual(
            call_tool("kb_search",
                      {"query": "system perceives plans acts using tools complete task"}, {}),
            "agent")

    def test_kb_search_best_match_memory(self):
        self.assertEqual(
            call_tool("kb_search",
                      {"query": "store save recall information across steps"}, {}),
            "memory")

    def test_kb_search_no_overlap_raises(self):
        with self.assertRaises(ToolError):
            call_tool("kb_search", {"query": "zebra xylophone quantumz"}, {})


class TestSuiteSchema(unittest.TestCase):
    def test_suite_schema_and_coverage(self):
        with open(os.path.join(BUILD_DIR, "tasks_build.json"), encoding="utf-8") as f:
            tasks = json.load(f)
        self.assertEqual(len(tasks), 20)
        ids = [t["id"] for t in tasks]
        self.assertEqual(len(set(ids)), 20)
        for t in tasks:
            self.assertIn("expected_answer", t)
            self.assertIn("expected_success", t)
            self.assertIsInstance(t["expected_success"], bool)
            self.assertIn("category", t)
        cats = {t["category"] for t in tasks}
        for needed in ("multi_step", "memory_persistence", "recovery",
                       "converter", "kb_search"):
            self.assertIn(needed, cats)
        failures = [t for t in tasks if not t["expected_success"]]
        self.assertGreaterEqual(len(failures), 2)


if __name__ == "__main__":
    unittest.main()
