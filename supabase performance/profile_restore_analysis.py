#!/usr/bin/env python3
"""Analyze a React DevTools Profiler export (version 5) focusing on the
"restore after background" burst.

Heuristic:
- Find the largest gap between commit timestamps (tab was hidden / user away).
- Treat the commit right after that gap as the restore point.
- Summarize commits in a window after restore (default: 2000ms).

Outputs a JSON report that is easy to diff/share.

Usage:
  python profile_restore_analysis.py <profile.json> [window_ms] [out.json]
"""

from __future__ import annotations

import json
import sys
from collections import defaultdict


def _load(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _as_pairs_fiber_durations(fas):
    """Return iterable of (fiber_id, duration_ms)."""
    if not fas:
        return []
    if isinstance(fas, dict):
        return list(fas.items())
    # expect list of [id, duration]
    out = []
    for item in fas:
        if isinstance(item, (list, tuple)) and len(item) >= 2:
            out.append((item[0], item[1]))
        elif isinstance(item, (list, tuple)) and len(item) == 1:
            out.append((item[0], 0))
    return out


def _build_id_meta(root: dict) -> dict[int, dict]:
    id_meta: dict[int, dict] = {}
    for snap in root.get("snapshots") or []:
        if isinstance(snap, (list, tuple)) and len(snap) >= 2:
            fid = snap[0]
            meta = snap[1] or {}
            id_meta[fid] = meta
    return id_meta


def _fiber_name(fid: int, meta: dict) -> str:
    if not meta:
        return f"Fiber#{fid}"
    name = meta.get("displayName") or meta.get("key")
    if isinstance(name, list):
        # hocDisplayNames sometimes shows up as list
        name = name[0] if name else None
    return name or f"Fiber#{fid}"


def _summarize_commit(commit: dict) -> dict:
    fas_pairs = _as_pairs_fiber_durations(commit.get("fiberActualDurations"))
    total_actual_ms = 0.0
    for _fid, dur in fas_pairs:
        try:
            total_actual_ms += float(dur or 0)
        except Exception:
            pass

    change_descriptions = commit.get("changeDescriptions") or []

    reasons = {
        "context": 0,
        "didHooksChange": 0,
        "props": 0,
        "state": 0,
        "hooks": 0,
    }

    # changeDescriptions is list of [fiberId, {context, props, state, hooks, didHooksChange, ...}]
    for entry in change_descriptions:
        if not isinstance(entry, (list, tuple)) or len(entry) < 2:
            continue
        info = entry[1] or {}
        if info.get("context") is True:
            reasons["context"] += 1
        if info.get("didHooksChange") is True:
            reasons["didHooksChange"] += 1
        props = info.get("props")
        if isinstance(props, list) and len(props) > 0:
            reasons["props"] += 1
        # state can be null, number, list, etc. We only count non-null.
        if info.get("state") is not None:
            reasons["state"] += 1
        hooks = info.get("hooks")
        if isinstance(hooks, list) and len(hooks) > 0:
            reasons["hooks"] += 1

    return {
        "timestamp": commit.get("timestamp"),
        "duration_ms": commit.get("duration"),
        "priorityLevel": commit.get("priorityLevel"),
        "renderedFibers": len(fas_pairs),
        "totalActualDurationMs": round(total_actual_ms, 3),
        "changeDescriptionsCount": len(change_descriptions) if isinstance(change_descriptions, list) else 0,
        "reasons": reasons,
    }


def analyze(profile_path: str, window_ms: int = 2000) -> dict:
    data = _load(profile_path)

    roots = data.get("dataForRoots") or []
    if isinstance(roots, dict):
        roots = list(roots.values())
    if not roots:
        return {"error": "No dataForRoots found"}

    root = roots[0]
    commits = root.get("commitData") or []
    if not commits:
        return {"error": "No commitData found"}

    timestamps = [c.get("timestamp") for c in commits]
    # keep only numeric
    ts = [t for t in timestamps if isinstance(t, (int, float))]

    # Some exports (especially when you record a single interaction) contain just 1 commit.
    # In that case, analyze that commit directly.
    if len(commits) == 1:
        id_meta = _build_id_meta(root)
        commit = commits[0]

        per_fiber = defaultdict(lambda: {
            "renders": 0,
            "totalActualMs": 0.0,
            "reasons": {"context": 0, "props": 0, "state": 0, "didHooksChange": 0, "hooks": 0},
        })

        for fid, dur in _as_pairs_fiber_durations(commit.get("fiberActualDurations")):
            try:
                dur_f = float(dur or 0)
            except Exception:
                dur_f = 0.0
            per_fiber[fid]["renders"] += 1
            per_fiber[fid]["totalActualMs"] += dur_f

        for entry in commit.get("changeDescriptions") or []:
            if not isinstance(entry, (list, tuple)) or len(entry) < 2:
                continue
            fid = entry[0]
            info = entry[1] or {}
            if info.get("context") is True:
                per_fiber[fid]["reasons"]["context"] += 1
            if info.get("didHooksChange") is True:
                per_fiber[fid]["reasons"]["didHooksChange"] += 1
            props = info.get("props")
            if isinstance(props, list) and len(props) > 0:
                per_fiber[fid]["reasons"]["props"] += 1
            if info.get("state") is not None:
                per_fiber[fid]["reasons"]["state"] += 1
            hooks = info.get("hooks")
            if isinstance(hooks, list) and len(hooks) > 0:
                per_fiber[fid]["reasons"]["hooks"] += 1

        ranked = []
        for fid, s in per_fiber.items():
            meta = id_meta.get(fid, {})
            name = _fiber_name(fid, meta)
            ranked.append(
                {
                    "fiberId": fid,
                    "name": name,
                    "renders": s["renders"],
                    "totalActualMs": round(float(s["totalActualMs"]), 3),
                    "avgActualMs": round(float(s["totalActualMs"]) / s["renders"], 3) if s["renders"] else 0.0,
                    "reasonCounts": s["reasons"],
                }
            )
        ranked.sort(key=lambda x: x["totalActualMs"], reverse=True)

        def top_by_reason(reason_key: str, n: int = 30):
            items = []
            for x in ranked:
                cnt = (x.get("reasonCounts") or {}).get(reason_key) or 0
                if cnt:
                    items.append({
                        "fiberId": x["fiberId"],
                        "name": x["name"],
                        "count": int(cnt),
                        "totalActualMs": x["totalActualMs"],
                    })
            items.sort(key=lambda z: (z["count"], z["totalActualMs"]), reverse=True)
            return items[:n]

        # Session stats
        session_ms = 0

        return {
            "input": profile_path,
            "version": data.get("version"),
            "commitCount": 1,
            "sessionDurationMs": session_ms,
            "largestGapMs": None,
            "gapBeforeCommitIndex": None,
            "gapAfterCommitIndex": None,
            "restoreTimestamp": commit.get("timestamp"),
            "windowMs": window_ms,
            "restoreCommitCount": 1,
            "restoreCommitIndices": [0],
            "restoreCommits": [{"index": 0, **_summarize_commit(commit)}],
            "topFibersAfterRestore": ranked[:30],
            "topFibersByContextChanges": top_by_reason("context", 30),
            "topFibersByPropsChanges": top_by_reason("props", 30),
            "topFibersByStateChanges": top_by_reason("state", 30),
            "topFibersByHooksChanges": top_by_reason("hooks", 30),
            "topFibersByDidHooksChange": top_by_reason("didHooksChange", 30),
        }

    if len(ts) < 2:
        return {"error": "Not enough timestamps to infer background gap", "commitCount": len(commits)}

    # Find largest gap
    gaps = []
    for i in range(1, len(ts)):
        gap = ts[i] - ts[i - 1]
        gaps.append((gap, i - 1, i))
    gaps.sort(key=lambda x: x[0], reverse=True)
    max_gap_ms, before_idx, after_idx = gaps[0]

    restore_ts = ts[after_idx]
    window_end = restore_ts + window_ms

    restore_commit_indices = []
    for idx, c in enumerate(commits):
        t = c.get("timestamp")
        if not isinstance(t, (int, float)):
            continue
        if restore_ts <= t <= window_end:
            restore_commit_indices.append(idx)

    id_meta = _build_id_meta(root)

    # Aggregate per-fiber in restore window
    per_fiber = defaultdict(lambda: {
        "renders": 0,
        "totalActualMs": 0.0,
        "reasons": {"context": 0, "props": 0, "state": 0, "didHooksChange": 0, "hooks": 0},
    })

    commit_summaries = []
    for idx in restore_commit_indices:
        commit = commits[idx]
        commit_summaries.append({"index": idx, **_summarize_commit(commit)})

        # durations
        for fid, dur in _as_pairs_fiber_durations(commit.get("fiberActualDurations")):
            try:
                dur_f = float(dur or 0)
            except Exception:
                dur_f = 0.0
            per_fiber[fid]["renders"] += 1
            per_fiber[fid]["totalActualMs"] += dur_f

        # reasons
        for entry in commit.get("changeDescriptions") or []:
            if not isinstance(entry, (list, tuple)) or len(entry) < 2:
                continue
            fid = entry[0]
            info = entry[1] or {}
            if info.get("context") is True:
                per_fiber[fid]["reasons"]["context"] += 1
            if info.get("didHooksChange") is True:
                per_fiber[fid]["reasons"]["didHooksChange"] += 1
            props = info.get("props")
            if isinstance(props, list) and len(props) > 0:
                per_fiber[fid]["reasons"]["props"] += 1
            if info.get("state") is not None:
                per_fiber[fid]["reasons"]["state"] += 1
            hooks = info.get("hooks")
            if isinstance(hooks, list) and len(hooks) > 0:
                per_fiber[fid]["reasons"]["hooks"] += 1

    # Build ranked list
    ranked = []
    for fid, s in per_fiber.items():
        meta = id_meta.get(fid, {})
        name = _fiber_name(fid, meta)
        ranked.append(
            {
                "fiberId": fid,
                "name": name,
                "renders": s["renders"],
                "totalActualMs": round(float(s["totalActualMs"]), 3),
                "avgActualMs": round(float(s["totalActualMs"]) / s["renders"], 3) if s["renders"] else 0.0,
                "reasonCounts": s["reasons"],
            }
        )

    ranked.sort(key=lambda x: x["totalActualMs"], reverse=True)

    # Session stats
    session_ms = (max(ts) - min(ts)) if ts else 0

    return {
        "input": profile_path,
        "version": data.get("version"),
        "commitCount": len(commits),
        "sessionDurationMs": round(session_ms, 3),
        "largestGapMs": round(max_gap_ms, 3),
        "gapBeforeCommitIndex": before_idx,
        "gapAfterCommitIndex": after_idx,
        "restoreTimestamp": restore_ts,
        "windowMs": window_ms,
        "restoreCommitCount": len(restore_commit_indices),
        "restoreCommitIndices": restore_commit_indices[:50],
        "restoreCommits": commit_summaries[:50],
        "topFibersAfterRestore": ranked[:30],
    }


def main() -> None:
    if len(sys.argv) < 2:
        print(
            json.dumps(
                {"error": "Usage: python profile_restore_analysis.py <profile.json> [window_ms] [out.json]"},
                ensure_ascii=False,
            )
        )
        raise SystemExit(1)

    profile_path = sys.argv[1]
    window_ms = int(sys.argv[2]) if len(sys.argv) > 2 else 2000
    out_path = sys.argv[3] if len(sys.argv) > 3 else None

    report = analyze(profile_path, window_ms=window_ms)
    text = json.dumps(report, ensure_ascii=False, indent=2)

    if out_path:
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(text)
    else:
        print(text)


if __name__ == "__main__":
    main()
