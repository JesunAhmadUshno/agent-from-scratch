"""Extra Deep analyses, all on CPU in seconds.

Run: python level-3-deep/analyze_deep.py
Writes, next to this file:

- results_deep_rounds.json: the critique-round ablation (ROADMAP v1.1
  item 7), max rounds 0, 1, 2 and 3 on the same 32-task suite, plus
  the clean versus targeted revision comparison (item 3).
- results_deep_stats.json: Wilson 95% intervals and an exact McNemar
  test for without versus with critique, from the per-task rows of
  results_deep.json. Valid for this seeded suite only.
- results_deep_cross.json: a six-task suite run with memory shared
  across tasks (item 4), in both modes.
- timing_deep.json: wall-clock time per task beside the step counts.
  Timing varies by machine and run, so it lives outside the
  results_deep*.json files, which are deterministic.

results_deep.json itself is never written here.
"""
import json
import math
import os
import platform
import statistics
import sys
import time
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from agent_deep import DeepAgent  # noqa: E402
from run_deep import _run_mode  # noqa: E402

Z95 = 1.959964


def load(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return json.load(f)


def wilson(k, n, z=Z95):
    """Wilson score interval for k successes in n trials."""
    p = k / n
    den = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / den
    half = (z / den) * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return [round(max(0.0, centre - half), 4), round(min(1.0, centre + half), 4)]


def mcnemar_exact(b, c):
    """Two-sided exact McNemar p: binomial test on the discordant pairs."""
    n = b + c
    if n == 0:
        return 1.0
    tail = sum(math.comb(n, i) for i in range(min(b, c) + 1)) / 2 ** n
    return min(1.0, 2 * tail)


def summarize(rows, tasks):
    exp = [r for r, t in zip(rows, tasks) if t["expected_success"]]
    hits = sum(1 for r in exp if r["success"])
    return {"succeeded": hits, "expected_success_tasks": len(exp),
            "success_rate": round(hits / len(exp), 4),
            "total_steps": sum(r["steps"] for r in rows),
            "mean_steps": round(sum(r["steps"] for r in rows) / len(rows), 4),
            "revisions": sum(r["revisions"] for r in rows),
            "outcomes": dict(sorted(Counter(r["critique_outcome"] for r in rows).items()))}


def rounds_ablation(tasks):
    out = {}
    for rounds in (0, 1, 2, 3):
        rows = _run_mode(tasks, use_critique=rounds > 0, max_rounds=rounds)
        out[str(rounds)] = summarize(rows, tasks)
    return out


def revision_variants(tasks):
    return {mode: summarize(_run_mode(tasks, use_critique=True, revision=mode), tasks)
            for mode in ("clean", "targeted")}


def interval_stats(deep):
    tasks = {r["task_id"]: r for r in deep["without_critique"]}
    pairs = [(tasks[r["task_id"]]["success"], r["success"])
             for r in deep["with_critique"] if r["expected_success"]]
    n = len(pairs)
    k0 = sum(1 for a, _ in pairs if a)
    k1 = sum(1 for _, b in pairs if b)
    b = sum(1 for a, c in pairs if not a and c)
    c = sum(1 for a, d in pairs if a and not d)
    s = deep["summary"]
    return {
        "n": n,
        "without": {"k": k0, "rate": round(k0 / n, 4), "wilson95": wilson(k0, n)},
        "with": {"k": k1, "rate": round(k1 / n, 4), "wilson95": wilson(k1, n)},
        "false_critique": {"k": s["false_critiques"], "n": s["correct_drafts"],
                           "wilson95": wilson(s["false_critiques"], s["correct_drafts"])},
        "mcnemar": {"fixed_by_critique": b, "broken_by_critique": c,
                    "p_exact_two_sided": mcnemar_exact(b, c)},
        "caveat": "The 13 fixed tasks carry errors seeded on purpose, so the test "
                  "shows the critic catches these seeded kinds on this suite. It says "
                  "nothing about errors that occur without seeding.",
    }


def cross_task(tasks):
    out = {}
    for mode, use in (("without_critique", False), ("with_critique", True)):
        rows = _run_mode(tasks, use_critique=use, isolate=False)
        key = "expected_critique_outcome" if use else "expected_without_critique_success"
        for r, t in zip(rows, tasks):
            r["matched"] = (r["critique_outcome"] == t[key]) if use else (r["success"] == t[key])
            r["expected_answer"] = t["expected_answer"]
        out[mode] = {"summary": summarize(rows, tasks),
                     "matched": sum(1 for r in rows if r["matched"]),
                     "rows": [{k: r[k] for k in ("task_id", "type", "answer", "success", "steps",
                                                  "critique_outcome", "matched", "expected_answer")}
                              for r in rows]}
    return out


def timing(tasks, repeats=200):
    """Median wall-clock microseconds per task, over repeated suite runs."""
    per = {"without_critique": {t["id"]: [] for t in tasks},
           "with_critique": {t["id"]: [] for t in tasks}}
    agent = DeepAgent(memory_path=None)
    for _ in range(repeats):
        for mode, use in (("without_critique", False), ("with_critique", True)):
            for t in tasks:
                t0 = time.perf_counter()
                agent.run_task(t, use_critique=use)
                per[mode][t["id"]].append((time.perf_counter() - t0) * 1e6)
    out = {"python": platform.python_version(), "machine": platform.machine(),
           "repeats": repeats, "memory": "in-process (no file writes)", "per_task_median_us": {}}
    for mode in per:
        med = {k: round(statistics.median(v), 2) for k, v in per[mode].items()}
        out["per_task_median_us"][mode] = med
        out[f"mean_of_medians_us_{mode}"] = round(sum(med.values()) / len(med), 2)
    return out


def write(name, data):
    with open(os.path.join(HERE, name), "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, sort_keys=True)
        f.write("\n")
    print("Wrote", name)


def main():
    tasks = load("tasks_deep.json")
    deep = load("results_deep.json")
    write("results_deep_rounds.json", {"rounds": rounds_ablation(tasks),
                                       "revision": revision_variants(tasks)})
    write("results_deep_stats.json", interval_stats(deep))
    write("results_deep_cross.json", cross_task(load("tasks_deep_cross.json")))
    if "--no-timing" not in sys.argv:
        write("timing_deep.json", timing(tasks))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
