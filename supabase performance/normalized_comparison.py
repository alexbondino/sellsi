import json

def get_profiling_duration(profile_path):
    with open(profile_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    roots = data.get('dataForRoots', [])
    if isinstance(roots, dict):
        roots = list(roots.values())
    
    root = roots[0]
    commits = root.get('commitData', [])
    
    # Get timestamps from first and last commit
    timestamps = []
    for commit in commits:
        ts = commit.get('timestamp')
        if ts:
            timestamps.append(ts)
    
    if len(timestamps) < 2:
        return 0, len(commits)
    
    duration_ms = max(timestamps) - min(timestamps)
    duration_sec = duration_ms / 1000
    
    return duration_sec, len(commits)

print("=" * 80)
print("ANÁLISIS DE DURACIÓN DE PROFILING")
print("=" * 80)

before_duration, before_commits = get_profiling_duration('profiling-data.20-01-2026.12-09-03.json')
after_duration, after_commits = get_profiling_duration('profiling-data.ultimo.json')

print(f"\n📊 ANTES DEL FIX (profiling-data.20-01-2026.12-09-03.json):")
print(f"  Duración: {before_duration:.2f} segundos")
print(f"  Commits: {before_commits}")

print(f"\n📊 DESPUÉS DEL FIX (profiling-data.ultimo.json):")
print(f"  Duración: {after_duration:.2f} segundos")
print(f"  Commits: {after_commits}")

print(f"\n⚖️  RATIO:")
print(f"  El segundo profiling duró {(after_duration/before_duration*100):.1f}% del primero")

# Now let's recalculate with normalized metrics
with open('analysis-result.json', 'r', encoding='utf-8') as f:
    before = json.load(f)

with open('analysis-result-ultimo.json', 'r', encoding='utf-8') as f:
    after = json.load(f)

before_data = {item['name']: item for item in before['summary']}
after_data = {item['name']: item for item in after['summary']}

print("\n" + "=" * 80)
print("COMPARACIÓN NORMALIZADA (Renders por segundo)")
print("=" * 80)

anon_before = before_data.get('Anonymous', {})
anon_after = after_data.get('Anonymous', {})

renders_per_sec_before = anon_before.get('renders', 0) / before_duration if before_duration > 0 else 0
renders_per_sec_after = anon_after.get('renders', 0) / after_duration if after_duration > 0 else 0

print(f"\n🎯 Componente 'Anonymous':")
print(f"  ANTES:  {anon_before.get('renders', 0)} renders en {before_duration:.1f}s = {renders_per_sec_before:.1f} renders/segundo")
print(f"  DESPUÉS: {anon_after.get('renders', 0)} renders en {after_duration:.1f}s = {renders_per_sec_after:.1f} renders/segundo")

if renders_per_sec_after < renders_per_sec_before:
    improvement = ((renders_per_sec_before - renders_per_sec_after) / renders_per_sec_before * 100)
    print(f"\n  ✅ MEJORA REAL: {improvement:.1f}% reducción en renders/segundo")
else:
    regression = ((renders_per_sec_after - renders_per_sec_before) / renders_per_sec_before * 100)
    print(f"\n  ❌ REGRESIÓN: {regression:.1f}% AUMENTO en renders/segundo")
    print(f"     El fix NO funcionó o empeoró las cosas.")

# Context components
mu_before = before_data.get('mu', {})
mu_after = after_data.get('mu', {})
dm_before = before_data.get('dm', {})
dm_after = after_data.get('dm', {})

mu_per_sec_before = mu_before.get('renders', 0) / before_duration if before_duration > 0 else 0
mu_per_sec_after = mu_after.get('renders', 0) / after_duration if after_duration > 0 else 0

dm_per_sec_before = dm_before.get('renders', 0) / before_duration if before_duration > 0 else 0
dm_per_sec_after = dm_after.get('renders', 0) / after_duration if after_duration > 0 else 0

print(f"\n🔄 Componente 'mu' (Context):")
print(f"  ANTES:  {mu_before.get('renders', 0)} renders en {before_duration:.1f}s = {mu_per_sec_before:.2f} renders/segundo")
print(f"  DESPUÉS: {mu_after.get('renders', 0)} renders en {after_duration:.1f}s = {mu_per_sec_after:.2f} renders/segundo")

print(f"\n🔄 Componente 'dm' (Context Provider):")
print(f"  ANTES:  {dm_before.get('renders', 0)} renders en {before_duration:.1f}s = {dm_per_sec_before:.2f} renders/segundo")
print(f"  DESPUÉS: {dm_after.get('renders', 0)} renders en {after_duration:.1f}s = {dm_per_sec_after:.2f} renders/segundo")

print("\n" + "=" * 80)
print("CONCLUSIÓN REAL")
print("=" * 80)

if renders_per_sec_after < renders_per_sec_before:
    print(f"""
✅ El fix SÍ funcionó. 
   Normalizado por tiempo, hay {improvement:.1f}% menos renders por segundo.
""")
else:
    print(f"""
❌ El fix NO funcionó o incluso empeoró las cosas.
   Hay {regression:.1f}% MÁS renders por segundo que antes.
   
   Posibles causas:
   1. Los useCallback tienen las dependencias incorrectas
   2. React.memo no está funcionando correctamente
   3. Hay otro problema causando los re-renders
   4. El profiling capturó diferentes interacciones
""")

print("=" * 80)
