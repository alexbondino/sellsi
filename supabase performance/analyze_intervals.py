import json

# Cargar el profiling data
with open('profiling-data.ultimo4.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

roots = data.get('dataForRoots', [])
if isinstance(roots, dict):
    roots = list(roots.values())

root = roots[0]
commits = root.get('commitData', [])

# Obtener timestamps para calcular intervalos
timestamps = [c.get('timestamp', 0) for c in commits]

print("=" * 80)
print("ANÁLISIS DE INTERVALOS ENTRE COMMITS")
print("=" * 80)

print(f"\nTotal commits: {len(commits)}")
print(f"Timestamps: {timestamps[:5]}...{timestamps[-3:]}")

# Calcular intervalos entre commits
if len(timestamps) > 1:
    intervals = []
    for i in range(1, len(timestamps)):
        interval = timestamps[i] - timestamps[i-1]
        intervals.append(interval)
    
    print(f"\nIntervalos entre commits (ms):")
    for i, interval in enumerate(intervals, 1):
        print(f"  Commit {i} -> {i+1}: {interval:.1f}ms")
    
    avg_interval = sum(intervals) / len(intervals)
    print(f"\nPromedio: {avg_interval:.1f}ms")
    print(f"Esto equivale a ~{1000/avg_interval:.1f} commits por segundo")
    
    # Si los intervalos son consistentes, hay un timer
    if len(set(int(i) for i in intervals)) <= 3:
        print(f"\n❌ PATRÓN DETECTADO: Los intervalos son MUY consistentes")
        print(f"   Esto indica un setInterval o requestAnimationFrame activo")
        print(f"   Frecuencia: cada ~{avg_interval:.0f}ms")
    else:
        print(f"\n✅ Los intervalos varían, puede ser interacción del usuario o eventos")

print("\n" + "=" * 80)
print("CONCLUSIÓN")
print("=" * 80)

if avg_interval < 500:
    print(f"""
❌ HAY UN TIMER/ANIMATION ACTIVO
   
   Intervalos de ~{avg_interval:.0f}ms entre commits indican que algo está
   actualizando el estado constantemente.
   
   Posibles culpables:
   1. requestAnimationFrame loop activo
   2. setInterval < 500ms
   3. CSS animation/transition que React está detectando
   4. React DevTools Profiler causando el problema
   
   Para debug:
   - Busca requestAnimationFrame en el código
   - Busca setInterval con valores pequeños
   - Verifica si hay animaciones CSS activas
   - Intenta desactivar React DevTools
""")
else:
    print(f"\nIntervalos normales de {avg_interval:.0f}ms")
