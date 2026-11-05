"""Tool-using agent loop with no framework, Level 1 Learn.

The planner is a deterministic policy, not a real LLM and not an API.
It reads the task type and emits the next tool call from a fixed rule.
A real LLM planner is Build level scope.

Tools use only the Python standard library. The calculator parses
arithmetic with ast and never uses eval.
"""
import ast
import operator


class ToolError(Exception):
    """Named error for unknown tools, bad arguments, and tool failures."""


KB = {
    "agent": "An agent is a system that perceives, plans, and acts using tools to complete a task.",
    "tool": "A tool is a named function an agent can call with validated arguments.",
    "memory": "Memory is a store an agent uses to save and recall information across steps.",
    "planning": "Planning is choosing the next action based on the task and past observations.",
    "loop": "A loop repeats plan, act, and observe until the task is done or a limit is reached.",
}

_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def _eval_node(node):
    if isinstance(node, ast.Constant):
        if isinstance(node.value, (int, float)) and not isinstance(node.value, bool):
            return node.value
        raise ToolError("calculator: only numeric constants are allowed")
    if isinstance(node, ast.BinOp) and type(node.op) in _OPS:
        left = _eval_node(node.left)
        right = _eval_node(node.right)
        if isinstance(node.op, (ast.Div, ast.FloorDiv, ast.Mod)) and right == 0:
            raise ToolError("calculator: division by zero")
        return _OPS[type(node.op)](left, right)
    if isinstance(node, ast.UnaryOp) and type(node.op) in _OPS:
        return _OPS[type(node.op)](_eval_node(node.operand))
    raise ToolError("calculator: unsupported expression element: " + type(node).__name__)


def tool_calculator(args, memory):
    if not isinstance(args, dict) or "expression" not in args:
        raise ToolError("calculator: missing argument 'expression'")
    expr = args["expression"]
    if not isinstance(expr, str) or not expr.strip():
        raise ToolError("calculator: 'expression' must be a non-empty string")
    try:
        tree = ast.parse(expr, mode="eval")
    except SyntaxError as exc:
        raise ToolError("calculator: invalid syntax: " + str(exc)) from exc
    result = _eval_node(tree.body)
    if isinstance(result, float) and result.is_integer():
        return int(result)
    return result


def tool_kb_lookup(args, memory):
    if not isinstance(args, dict) or "key" not in args:
        raise ToolError("kb_lookup: missing argument 'key'")
    key = args["key"]
    if not isinstance(key, str) or not key:
        raise ToolError("kb_lookup: 'key' must be a non-empty string")
    if key not in KB:
        raise ToolError("kb_lookup: no entry for key '" + key + "'")
    return KB[key]


def tool_word_count(args, memory):
    if not isinstance(args, dict) or "text" not in args:
        raise ToolError("word_count: missing argument 'text'")
    text = args["text"]
    if not isinstance(text, str):
        raise ToolError("word_count: 'text' must be a string")
    return len(text.split())


def tool_remember(args, memory):
    if not isinstance(args, dict) or "key" not in args or "value" not in args:
        raise ToolError("remember: requires 'key' and 'value'")
    key = args["key"]
    if not isinstance(key, str) or not key:
        raise ToolError("remember: 'key' must be a non-empty string")
    memory[key] = args["value"]
    return args["value"]


def tool_recall(args, memory):
    if not isinstance(args, dict) or "key" not in args:
        raise ToolError("recall: missing argument 'key'")
    key = args["key"]
    if not isinstance(key, str) or not key:
        raise ToolError("recall: 'key' must be a non-empty string")
    if key not in memory:
        raise ToolError("recall: no value stored for key '" + key + "'")
    return memory[key]


TOOLS = {
    "calculator": tool_calculator,
    "kb_lookup": tool_kb_lookup,
    "word_count": tool_word_count,
    "remember": tool_remember,
    "recall": tool_recall,
}


def call_tool(name, args, memory):
    if name not in TOOLS:
        raise ToolError("unknown tool: '" + str(name) + "'")
    return TOOLS[name](args, memory)


