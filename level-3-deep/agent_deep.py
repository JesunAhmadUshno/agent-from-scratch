"""Self-critique agent with no framework, Level 3 Deep.

The planner and the critic are deterministic code, NOT LLMs: they
call no API, learn nothing, and follow fixed rules. This is stated
plainly here and in the README, the same honesty rule as Learn
and Build.

Deep adds, over Build: a draft stage whose seeded first-pass
policy can plausibly err on critique-target tasks, an independent
Critic that recomputes answers with the tools directly (never
from the draft answer), and a bounded revision loop
(MAX_CRITIQUE_ROUNDS = 2). Python standard library only. The
Build agent, planner, tools, and knowledge base are loaded and
reused from level-2-build/agent_build.py.
"""
import importlib.util
import os

_HERE = os.path.dirname(os.path.abspath(__file__))
_BUILD_PATH = os.path.join(_HERE, "..", "level-2-build", "agent_build.py")
_spec = importlib.util.spec_from_file_location("build_agent", _BUILD_PATH)
_build = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_build)

ToolError = _build.ToolError
KB = _build.KB
Planner = _build.Planner
BuildAgent = _build.Agent
call_tool = _build.call_tool

MAX_CRITIQUE_ROUNDS = 2


def independent_expected(task, memory_snapshot):
    """Compute the expected answer from task fields and tools only.

    This is the critic core: it never reads the draft answer.
    Raises ToolError when the task cannot be completed (for
    example division by zero, a missing memory key, or a search
    with no overlapping words).
    """
    t = task.get("type")
    if t in ("calculator", "unrecoverable"):
        return call_tool("calculator", {"expression": task["expression"]}, {})
    if t == "word_count":
        return call_tool("word_count", {"text": task["text"]}, {})
    if t == "converter":
        return call_tool("unit_converter",
                         {"value": task["value"],
                          "conversion": task["conversion"]}, {})
    if t == "lookup":
        return call_tool("kb_lookup", {"key": task["key"]}, {})
    if t == "kb_search_task":
        return call_tool("kb_search", {"query": task["query"]}, {})
    if t == "search_then_lookup":
        key = call_tool("kb_search", {"query": task["query"]}, {})
        return call_tool("kb_lookup", {"key": key}, {})
    if t == "multi_step":
        return call_tool("calculator", {"expression": task["expression"]}, {})
    if t == "convert_memory":
        return call_tool("unit_converter",
                         {"value": task["value"],
                          "conversion": task["conversion"]}, {})
    if t == "count_memory":
        return call_tool("word_count", {"text": task["text"]}, {})
    if t == "memory_write":
        return task["memory_value"]
    if t == "recall_persist":
        if task["memory_key"] not in memory_snapshot:
            raise ToolError("recall: no value stored for key '"
                            + task["memory_key"] + "'")
        return memory_snapshot[task["memory_key"]]
    raise ToolError("unknown task type: '" + str(t) + "'")


