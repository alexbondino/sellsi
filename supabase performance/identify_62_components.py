import json
from collections import Counter

with open('profiling-data.ultimo4.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

roots = data.get('dataForRoots', [])
if isinstance(roots, dict):
    roots = list(roots.values())

root = roots[0]
commits = root.get('commitData', [])
snapshots = root.get('snapshots', [])

# Build fiber ID to name mapping
fiber_names = {}
if snapshots and isinstance(snapshots[0], list):
    for item in snapshots:
        if isinstance(item, list) and len(item) >= 2:
            fiber_names[item[0]] = item[1]

print("=" * 80)
print("¿QUÉ SON ESOS 62 COMPONENTES QUE SE RENDERIZAN?")
print("=" * 80)

# Analyze first commit to see which components
if len(commits) > 0:
    commit = commits[0]
    fiber_actual_durations = commit.get('fiberActualDurations', [])
    
    component_names = []
    for i in range(0, len(fiber_actual_durations), 2):
        fiber_id = fiber_actual_durations[i]
        name = fiber_names.get(fiber_id, f"Unknown")
        component_names.append(name)
    
    # Count by component type
    counter = Counter(component_names)
    
    print(f"\nComponentes en el primer commit ({len(component_names)} total):")
    for name, count in counter.most_common(20):
        print(f"  {name}: {count}")
    
    print(f"\n\nLista completa de componentes:")
    for i, name in enumerate(component_names, 1):
        print(f"  {i:2}. {name}")

print("\n" + "=" * 80)
print("ANÁLISIS")
print("=" * 80)

if 'Anonymous' in counter:
    print(f"\nAnonymous components: {counter['Anonymous']}")
    print("Estos son probablemente wrappers de Material-UI (ForwardRef)")

# Check if all commits have the EXACT same renders
all_same = True
first_commit_fibers = set()
if len(commits) > 0:
    for i in range(0, len(commits[0].get('fiberActualDurations', [])), 2):
        first_commit_fibers.add(commits[0]['fiberActualDurations'][i])

for commit_idx, commit in enumerate(commits[1:], 2):
    fibers = set()
    for i in range(0, len(commit.get('fiberActualDurations', [])), 2):
        fibers.add(commit['fiberActualDurations'][i])
    
    if fibers != first_commit_fibers:
        all_same = False
        print(f"\nCommit #{commit_idx} tiene diferentes componentes")
        break

if all_same and len(commits) > 1:
    print(f"\n⚠️  TODOS LOS {len(commits)} COMMITS RENDERIZARON EXACTAMENTE LOS MISMOS COMPONENTES")
    print("   Esto es MUY sospechoso y sugiere:")
    print("   1. Un Context Provider que cambia cada ~360ms")
    print("   2. Un componente padre que se re-renderiza periódicamente")
    print("   3. El React Profiler causando el problema")
