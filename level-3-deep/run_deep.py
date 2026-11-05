"""Run all Deep tasks in both modes and write deterministic results.

Run: python level-3-deep/run_deep.py
Writes level-3-deep/results_deep.json. No timestamps and no
randomness, so two runs produce an identical file. Each task is
run without critique (draft only) and with critique (draft,
critic, bounded revision) on the same suite, with a fresh
temporary memory file per mode run.
"""
import json
import os
import sys
import tempfile
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from agent_deep import DeepAgent  # noqa: E402


def _run_mode(tasks, use_critique):
    fd, mem_path = tempfile.mkstemp(prefix="p07-deep-memory-", suffix=".json")
    os.close(fd)
    os.unlink(mem_path)
    try:
        agent = DeepAgent(memory_path=mem_path)
        return [agent.run_task(t, use_critique=use_critique) for t in tasks]
    finally:
        if os.path.exists(mem_path):
            os.unlink(mem_path)


def main():
    with open(os.path.join(HERE, "tasks_deep.json"), encoding="utf-8") as f:
        tasks = json.load(f)
    task_by_id = {t["id"]: t for t in tasks}

    without = _run_mode(tasks, use_critique=False)
    with_c = _run_mode(tasks, use_critique=True)

    for r in with_c:
        t = task_by_id[r["task_id"]]
        r["expected_answer"] = t["expected_answer"]
        r["expected_success"] = t["expected_success"]
        r["expected_critique_outcome"] = t["expected_critique_outcome"]
        r["outcome_matched"] = r["critique_outcome"] == t["expected_critique_outcome"]
        r["passed"] = (r["success"] == t["expected_success"]) and r["outcome_matched"]
        print(f"{r['task_id']} {r['type']}: outcome={r['critique_outcome']} "
              f"rounds={r['critique_rounds']} revisions={r['revisions']} "
              f"success={r['success']} answer={r['answer']!r} "
              f"[{'PASS' if r['passed'] else 'FAIL'}]")
    for r in without:
        t = task_by_id[r["task_id"]]
        r["expected_answer"] = t["expected_answer"]
        r["expected_success"] = t["expected_success"]
        r["expected_without_critique_success"] = t["expected_without_critique_success"]
        r["passed"] = r["success"] == t["expected_without_critique_success"]

    def rate(results):
        exp_ok = [r for r in results if r["expected_success"]]
        hits = sum(1 for r in exp_ok if r["success"])
        return round(hits / len(exp_ok), 4) if exp_ok else 0

    # False critique: a correct draft (answer matches and draft
    # succeeded, or the plan-incomplete draft with correct answer)
    # that the critic flagged in round 1. Correctness is judged on
    # the draft answer and success, which is why the plan-incomplete
    # task counts: its answer was correct but its plan was not.
    correct_drafts = 0
    false_critiques = 0
    for r, t in zip(with_c, tasks):
        draft_correct = bool(r["draft_success"]) and r["draft_answer"] == t["expected_answer"]
        if draft_correct:
            correct_drafts += 1
            if r["critique_log"] and not r["critique_log"][0]["passed"]:
                # A plan completeness flag on a correct answer is a
                # true critique, not a false one: exclude it when
                # the only issue is plan_incomplete.
                issues = r["critique_log"][0]["issues"]
                if "plan_incomplete" not in issues:
                    false_critiques += 1
    still_failing = []
    for r in with_c:
        if not r["success"] and not r["expected_success"]:
            reason = "unfixable"
            if r["critique_log"]:
                reason = "; ".join(r["critique_log"][-1]["issues"]) or "unfixable"
            still_failing.append({"task_id": r["task_id"], "reason": reason})
        elif not r["success"] and r["expected_success"]:
            still_failing.append({"task_id": r["task_id"],
                                  "reason": "still failing after critique: "
                                  + str(r.get("error"))})

    rounds_dist = Counter(r["critique_rounds"] for r in with_c)
    outcomes = Counter(r["critique_outcome"] for r in with_c)
    summary = {
        "total": len(tasks),
        "critique_target_tasks": sum(1 for t in tasks
                                     if t["category"] == "critique_target"),
        "passed_with_critique": sum(1 for r in with_c if r["passed"]),
        "outcome_matched": sum(1 for r in with_c if r["outcome_matched"]),
        "success_rate_without_critique": rate(without),
        "success_rate_with_critique": rate(with_c),
        "succeeded_without_critique": sum(1 for r in without if r["success"]),
        "succeeded_with_critique": sum(1 for r in with_c if r["success"]),
        "expected_success_tasks": sum(1 for t in tasks if t["expected_success"]),
        "mean_steps_without_critique": round(
            sum(r["steps"] for r in without) / len(without), 4),
        "mean_steps_with_critique": round(
            sum(r["steps"] for r in with_c) / len(with_c), 4),
        "mean_cost_without_critique": round(
            sum(r["cost_steps"] for r in without) / len(without), 4),
        "mean_cost_with_critique": round(
            sum(r["cost_steps"] for r in with_c) / len(with_c), 4),
        "critique_rounds_distribution": {str(k): rounds_dist.get(k, 0)
                                         for k in sorted(rounds_dist)},
        "critique_outcomes": dict(sorted(outcomes.items())),
        "total_revisions": sum(r["revisions"] for r in with_c),
        "correct_drafts": correct_drafts,
        "false_critiques": false_critiques,
        "false_critique_rate": round(false_critiques / correct_drafts, 4)
        if correct_drafts else 0,
        "still_failing_after_critique": still_failing,
        "max_critique_rounds": 2,
    }
    out = {"summary": summary, "without_critique": without,
           "with_critique": with_c}
    path = os.path.join(HERE, "results_deep.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, sort_keys=True)
        f.write("\n")
    print(f"Summary: with critique {summary['passed_with_critique']} of "
          f"{len(tasks)} tasks matched all expectations; success rate "
          f"without {summary['success_rate_without_critique']} with "
          f"{summary['success_rate_with_critique']}; false critique rate "
          f"{summary['false_critique_rate']}")
    print("Wrote", path)
    return 0 if summary["passed_with_critique"] == len(tasks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
