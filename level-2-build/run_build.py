"""Run all Build tasks and write deterministic results.

Run: python level-2-build/run_build.py
Writes level-2-build/results_build.json. No timestamps and no
randomness, so two runs produce an identical file. The whole suite
shares one Agent and one temporary memory file, so a later task can
recall a value an earlier task stored. The temp file is removed
after the run; the results file records what happened.
"""
import json
import os
import sys
import tempfile
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from agent_build import Agent  # noqa: E402

STRATEGIES = ("retry_correct", "fallback_tool", "skip_step", "abort")


def main():
    with open(os.path.join(HERE, "tasks_build.json"), encoding="utf-8") as f:
        tasks = json.load(f)
    fd, mem_path = tempfile.mkstemp(prefix="p07-memory-", suffix=".json")
    os.close(fd)
    os.unlink(mem_path)  # the store starts empty if the file is absent
    try:
        agent = Agent(memory_path=mem_path, max_steps=20)
        results = []
        for task in tasks:
            r = agent.run_task(task)
            results.append(r)
            status = "PASS" if r["passed"] else "FAIL"
            print(f"{r['task_id']} {r['type']}: steps={r['steps']} "
                  f"tools={','.join(r['tools_used'])} "
                  f"recoveries={','.join(r['recoveries']) or 'none'} "
                  f"success={r['success']} answer={r['answer']!r} [{status}]")
    finally:
        if os.path.exists(mem_path):
            os.unlink(mem_path)

    passed = sum(1 for r in results if r["passed"])
    exp_ok = [r for r in results if r["expected_success"]]
    ok_hits = sum(1 for r in exp_ok if r["success"])
    counts = Counter(s for r in results for s in r["recoveries"])
    by_category = {}
    for task, r in zip(tasks, results):
        cat = by_category.setdefault(task["category"], {"total": 0, "passed": 0})
        cat["total"] += 1
        cat["passed"] += 1 if r["passed"] else 0
    summary = {
        "total": len(results),
        "passed": passed,
        "succeeded": sum(1 for r in results if r["success"]),
        "failed_as_expected": sum(1 for r in results
                                  if not r["success"] and r["passed"]),
        "success_rate_expected_success": round(ok_hits / len(exp_ok), 4) if exp_ok else 0,
        "mean_steps": round(sum(r["steps"] for r in results) / len(results), 4),
        "replans": sum(r["replans"] for r in results),
        "recovery_counts": {s: counts.get(s, 0) for s in STRATEGIES},
        "by_category": by_category,
    }
    out = {"summary": summary, "results": results}
    path = os.path.join(HERE, "results_build.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, sort_keys=True)
        f.write("\n")
    print(f"Summary: {passed} of {len(results)} tasks matched expectations; "
          f"success rate on expected-success tasks "
          f"{summary['success_rate_expected_success']}; "
          f"mean steps {summary['mean_steps']}; "
          f"recoveries {summary['recovery_counts']}")
    print("Wrote", path)
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
