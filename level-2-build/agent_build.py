"""Plan-then-execute agent with no framework, Level 2 Build.

The planner is a deterministic policy, NOT an LLM: it calls no API,
learns nothing, and emits a plan from fixed rules over the task type
and fields. This is stated plainly here and in the README, the same
honesty rule as Learn.

Build adds, over Learn: an explicit plan stored in the result,
persistent JSON file-backed memory, recovery strategies chosen by
error class and logged by name, and two new tools (unit_converter
and kb_search). Python standard library only. The Learn tools and
knowledge base are loaded and reused from level-1-learn/agent.py.
"""
import importlib.util
import json
import os
import re

_HERE = os.path.dirname(os.path.abspath(__file__))
_LEARN_PATH = os.path.join(_HERE, "..", "level-1-learn", "agent.py")
_spec = importlib.util.spec_from_file_location("learn_agent", _LEARN_PATH)
_learn = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_learn)

ToolError = _learn.ToolError
KB = _learn.KB
_LEARN_TOOLS = dict(_learn.TOOLS)


# ---------------------------------------------------------------- memory

class MemoryStore(dict):
    """Dict that persists to a JSON file on every write.

    Loads the file on start if it exists. An absent or empty file
    means an empty store. With path None it stays in memory only.
    Because it is a dict, the Learn remember and recall tools work
    through it unchanged: their writes trigger a save.
    """

    def __init__(self, path=None):
        super().__init__()
        self.path = path
        if path and os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                text = f.read().strip()
            if text:
                data = json.loads(text)
                if not isinstance(data, dict):
                    raise ToolError("memory file must hold a JSON object")
                super().update(data)

    def __setitem__(self, key, value):
        super().__setitem__(key, value)
        self.save()

    def save(self):
        if not self.path:
            return
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(dict(self), f, indent=2, sort_keys=True)
            f.write("\n")


# ---------------------------------------------------------------- new tools

_CONVERSIONS = ("km_to_miles", "miles_to_km", "c_to_f", "f_to_c",
                "kg_to_lb", "lb_to_kg")


def tool_unit_converter(args, memory):
    if not isinstance(args, dict) or "value" not in args or "conversion" not in args:
        raise ToolError("unit_converter: requires 'value' and 'conversion'")
    value = args["value"]
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ToolError("unit_converter: 'value' must be a number")
    conv = args["conversion"]
    if conv not in _CONVERSIONS:
        raise ToolError("unit_converter: unknown conversion '" + str(conv) + "'")
    if conv == "km_to_miles":
        result = value / 1.609344
    elif conv == "miles_to_km":
        result = value * 1.609344
    elif conv == "c_to_f":
        result = value * 9 / 5 + 32
    elif conv == "f_to_c":
        result = (value - 32) * 5 / 9
    elif conv == "kg_to_lb":
        result = value / 0.45359237
    else:  # lb_to_kg
        result = value * 0.45359237
    result = round(result, 10)
    if isinstance(result, float) and result.is_integer():
        return int(result)
    return result


def _tokens(text):
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def tool_kb_search(args, memory):
    if not isinstance(args, dict) or "query" not in args:
        raise ToolError("kb_search: missing argument 'query'")
    query = args["query"]
    if not isinstance(query, str) or not query.strip():
        raise ToolError("kb_search: 'query' must be a non-empty string")
    q = _tokens(query)
    best_key = None
    best_score = 0
    for key, value in KB.items():
        score = len(q & _tokens(value))
        if score > best_score:
            best_score = score
            best_key = key
    if best_key is None:
        raise ToolError("kb_search: no matching entry for query")
    return best_key


TOOLS = dict(_LEARN_TOOLS)
TOOLS["unit_converter"] = tool_unit_converter
TOOLS["kb_search"] = tool_kb_search


def call_tool(name, args, memory):
    if name not in TOOLS:
        raise ToolError("unknown tool: '" + str(name) + "'")
    return TOOLS[name](args, memory)


# ---------------------------------------------------------------- planner

