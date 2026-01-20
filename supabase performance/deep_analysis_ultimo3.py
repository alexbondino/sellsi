import json

with open('profiling-data.ultimo3.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

roots = data.get('dataForRoots', [])
if isinstance(roots, dict):
    roots = list(roots.values())

root = roots[0]
commits = root.get('commitData', [])
snapshots = root.get('snapshots', [])

# Build fiber ID to name mapping
fiber_names = {}
if snapshots and len(snapshots) > 0:
    if isinstance(snapshots[0], dict):
        for snapshot in snapshots:
            fiber_map = snapshot.get('fiberToDisplayNameMap', {})
            fiber_names.update(fiber_map)
    elif isinstance(snapshots[0], list):
        # snapshots is list of [nodeId, displayName] pairs
        for item in snapshots:
            if isinstance(item, list) and len(item) >= 2:
                fiber_names[item[0]] = item[1]

print("=" * 80)
print(f"ANÁLISIS PROFUNDO - {len(commits)} commits en la sesión")
print("=" * 80)

# Analyze each commit
for idx, commit in enumerate(commits, 1):
    duration = commit.get('duration', 0)
    fiber_actual_durations = commit.get('fiberActualDurations', [])
    fiber_self_durations = commit.get('fiberSelfDurations', [])
    
    # Count renders per component
    component_renders = {}
    for i in range(0, len(fiber_actual_durations), 2):
        fiber_id = fiber_actual_durations[i]
        actual_dur = fiber_actual_durations[i + 1]
        
        name = fiber_names.get(fiber_id, f"Unknown-{fiber_id}")
        if name not in component_renders:
            component_renders[name] = 0
        component_renders[name] += 1
    
    # Sort by count
    sorted_components = sorted(component_renders.items(), key=lambda x: x[1], reverse=True)
    
    print(f"\nCommit #{idx} - Duración: {duration:.1f}ms")
    print(f"  Total de componentes renderizados: {sum(component_renders.values())}")
    
    # Show top 5
    anon_count = component_renders.get('Anonymous', 0)
    if anon_count > 0:
        print(f"  ⚠️  Anonymous: {anon_count} renders en este commit")
    
    if anon_count > 20:
        print(f"      ❌ MUY ALTO - algo está causando renders en cascada")
        # Show what else rendered heavily
        print(f"      Top 5 componentes en este commit:")
        for name, count in sorted_components[:5]:
            print(f"        - {name}: {count}")

print("\n" + "=" * 80)
print("RESUMEN")
print("=" * 80)

# Total Anonymous across all commits
total_anon = 0
commits_with_anon = 0
max_anon_in_commit = 0

for commit in commits:
    fiber_actual_durations = commit.get('fiberActualDurations', [])
    anon_count = 0
    
    for i in range(0, len(fiber_actual_durations), 2):
        fiber_id = fiber_actual_durations[i]
        name = fiber_names.get(fiber_id, f"Unknown-{fiber_id}")
        if name == 'Anonymous':
            anon_count += 1
    
    total_anon += anon_count
    if anon_count > 0:
        commits_with_anon += 1
    max_anon_in_commit = max(max_anon_in_commit, anon_count)

print(f"\nTotal Anonymous renders: {total_anon}")
print(f"Commits con Anonymous: {commits_with_anon}/{len(commits)}")
print(f"Promedio por commit: {total_anon/len(commits):.1f}")
print(f"Máximo en un commit: {max_anon_in_commit}")

if max_anon_in_commit > 30:
    print(f"\n❌ PROBLEMA: Hay commits con {max_anon_in_commit} renders de Anonymous")
    print("   Esto indica que algo sigue causando renders en cascada.")
    print("   Posibles causas:")
    print("   1. Context providers que cambian frecuentemente")
    print("   2. Props que aún no están memoizadas")
    print("   3. Estado que cambia y dispara múltiples componentes")
elif max_anon_in_commit > 15:
    print(f"\n⚠️  MEJORABLE: {max_anon_in_commit} renders por commit es alto pero tolerable")
else:
    print(f"\n✅ BIEN: {max_anon_in_commit} renders por commit es aceptable")
