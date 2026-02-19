#!/usr/bin/env python3
"""Dump metadata for fibers listed in a restore report section.

Usage:
    python dump_topfiber_meta.py <profile.json> <restore_report.json> <out.json> [top_n] [section]

Examples:
    python dump_topfiber_meta.py profile.json report.json out.json 30 topFibersAfterRestore
    python dump_topfiber_meta.py profile.json report.json out.json 30 topFibersByStateChanges

This is meant to run on React DevTools Profiler export JSON (version 5).
"""

from __future__ import annotations

import json
import sys


def main() -> None:
    if len(sys.argv) < 4:
        print(
            json.dumps(
                {
                    "error": "Usage: python dump_topfiber_meta.py <profile.json> <restore_report.json> <out.json> [top_n]"
                },
                ensure_ascii=False,
            )
        )
        raise SystemExit(1)

    profile_path = sys.argv[1]
    report_path = sys.argv[2]
    out_path = sys.argv[3]
    top_n = int(sys.argv[4]) if len(sys.argv) > 4 else 30
    section = sys.argv[5] if len(sys.argv) > 5 else "topFibersAfterRestore"

    with open(profile_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    roots = data.get("dataForRoots") or []
    if isinstance(roots, dict):
        roots = list(roots.values())
    if not roots:
        raise SystemExit("No dataForRoots")

    root = roots[0]

    id_meta: dict[int, dict] = {}
    for snap in root.get("snapshots") or []:
        if isinstance(snap, (list, tuple)) and len(snap) >= 2:
            id_meta[int(snap[0])] = snap[1] or {}

    with open(report_path, "r", encoding="utf-8") as f:
        rep = json.load(f)

    fibers = rep.get(section) or []
    # Section entries can be {fiberId, ...} or {fiberId, count, ...}
    fids = [int(x.get("fiberId")) for x in fibers[:top_n] if isinstance(x, dict) and x.get("fiberId") is not None]

    meta_out = []
    for fid in fids:
        m = id_meta.get(fid, {})
        meta_out.append(
            {
                "fiberId": fid,
                "displayName": m.get("displayName"),
                "key": m.get("key"),
                "hocDisplayNames": m.get("hocDisplayNames"),
                "environmentName": m.get("environmentName"),
                "compiledWithForget": m.get("compiledWithForget"),
                # Keep a small subset of fields; full meta can be huge.
                "props": m.get("props"),
            }
        )

    out = {
        "input": profile_path,
        "top_n": top_n,
        "section": section,
        "fibers": meta_out,
    }

    with open(out_path, "w", encoding="utf-8") as f:
        f.write(json.dumps(out, ensure_ascii=False, indent=2))

    print(out_path)


if __name__ == "__main__":
    main()