def _step(tool, purpose, args, optional=False):
    return {"tool": tool, "purpose": purpose, "args": args, "optional": optional}


class Planner:
    """Deterministic policy that emits a full plan before execution."""

    def plan(self, task):
        t = task.get("type")
        if t == "calculator":
            return [_step("calculator", "compute the expression",
                          {"expression": task["expression"]})]
        if t == "lookup":
            return [_step("kb_lookup", "look up the knowledge base entry",
                          {"key": task["key"]})]
        if t == "word_count":
            return [_step("word_count", "count the words in the text",
                          {"text": task["text"]})]
        if t == "memory":
            return [_step("remember", "store the value in memory",
                          {"key": task["memory_key"], "value": task["memory_value"]}),
                    _step("recall", "recall the stored value",
                          {"key": task["memory_key"]})]
        if t == "memory_write":
            return [_step("remember", "store the value in persistent memory",
                          {"key": task["memory_key"], "value": task["memory_value"]})]
        if t == "recall_persist":
            return [_step("recall", "recall a value stored by an earlier task",
                          {"key": task["memory_key"]})]
        if t == "multi_step":
            return [_step("calculator", "compute the expression",
                          {"expression": task["expression"]}),
                    _step("remember", "store the computed result",
                          {"key": task["memory_key"], "value": "$prev"}),
                    _step("recall", "recall the stored result",
                          {"key": task["memory_key"]})]
        if t == "converter":
            return [_step("unit_converter", "convert the value",
                          {"value": task["value"], "conversion": task["conversion"]})]
        if t == "kb_search_task":
            return [_step("kb_search", "search the knowledge base by keywords",
                          {"query": task["query"]})]
        if t == "search_then_lookup":
            return [_step("kb_search", "find the best matching entry key",
                          {"query": task["query"]}),
                    _step("kb_lookup", "look up the entry found by search",
                          {"key": "$prev"})]
        if t == "convert_memory":
            return [_step("unit_converter", "convert the value",
                          {"value": task["value"], "conversion": task["conversion"]}),
                    _step("remember", "store the converted value",
                          {"key": task["memory_key"], "value": "$prev"}),
                    _step("recall", "recall the stored converted value",
                          {"key": task["memory_key"]})]
        if t == "count_memory":
            return [_step("word_count", "count the words in the text",
                          {"text": task["text"]}),
                    _step("remember", "store the word count",
                          {"key": task["memory_key"], "value": "$prev"}),
                    _step("recall", "recall the stored word count",
                          {"key": task["memory_key"]})]
        if t == "recovery_retry":
            return [_step("calculator", "compute with the supplied arguments",
                          task["bad_args"])]
        if t == "recovery_fallback":
            return [_step("kb_lookup", "look up the requested entry",
                          {"key": task["key"]})]
        if t == "recovery_skip":
            return [_step("kb_lookup", "optional lookup before the main step",
                          {"key": task["key"]}, optional=True),
                    _step("calculator", "compute the main expression",
                          {"expression": task["expression"]})]
        if t == "unrecoverable":
            return [_step("calculator", "compute the expression",
                          {"expression": task["expression"]})]
        raise ToolError("unknown task type: '" + str(t) + "'")


# ---------------------------------------------------------------- agent

_ARG_SHAPE_HINTS = ("missing argument", "must be", "requires", "only numeric")


def _resolve(args, last_observation):
    out = {}
    for k, v in args.items():
        out[k] = last_observation if v == "$prev" else v
    return out