class Critic:
    """Independent verifier. Deterministic rules, not an LLM."""

    def verify(self, task, draft, memory_snapshot):
        checks = []
        issues = []

        # Plan-step completeness: fresh plan versus draft plan.
        try:
            expected_plan = Planner().plan(task)
            expected_tools = [s["tool"] for s in expected_plan]
        except ToolError:
            expected_tools = None
        if expected_tools is not None:
            draft_tools = [s["tool"] for s in draft.get("plan", [])]
            plan_ok = draft_tools == expected_tools
            checks.append({"name": "plan_completeness",
                           "passed": plan_ok,
                           "expected": expected_tools,
                           "observed": draft_tools})
            if not plan_ok:
                issues.append("plan_incomplete")

        # Independent recompute.
        try:
            expected = independent_expected(task, memory_snapshot)
        except ToolError as exc:
            checks.append({"name": "independent_recompute",
                           "passed": False,
                           "expected": None,
                           "observed": str(exc)})
            # The draft also failing confirms an unfixable task.
            unfixable = not draft.get("success")
            if not unfixable:
                issues.append("recompute_failed_but_draft_claimed_success")
            return {"passed": False, "unfixable": unfixable,
                    "checks": checks,
                    "issues": ["unfixable: " + str(exc)] if unfixable else issues,
                    "expected": None}

        checks.append({"name": "independent_recompute", "passed": True,
                       "expected": expected, "observed": draft.get("answer")})
        answer_ok = bool(draft.get("success")) and draft.get("answer") == expected
        checks.append({"name": "answer_match", "passed": answer_ok,
                       "expected": expected, "observed": draft.get("answer")})
        if not answer_ok:
            issues.append("answer_mismatch")

        # Memory consistency: a stored value for this task key must
        # equal the independent expected value.
        key = task.get("memory_key")
        if key and task.get("type") in ("multi_step", "convert_memory",
                                        "count_memory", "memory_write"):
            if key in memory_snapshot:
                mem_ok = memory_snapshot[key] == expected
                checks.append({"name": "memory_consistency",
                               "passed": mem_ok,
                               "expected": expected,
                               "observed": memory_snapshot[key]})
                if not mem_ok:
                    issues.append("memory_stale_or_wrong")
            else:
                checks.append({"name": "memory_consistency",
                               "passed": False,
                               "expected": expected,
                               "observed": None})
                issues.append("memory_missing")

        passed = all(c["passed"] for c in checks)
        return {"passed": passed, "unfixable": False, "checks": checks,
                "issues": issues, "expected": expected}


def _draft_plan(task, truncated=False):
    plan = Planner().plan(task)
    if truncated:
        plan = plan[:1]
    stored = []
    for i, s in enumerate(plan, start=1):
        entry = dict(s)
        entry["step"] = i
        stored.append(entry)
    return stored


def _flawed_answer(task, agent):
    """Seeded first-pass draft policy. Each kind is a named slip."""
    kind = task["draft_error"]
    if kind == "arithmetic_slip":
        return call_tool("calculator",
                         {"expression": task["draft_expression"]}, agent.memory), "calculator"
    if kind == "unit_inverted":
        return call_tool("unit_converter",
                         {"value": task["value"],
                          "conversion": task["draft_conversion"]}, agent.memory), "unit_converter"
    if kind == "kb_wrong":
        return call_tool("kb_lookup", {"key": task["draft_wrong_key"]},
                         agent.memory), "kb_lookup"
    if kind == "stale_memory":
        return agent.memory[task["memory_key"]], "recall"
    if kind == "word_count_slip":
        return call_tool("word_count", {"text": task["draft_text"]},
                         agent.memory), "word_count"
    if kind == "plan_incomplete":
        return call_tool("calculator", {"expression": task["expression"]},
                         agent.memory), "calculator"
    raise ToolError("unknown draft_error: '" + str(kind) + "'")


def run_draft(task, agent):
    """Produce the draft result. Seeded errors apply only here."""
    if not task.get("draft_error"):
        return agent.run_task(task)
    truncated = task["draft_error"] == "plan_incomplete"
    plan = _draft_plan(task, truncated=truncated)
    tool_name = "calculator"
    try:
        answer, tool_name = _flawed_answer(task, agent)
    except ToolError as exc:
        return {"task_id": task.get("id"), "type": task.get("type"),
                "category": task.get("category"), "plan": plan,
                "success": False, "answer": None,
                "expected_answer": task.get("expected_answer"),
                "expected_success": task.get("expected_success"),
                "steps": 1, "tools_used": [tool_name],
                "recovered": False, "replans": 0, "recoveries": [],
                "trace": [{"step": 1, "event": "error", "error": str(exc)}],
                "error": str(exc), "passed": False}
    return {"task_id": task.get("id"), "type": task.get("type"),
            "category": task.get("category"), "plan": plan,
            "success": True, "answer": answer,
            "expected_answer": task.get("expected_answer"),
            "expected_success": task.get("expected_success"),
            "steps": len(plan), "tools_used": [s["tool"] for s in plan],
            "recovered": False, "replans": 0, "recoveries": [],
            "trace": [{"step": 1, "event": "observe", "tool": tool_name,
                       "observation": answer}],
            "passed": answer == task.get("expected_answer")}


