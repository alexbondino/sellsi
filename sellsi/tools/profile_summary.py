#!/usr/bin/env python3
import json
import sys
from collections import defaultdict, Counter

def load_events(path):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Chrome trace format
    events = data.get('traceEvents') or data.get('events') or data
    # If top-level is dict with 'traceEvents' inside, handle above
    if isinstance(events, dict):
        # try common keys
        for k in ('traceEvents','events'):
            if k in data:
                events = data[k]
                break
    return events

def dur_ms(e):
    # duration may be in 'dur' (microseconds) or 'duration' (ms)
    d = e.get('dur') or e.get('duration') or 0
    # If dur looks large (>1e6) assume microseconds
    if isinstance(d, (int, float)):
        if d > 1e6:
            return d/1000.0
        # many Chrome traces give microseconds; common threshold
        if d > 10000:
            return d/1000.0
        return float(d)
    return 0.0

def name_of(e):
    return e.get('name') or e.get('cat') or e.get('ph') or '<unknown>'

def summarize(path, topN=30, long_task_threshold=50.0):
    events = load_events(path)
    if not isinstance(events, list):
        print('No event list detected in the profile file.'); return 1

    complete = [e for e in events if (('dur' in e) or ('duration' in e))]
    # compute durations
    durations = [(dur_ms(e), name_of(e), e) for e in complete]
    durations.sort(reverse=True, key=lambda x: x[0])

    print('PROFILE SUMMARY for', path)
    print('Total events:', len(events))
    print('Events with duration:', len(complete))
    print('\nTop %d longest events (duration ms, name):' % topN)
    for d, name, e in durations[:topN]:
        ts = e.get('ts') or e.get('startTime') or e.get('ts_us') or ''
        print(' - %.1f ms — %s (ph=%s, ts=%s)' % (d, name, e.get('ph'), ts))

    # aggregate time by name (summing durations)
    agg = defaultdict(float)
    for d, name, e in durations:
        agg[name] += d
    agg_list = sorted(agg.items(), key=lambda x: x[1], reverse=True)
    print('\nTop 20 aggregated by name (total ms):')
    for name, total in agg_list[:20]:
        print(' - %.1f ms — %s' % (total, name))

    # list long tasks above threshold
    long_tasks = [ (d,name,e) for (d,name,e) in durations if d >= long_task_threshold ]
    print('\nLong tasks (> %.1f ms): %d' % (long_task_threshold, len(long_tasks)))
    for d,name,e in long_tasks[:200]:
        ts = e.get('ts') or e.get('startTime') or ''
        cat = e.get('cat') or ''
        print(' * %.1f ms — %s (cat=%s, ph=%s, ts=%s)' % (d, name, cat, e.get('ph'), ts))

    # show stack glimpses if present
    has_stack = any('stack' in e or 'args' in e and isinstance(e['args'], dict) and 'stack' in e['args'] for e in long_tasks)
    if has_stack:
        print('\nSome long tasks include stack or args.stack; printing up to 5 stacks:')
        shown = 0
        for d,name,e in long_tasks:
            if shown>=5: break
            stack = e.get('stack') or (e.get('args') or {}).get('stack')
            if stack:
                print('\n--- Stack for %.1f ms — %s ---' % (d,name))
                print(stack)
                shown += 1

    print('\nDone.')
    return 0

if __name__ == '__main__':
    if len(sys.argv)<2:
        print('Usage: profile_summary.py <profile.json> [topN] [longThresholdMs]')
        sys.exit(2)
    path = sys.argv[1]
    topN = int(sys.argv[2]) if len(sys.argv)>2 else 30
    threshold = float(sys.argv[3]) if len(sys.argv)>3 else 50.0
    sys.exit(summarize(path, topN, threshold))