class Agent:
    def __init__(self, memory_path=None, max_steps=20):
        if not isinstance(max_steps, int) or max_steps < 1:
            raise ToolError("max_steps must be a positive integer")
        self.max_steps = max_steps
        self.planner = Planner()
        self.memory = MemoryStore(memory_path)

    def run_task(self, task):
        try:
            plan = self.planner.plan(task)
        except ToolError as exc:
            result = self._base(task, [])
            result.update({"success": False, "answer": None, "steps": 0,
                           "tools_used": [], "recovered": False, "replans": 0,
                           "recoveries": [], "trace": [
                               {"event": "error", "error": str(exc)}],
                           "error": str(exc)})
            result["passed"] = self._passed(result)
            return result

        # The stored plan numbers its steps; execution uses a working copy.
        stored_plan = []
        for i, s in enumerate(plan, start=1):
            entry = dict(s)
            entry["step"] = i
            stored_plan.append(entry)
        current = [dict(s) for s in plan]

        trace = []
        tools_used = []
        recoveries = []
        replans = 0
        steps = 0
        last_observation = None
        answer = None
        idx = 0

        while idx < len(current):
            if steps >= self.max_steps:
                return self._finish(task, stored_plan, False, None, steps,
                                    tools_used, recoveries, replans, trace,
                                    "max_steps exceeded")
            step = current[idx]
            tool_name = step["tool"]
            args = _resolve(step["args"], last_observation)
            steps += 1
            tools_used.append(tool_name)
            try:
                obs = call_tool(tool_name, args, self.memory)
            except ToolError as exc:
                trace.append({"step": steps, "event": "error", "tool": tool_name,
                              "args": args, "error": str(exc)})
                strategy = self._choose_strategy(task, step, str(exc), replans)
                recoveries.append(strategy)
                if strategy == "abort":
                    return self._finish(task, stored_plan, False, None, steps,
                                        tools_used, recoveries, replans, trace,
                                        str(exc))
                replans += 1
                trace.append({"step": steps, "event": "replan",
                              "strategy": strategy, "tool": tool_name})
                if strategy == "skip_step":
                    idx += 1
                    continue
                if strategy == "retry_correct":
                    current[idx] = _step(tool_name,
                                         step["purpose"] + " (corrected arguments)",
                                         task["corrected_args"],
                                         optional=step.get("optional", False))
                    continue
                if strategy == "fallback_tool":
                    current[idx] = _step("kb_search",
                                         "fallback keyword search for the entry",
                                         {"query": task["fallback_query"]},
                                         optional=step.get("optional", False))
                    continue
                return self._finish(task, stored_plan, False, None, steps,
                                    tools_used, recoveries, replans, trace,
                                    str(exc))
            trace.append({"step": steps, "event": "observe", "tool": tool_name,
                          "args": args, "observation": obs})
            last_observation = obs
            answer = obs
            idx += 1

        return self._finish(task, stored_plan, True, answer, steps,
                            tools_used, recoveries, replans, trace, None)

    @staticmethod
    def _choose_strategy(task, step, error_text, replans):
        if replans >= 1:
            return "abort"
        low = error_text.lower()
        if step.get("optional"):
            return "skip_step"
        if "division by zero" in low:
            return "abort"
        if (step["tool"] == "kb_lookup" and "no entry" in low
                and task.get("fallback_query")):
            return "fallback_tool"
        if task.get("corrected_args") and any(h in low for h in _ARG_SHAPE_HINTS):
            return "retry_correct"
        return "abort"

    @staticmethod
    def _base(task, plan):
        return {"task_id": task.get("id"), "type": task.get("type"),
                "category": task.get("category"), "plan": plan}

    @staticmethod
    def _passed(result):
        return (result["success"] == result.get("expected_success")) and (
            not result["success"] or result["answer"] == result.get("expected_answer"))

    def _finish(self, task, plan, success, answer, steps, tools_used,
                recoveries, replans, trace, error):
        result = self._base(task, plan)
        recovered = success and any(r != "abort" for r in recoveries)
        result.update({
            "success": success,
            "answer": answer,
            "expected_answer": task.get("expected_answer"),
            "expected_success": task.get("expected_success"),
            "steps": steps,
            "tools_used": tools_used,
            "recovered": recovered,
            "replans": replans,
            "recoveries": recoveries,
            "trace": trace,
        })
        result["passed"] = self._passed(result)
        if error is not None:
            result["error"] = error
        return result