class DeepAgent:
    """Build agent plus draft policy, critic, and bounded revision."""

    def __init__(self, memory_path=None):
        self.build_agent = BuildAgent(memory_path=memory_path, max_steps=20)
        self.critic = Critic()

    def _reset_and_seed(self, task):
        mem = self.build_agent.memory
        for k in list(mem.keys()):
            del mem[k]
        mem.save()
        for k, v in task.get("seed_memory", {}).items():
            mem[k] = v

    def run_task(self, task, use_critique=True):
        self._reset_and_seed(task)
        draft = run_draft(task, self.build_agent)
        draft_steps = draft["steps"]
        if not use_critique:
            # success is the actual task outcome, not a match to the
            # label: an expected-failure task has success False.
            success = bool(draft["success"]) and draft["answer"] == task.get("expected_answer")
            return {"task_id": task.get("id"), "type": task.get("type"),
                    "category": task.get("category"),
                    "mode": "without_critique",
                    "draft_answer": draft["answer"],
                    "draft_success": draft["success"],
                    "answer": draft["answer"], "success": success,
                    "steps": draft_steps, "cost_steps": draft_steps,
                    "critique_rounds": 0, "critique_log": [],
                    "critique_outcome": "not_run",
                    "revisions": 0}

        current = draft
        log = []
        revisions = 0
        total_steps = draft_steps
        outcome = "pass"
        for round_no in range(1, MAX_CRITIQUE_ROUNDS + 1):
            verdict = self.critic.verify(task, current, dict(self.build_agent.memory))
            entry = {"round": round_no, "passed": verdict["passed"],
                     "unfixable": verdict["unfixable"],
                     "issues": verdict["issues"], "checks": verdict["checks"],
                     "revision_followed": False}
            log.append(entry)
            if verdict["passed"]:
                outcome = "pass" if round_no == 1 and revisions == 0 else outcome
                break
            if verdict["unfixable"]:
                outcome = "flag_unfixable"
                break
            # Decide the outcome label at the first flag.
            if revisions == 0:
                outcome = ("flag_then_fix_plan"
                           if "plan_incomplete" in verdict["issues"]
                           else "flag_then_fix")
            if round_no >= MAX_CRITIQUE_ROUNDS:
                outcome = "flag_still_failing"
                break
            # Revision: clean re-run with no seeded draft error. The
            # memory is reset and re-seeded first, so a stale value
            # cannot survive into the revision.
            self._reset_and_seed(task)
            current = self.build_agent.run_task(task)
            revisions += 1
            total_steps += current["steps"]
            entry["revision_followed"] = True

        if log and log[-1]["passed"]:
            if revisions > 0 and outcome.startswith("flag"):
                pass  # keep flag_then_fix label
            elif revisions == 0:
                outcome = "pass"
        # success is the actual task outcome, not a match to the
        # label: an expected-failure task has success False.
        success = bool(current["success"]) and current["answer"] == task.get("expected_answer")
        return {"task_id": task.get("id"), "type": task.get("type"),
                "category": task.get("category"),
                "mode": "with_critique",
                "draft_answer": draft["answer"],
                "draft_success": draft["success"],
                "answer": current["answer"], "success": success,
                "final_result_success": current["success"],
                "steps": total_steps, "cost_steps": total_steps,
                "critique_rounds": len(log), "critique_log": log,
                "critique_outcome": outcome,
                "revisions": revisions,
                "error": current.get("error")}
