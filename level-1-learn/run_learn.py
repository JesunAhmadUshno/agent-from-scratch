"""Run all Learn tasks and write deterministic results.

Run: python level-1-learn/run_learn.py
Writes level-1-learn/results_learn.json. No timestamps, no randomness,
so two runs produce an identical file.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from agent import Agent  # noqa: E402


def main():
    with open(os.path.join(HERE, "tasks.json"), encoding="utf-8") as f:
        tasks = json.load(f)
    results = []
    for task in tasks:
        agent = Agent(max_steps=10)
        r = agent.run_task(task)
        results.append(r)
        status = "PASS" if r["passed"] else "FAIL"
        print(f"{r['task_id']} {r['type']}: steps={r['steps']} "
              f"tools={','.join(r['tools_used'])} recovered={r['recovered']} "
              f"success={r['success']} answer={r['answer']!r} [{status}]")
    passed = sum(1 for r in results if r["passed"])
    summary = {"total": len(results), "passed": passed,
               "succeeded": sum(1 for r in results if r["success"]),
               "failed_as_expected": sum(1 for r in results
                                         if not r["success"] and r["passed"]),
               "recovered": sum(1 for r in results if r["recovered"])}
    out = {"summary": summary, "results": results}
    path = os.path.join(HERE, "results_learn.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, sort_keys=True)
        f.write("\n")
    print(f"Summary: {passed} of {len(results)} tasks matched expectations; "
          f"recovered={summary['recovered']}")
    print("Wrote", path)
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