class DeterministicPolicy:
    """Fixed rule planner. Reads task type, emits the next tool call."""

    def next_call(self, task, completed, last_observation):
        t = task.get("type")
        if t == "calculator":
            if completed == 0:
                return ("calculator", {"expression": task["expression"]})
            return None
        if t == "lookup":
            if completed == 0:
                return ("kb_lookup", {"key": task["key"]})
            return None
        if t == "word_count":
            if completed == 0:
                return ("word_count", {"text": task["text"]})
            return None
        if t == "memory":
            if completed == 0:
                return ("remember", {"key": task["memory_key"], "value": task["memory_value"]})
            if completed == 1:
                return ("recall", {"key": task["memory_key"]})
            return None
        if t == "multi_step":
            if completed == 0:
                return ("calculator", {"expression": task["expression"]})
            if completed == 1:
                return ("remember", {"key": task["memory_key"], "value": last_observation})
            if completed == 2:
                return ("recall", {"key": task["memory_key"]})
            return None
        if t == "recovery":
            if completed == 0:
                return ("calculator", task["bad_args"])
            return None
        if t == "unrecoverable":
            if completed == 0:
                return ("calculator", {"expression": task["expression"]})
            return None
        raise ToolError("unknown task type: '" + str(t) + "'")

    def corrected_call(self, task, failed_call):
        """Return a corrected call for one retry, or the same call if none exists."""
        if task.get("type") == "recovery":
            return ("calculator", task["corrected_args"])
        return failed_call


class Agent:
    def __init__(self, max_steps=10):
        if not isinstance(max_steps, int) or max_steps < 1:
            raise ToolError("max_steps must be a positive integer")
        self.max_steps = max_steps
        self.policy = DeterministicPolicy()
        self.memory = {}

    def run_task(self, task):
        self.memory = {}
        trace = []
        tools_used = []
        completed = 0
        last_observation = None
        answer = None
        recovered = False
        steps = 0
        while steps < self.max_steps:
            try:
                call = self.policy.next_call(task, completed, last_observation)
            except ToolError as exc:
                trace.append({"step": steps + 1, "event": "error", "error": str(exc)})
                return self._result(task, False, None, steps, tools_used, recovered, trace, str(exc))
            if call is None:
                return self._result(task, True, answer, steps, tools_used, recovered, trace, None)
            tool_name, args = call
            steps += 1
            tools_used.append(tool_name)
            try:
                obs = call_tool(tool_name, args, self.memory)
            except ToolError as exc:
                trace.append({"step": steps, "event": "error", "tool": tool_name,
                              "args": args, "error": str(exc)})
                if steps >= self.max_steps:
                    break
                # Retry once with corrected args.
                r_tool, r_args = self.policy.corrected_call(task, call)
                steps += 1
                tools_used.append(r_tool)
                try:
                    obs = call_tool(r_tool, r_args, self.memory)
                except ToolError as exc2:
                    trace.append({"step": steps, "event": "error", "tool": r_tool,
                                  "args": r_args, "error": str(exc2)})
                    return self._result(task, False, None, steps, tools_used, recovered, trace, str(exc2))
                recovered = True
                trace.append({"step": steps, "event": "retry_success", "tool": r_tool,
                              "args": r_args, "observation": obs})
                last_observation = obs
                answer = obs
                completed += 1
                continue
            trace.append({"step": steps, "event": "observe", "tool": tool_name,
                          "args": args, "observation": obs})
            last_observation = obs
            answer = obs
            completed += 1
        # max_steps exhausted
        if completed > 0 and self.policy.next_call(task, completed, last_observation) is None:
            return self._result(task, True, answer, steps, tools_used, recovered, trace, None)
        return self._result(task, False, None, steps, tools_used, recovered, trace,
                            "max_steps exceeded")

    @staticmethod
    def _result(task, success, answer, steps, tools_used, recovered, trace, error):
        result = {
            "task_id": task.get("id"),
            "type": task.get("type"),
            "success": success,
            "answer": answer,
            "expected_answer": task.get("expected_answer"),
            "expected_success": task.get("expected_success"),
            "steps": steps,
            "tools_used": tools_used,
            "recovered": recovered,
            "trace": trace,
        }
        result["passed"] = (success == task.get("expected_success")) and (
            not success or answer == task.get("expected_answer"))
        if error is not None:
            result["error"] = error
        return result
