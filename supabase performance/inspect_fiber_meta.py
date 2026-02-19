#!/usr/bin/env python3
"""Inspect snapshot metadata for a given fiber id in a React DevTools profiler export."""

from __future__ import annotations

import json
import sys


def main() -> None:
    if len(sys.argv) < 3:
        print("Usage: python inspect_fiber_meta.py <profile.json> <fiber_id>")
        raise SystemExit(1)

    path = sys.argv[1]
    fid = int(sys.argv[2])

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    roots = data.get("dataForRoots") or []
    if isinstance(roots, dict):
        roots = list(roots.values())
    root = roots[0]

    meta = None
    for snap in root.get("snapshots") or []:
        if isinstance(snap, (list, tuple)) and len(snap) >= 2 and int(snap[0]) == fid:
            meta = snap[1] or {}
            break

    if meta is None:
        print(json.dumps({"error": "fiber not found", "fiberId": fid}, ensure_ascii=False, indent=2))
        return

    out = {
        "fiberId": fid,
        "metaKeys": sorted(list(meta.keys())),
        "meta": meta,
    }
    print(json.dumps(out, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
