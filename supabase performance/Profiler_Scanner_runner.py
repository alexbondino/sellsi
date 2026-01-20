#!/usr/bin/env python3
import json
import sys
from collections import defaultdict

def load_profile(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def extract_stats(data):
    stats = defaultdict(lambda: {"renders": 0, "total_time": 0.0})

    roots = data.get('dataForRoots') or []
    # dataForRoots may be a dict in some formats
    if isinstance(roots, dict):
        roots = list(roots.values())

    for root in roots:
        # build id->meta mapping from snapshots if present
        id_meta = {}
        for snap in root.get('snapshots', []):
            if isinstance(snap, list) and len(snap) >= 2:
                idx, meta = snap[0], snap[1]
                id_meta[idx] = meta

        for commit in root.get('commitData', []):
            fas = commit.get('fiberActualDurations') or []
            # fas might be dict-like or list of [id, duration]
            if isinstance(fas, dict):
                items = fas.items()
            else:
                items = fas

            for pair in items:
                # normalize pair to (id, duration)
                if isinstance(pair, list) or isinstance(pair, tuple):
                    if len(pair) >= 2:
                        fid = pair[0]
                        dur = pair[1] or 0.0
                    else:
                        continue
                else:
                    # dict item (k,v)
                    fid, dur = pair

                meta = id_meta.get(fid, {})
                name = meta.get('displayName') or meta.get('key') or meta.get('hocDisplayNames') or f'Fiber#{fid}'

                try:
                    dur_f = float(dur)
                except Exception:
                    dur_f = 0.0

                stats[name]['renders'] += 1
                stats[name]['total_time'] += dur_f

    return stats

def summarize(stats, top_n=20):
    results = []
    for name, s in stats.items():
        renders = s['renders']
        total = s['total_time']
        avg = total / renders if renders else 0.0
        impact = total * renders
        results.append({
            'name': name,
            'renders': renders,
            'total_ms': round(total, 3),
            'avg_ms': round(avg, 3),
            'impact': round(impact, 3),
        })

    results.sort(key=lambda x: x['impact'], reverse=True)
    return results[:top_n]

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Usage: runner.py profile.json [top_n]'}))
        sys.exit(1)

    path = sys.argv[1]
    top_n = int(sys.argv[2]) if len(sys.argv) > 2 else 20

    data = load_profile(path)
    stats = extract_stats(data)
    summary = summarize(stats, top_n=top_n)

    out = {
        'input': path,
        'top_n': top_n,
        'summary': summary,
    }

    print(json.dumps(out, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
