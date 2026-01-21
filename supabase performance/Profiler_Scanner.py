import json
import sys
from collections import defaultdict


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Uso: python Profiler_Scanner.py profile.json [top_n] [output.json]"}))
        sys.exit(1)

    profile_path = sys.argv[1]
    top_n = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    out_path = sys.argv[3] if len(sys.argv) > 3 else None

    with open(profile_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    roots = data.get('dataForRoots', [])
    # normalize if dict
    if isinstance(roots, dict):
        roots = list(roots.values())

    stats = defaultdict(lambda: {"renders": 0, "total_time": 0.0})

    for root in roots:
        # build id->meta from snapshots
        id_meta = {}
        snapshots = root.get('snapshots') or []
        for snap in snapshots:
            if isinstance(snap, (list, tuple)) and len(snap) >= 2:
                idx = snap[0]
                meta = snap[1] or {}
                id_meta[idx] = meta

        for commit in root.get('commitData', []) or []:
            fas = commit.get('fiberActualDurations') or []
            # fas can be list of [id, duration] or dict
            if isinstance(fas, dict):
                items = fas.items()
            else:
                items = fas

            for pair in items:
                if isinstance(pair, (list, tuple)):
                    if len(pair) < 2:
                        continue
                    fid, dur = pair[0], pair[1]
                else:
                    # dict item
                    fid, dur = pair

                meta = id_meta.get(fid, {})
                name = meta.get('displayName') or meta.get('key') or meta.get('hocDisplayNames') or f'Fiber#{fid}'

                try:
                    dur_f = float(dur)
                except Exception:
                    dur_f = 0.0

                stats[name]['renders'] += 1
                stats[name]['total_time'] += dur_f

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
    summary = {
        'input': profile_path,
        'top_n': top_n,
        'summary': results[:top_n],
    }

    out_text = json.dumps(summary, ensure_ascii=False, indent=2)
    if out_path:
        with open(out_path, 'w', encoding='utf-8') as outf:
            outf.write(out_text)
    else:
        print(out_text)


if __name__ == '__main__':
    main()
