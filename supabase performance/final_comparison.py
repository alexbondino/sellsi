import json

def get_profiling_duration(profile_path):
    with open(profile_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    roots = data.get('dataForRoots', [])
    if isinstance(roots, dict):
        roots = list(roots.values())
    
    root = roots[0]
    commits = root.get('commitData', [])
    
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
print("COMPARACIÓN FINAL - ANTES vs DESPUÉS (FIX CORREGIDO)")
print("=" * 80)

before_duration, before_commits = get_profiling_duration('profiling-data.20-01-2026.12-09-03.json')
after_duration, after_commits = get_profiling_duration('profiling-data.ultimo4.json')

print(f"\n📊 ANTES DEL FIX:")
print(f"  Duración: {before_duration:.2f} segundos")
print(f"  Commits: {before_commits}")

print(f"\n📊 DESPUÉS DEL FIX (corregido):")
print(f"  Duración: {after_duration:.2f} segundos")
print(f"  Commits: {after_commits}")

print(f"\n⚖️  RATIO:")
print(f"  El segundo profiling duró {(after_duration/before_duration*100):.1f}% del primero")

# Load data
with open('analysis-result.json', 'r', encoding='utf-8') as f:
    before = json.load(f)

with open('analysis-result-ultimo4.json', 'r', encoding='utf-8') as f:
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

print(f"\n🎯 Componente 'Anonymous' (Principal problema):")
print(f"  ANTES:   {anon_before.get('renders', 0):>4} renders en {before_duration:.1f}s = {renders_per_sec_before:>6.1f} renders/segundo")
print(f"  DESPUÉS: {anon_after.get('renders', 0):>4} renders en {after_duration:.1f}s = {renders_per_sec_after:>6.1f} renders/segundo")

if renders_per_sec_after < renders_per_sec_before:
    improvement = ((renders_per_sec_before - renders_per_sec_after) / renders_per_sec_before * 100)
    print(f"\n  ✅ MEJORA: {improvement:.1f}% reducción en renders/segundo")
    print(f"     Tiempo ahorrado: {anon_before.get('total_ms', 0) - anon_after.get('total_ms', 0):.1f}ms en total")
else:
    regression = ((renders_per_sec_after - renders_per_sec_before) / renders_per_sec_before * 100)
    print(f"\n  ❌ REGRESIÓN: {regression:.1f}% AUMENTO en renders/segundo")

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
print(f"  ANTES:   {mu_before.get('renders', 0):>4} renders en {before_duration:.1f}s = {mu_per_sec_before:>6.2f} renders/segundo")
print(f"  DESPUÉS: {mu_after.get('renders', 0):>4} renders en {after_duration:.1f}s = {mu_per_sec_after:>6.2f} renders/segundo")

print(f"\n🔄 Componente 'dm' (Context Provider):")
print(f"  ANTES:   {dm_before.get('renders', 0):>4} renders en {before_duration:.1f}s = {dm_per_sec_before:>6.2f} renders/segundo")
print(f"  DESPUÉS: {dm_after.get('renders', 0):>4} renders en {after_duration:.1f}s = {dm_per_sec_after:>6.2f} renders/segundo")

# Total impact
print("\n" + "=" * 80)
print("IMPACTO TOTAL (Top 20)")
print("=" * 80)

total_impact_before = sum(item['impact'] for item in before['summary'][:20])
total_impact_after = sum(item['impact'] for item in after['summary'][:20])

# Normalize by time
impact_per_sec_before = total_impact_before / before_duration
impact_per_sec_after = total_impact_after / after_duration

print(f"\nImpacto total normalizado:")
print(f"  ANTES:   {impact_per_sec_before:>15,.0f} impacto/segundo")
print(f"  DESPUÉS: {impact_per_sec_after:>15,.0f} impacto/segundo")

if impact_per_sec_after < impact_per_sec_before:
    total_improvement = ((impact_per_sec_before - impact_per_sec_after) / impact_per_sec_before * 100)
    print(f"\n  ✅ MEJORA TOTAL: {total_improvement:.1f}% reducción")
else:
    total_regression = ((impact_per_sec_after - impact_per_sec_before) / impact_per_sec_before * 100)
    print(f"\n  ❌ REGRESIÓN TOTAL: {total_regression:.1f}% aumento")

print("\n" + "=" * 80)
print("DATOS BRUTOS DETALLADOS")
print("=" * 80)

print(f"\nTop 10 componentes - DESPUÉS del fix:")
for i, item in enumerate(after['summary'][:10], 1):
    print(f"  {i:2}. {item['name']:<30} {item['renders']:>4} renders, {item['total_ms']:>7.1f}ms, impacto: {item['impact']:>12,.0f}")

print("\n" + "=" * 80)
print("CONCLUSIÓN")
print("=" * 80)

if renders_per_sec_after < renders_per_sec_before and impact_per_sec_after < impact_per_sec_before:
    print(f"""
✅ EL FIX FUNCIONÓ CORRECTAMENTE
   
   - Anonymous: {improvement:.1f}% menos renders/segundo
   - Impacto total: {total_improvement:.1f}% reducción
   
   El componente ahora re-renderiza menos frecuentemente.
   La aplicación debería sentirse más fluida.
""")
elif renders_per_sec_after >= renders_per_sec_before:
    print(f"""
❌ EL FIX NO FUNCIONÓ
   
   Los renders por segundo aumentaron o se mantuvieron igual.
   
   Posibles problemas:
   1. Dependencias de useCallback están causando recreaciones
   2. React.memo no está previniendo re-renders
   3. Hay otra causa raíz diferente
   4. Las interacciones grabadas fueron diferentes
""")
else:
    print(f"""
⚠️  RESULTADOS MIXTOS
   
   Algunos componentes mejoraron, otros empeoraron.
   Requiere análisis más profundo.
""")

print("=" * 80)
