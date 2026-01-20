import json

with open('profiling-data.ultimo4.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

roots = data.get('dataForRoots', [])
if isinstance(roots, dict):
    roots = list(roots.values())

root = roots[0]
commits = root.get('commitData', [])

print("=" * 80)
print(f"ANÁLISIS SIMPLE: ¿POR QUÉ HAY RENDERS EN IDLE?")
print(f"Total commits: {len(commits)}")
print("=" * 80)

# Count renders per commit
all_renders = []
for idx, commit in enumerate(commits, 1):
    duration = commit.get('duration', 0)
    fibers = commit.get('fiberActualDurations', [])
    render_count = len(fibers) // 2
    all_renders.append(render_count)
    
    print(f"\nCommit #{idx}:")
    print(f"  Duración: {duration:.2f}ms")
    print(f"  Componentes renderizados: {render_count}")
    
    if render_count > 0:
        print(f"  ⚠️  Hubo {render_count} renders en este commit")

# Get timestamps
timestamps = [c.get('timestamp', 0) for c in commits]
if len(timestamps) > 1:
    session_duration = (max(timestamps) - min(timestamps)) / 1000
else:
    session_duration = 0

print("\n" + "=" * 80)
print("RESUMEN FINAL")
print("=" * 80)
print(f"\nDuración de la sesión: {session_duration:.2f} segundos")
print(f"Total de commits: {len(commits)}")
print(f"Total de renders: {sum(all_renders)}")
print(f"Renders por segundo: {sum(all_renders)/session_duration:.1f}" if session_duration > 0 else "N/A")

print(f"\nDistribución de renders por commit:")
for i, count in enumerate(all_renders, 1):
    bar = '█' * (count // 10 if count < 100 else count // 20)
    print(f"  Commit {i}: {count:>3} renders {bar}")

print("\n" + "=" * 80)
print("DIAGNÓSTICO")
print("=" * 80)

if sum(all_renders) == 0:
    print("\n✅ PERFECTO: No hubo renders en idle")
elif max(all_renders) < 10:
    print(f"\n✅ BIEN: Pocos renders ({max(all_renders)} máx por commit)")
    print("   Probablemente animaciones CSS o transiciones de Material-UI")
elif max(all_renders) < 50:
    print(f"\n⚠️  MEJORABLE: {max(all_renders)} renders en un commit es moderado")
    print("   Puede ser normal si hay animaciones activas")
    print("   Pero en idle puro debería ser 0")
else:
    print(f"\n❌ PROBLEMA GRAVE: {max(all_renders)} renders en un solo commit")
    print("   En IDLE esto es inaceptable")
    print("\n   Causas más comunes:")
    print("   1. Context que se actualiza constantemente")
    print("   2. Componente padre sin memoización adecuada")
    print("   3. Props que son nuevas referencias cada vez")
    print("   4. Animaciones CSS que React interpreta como cambios")
    print("   5. Algún useEffect en loop infinito")

print(f"\nTotal renders en {session_duration:.2f}s de idle: {sum(all_renders)}")
print(f"Esto significa ~{sum(all_renders)/session_duration:.0f} renders/segundo en idle")
print("\nLo ideal en idle: 0 renders/segundo")
