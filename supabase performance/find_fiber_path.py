#!/usr/bin/env python3
"""Find path from root fiber to a target fiberId in a React DevTools profiler export.

Outputs the chain of displayNames and ids.

Usage:
  python find_fiber_path.py <profile.json> <target_fiber_id> [max_depth]
"""

from __future__ import annotations

import json
import sys
from collections import deque


def load(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def main() -> None:
    if len(sys.argv) < 3:
        print("Usage: python find_fiber_path.py <profile.json> <target_fiber_id> [max_depth]")
        raise SystemExit(1)

    path = sys.argv[1]
    target = int(sys.argv[2])
    max_depth = int(sys.argv[3]) if len(sys.argv) > 3 else 200

    data = load(path)
    roots = data.get("dataForRoots") or []
    if isinstance(roots, dict):
        roots = list(roots.values())
    if not roots:
        raise SystemExit("No dataForRoots")

    root = roots[0]
    root_id = root.get("rootID")
    if root_id is None:
        # Fallback: try to infer from first snapshot id
        snaps = root.get("snapshots") or []
        if snaps:
            root_id = snaps[0][0]
    root_id = int(root_id)

    # Build map id -> meta (children, displayName)
    id_meta: dict[int, dict] = {}
    children_map: dict[int, list[int]] = {}
    for snap in root.get("snapshots") or []:
        if isinstance(snap, (list, tuple)) and len(snap) >= 2:
            fid = int(snap[0])
            meta = snap[1] or {}
            id_meta[fid] = meta
            children = meta.get("children") or []
            if isinstance(children, list):
                children_map[fid] = [int(c) for c in children]

    # BFS to find parent pointers
    parent: dict[int, int | None] = {root_id: None}
    q = deque([root_id])

    while q:
        cur = q.popleft()
        if cur == target:
            break
        for ch in children_map.get(cur, []):
            if ch in parent:
                continue
            parent[ch] = cur
            if len(parent) > 2_000_000:
                break
            q.append(ch)

    if target not in parent:
        print(json.dumps({"error": "target not reachable from root", "rootId": root_id, "target": target}, ensure_ascii=False, indent=2))
        return

    # Reconstruct path
    chain = []
    cur = target
    depth = 0
    while cur is not None and depth < max_depth:
        meta = id_meta.get(cur, {})
        chain.append({
            "id": cur,
            "displayName": meta.get("displayName") or f"Fiber#{cur}",
            "hocDisplayNames": meta.get("hocDisplayNames"),
        })
        cur = parent.get(cur)
        depth += 1

    chain.reverse()
    print(json.dumps({"rootId": root_id, "target": target, "depth": len(chain), "path": chain}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
