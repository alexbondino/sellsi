import json
import sys
from collections import defaultdict, Counter

def analyze_profiling_deep(profile_path):
    with open(profile_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    roots = data.get('dataForRoots', [])
    if isinstance(roots, dict):
        roots = list(roots.values())
    
    root = roots[0]
    
    # Build fiber ID to metadata mapping from snapshots
    print("=" * 80)
    print("ANÁLISIS PROFUNDO DE PROFILING DATA")
    print("=" * 80)
    
    id_meta = {}
    snapshots = root.get('snapshots', [])
    
    print(f"\n📊 ESTADÍSTICAS BÁSICAS:")
    print(f"  - Total de commits: {len(root.get('commitData', []))}")
    print(f"  - Total de snapshots: {len(snapshots)}")
    print(f"  - Root displayName: {root.get('displayName', 'N/A')}")
    print(f"  - Root ID: {root.get('rootID', 'N/A')}")
    
    # Parse snapshots to build metadata map
    for snap in snapshots:
        if isinstance(snap, (list, tuple)) and len(snap) >= 2:
            idx = snap[0]
            meta = snap[1] or {}
            id_meta[idx] = meta
    
    print(f"  - Fibers únicos rastreados: {len(id_meta)}")
    
    # Analyze component types
    component_types = Counter()
    component_by_name = defaultdict(list)
    
    for fid, meta in id_meta.items():
        name = meta.get('displayName') or meta.get('key') or str(fid)
        component_types[name] += 1
        component_by_name[name].append(fid)
    
    print(f"\n🔍 COMPONENTES ÚNICOS DETECTADOS:")
    print(f"  - Tipos de componentes diferentes: {len(component_types)}")
    
    # Find the "Anonymous" components
    anonymous_fibers = component_by_name.get('Anonymous', [])
    print(f"\n⚠️  COMPONENTES 'Anonymous': {len(anonymous_fibers)}")
    for fid in anonymous_fibers[:5]:  # Show first 5
        meta = id_meta.get(fid, {})
        print(f"  - Fiber #{fid}: {meta}")
    
    # Analyze renders per commit
    print(f"\n📈 ANÁLISIS DE COMMITS:")
    
    commit_stats = []
    for i, commit in enumerate(root.get('commitData', [])[:10]):  # First 10 commits
        fas = commit.get('fiberActualDurations', [])
        changes = commit.get('changeDescriptions', None)
        priority = commit.get('priorityLevel', None)
        timestamp = commit.get('timestamp', None)
        
        if isinstance(fas, dict):
            items = list(fas.items())
        else:
            items = fas
        
        fiber_count = len(items)
        total_duration = 0.0
        
        components_in_commit = []
        for pair in items:
            if isinstance(pair, (list, tuple)) and len(pair) >= 2:
                fid, dur = pair[0], pair[1]
            else:
                fid, dur = pair
            
            try:
                dur_f = float(dur)
                total_duration += dur_f
            except:
                dur_f = 0.0
            
            meta = id_meta.get(fid, {})
            name = meta.get('displayName') or meta.get('key') or f'Fiber#{fid}'
            components_in_commit.append((name, dur_f))
        
        print(f"\n  Commit #{i}:")
        print(f"    - Fibers renderizados: {fiber_count}")
        print(f"    - Duración total: {total_duration:.2f}ms")
        print(f"    - Prioridad: {priority}")
        
        # Show top 3 slowest in this commit
        components_in_commit.sort(key=lambda x: x[1], reverse=True)
        print(f"    - Top 3 más lentos:")
        for name, dur in components_in_commit[:3]:
            print(f"      • {name}: {dur:.2f}ms")
        
        if changes:
            print(f"    - Cambios detectados: {changes}")
    
    # Analyze cascading renders
    print(f"\n\n🌊 ANÁLISIS DE CASCADAS DE RE-RENDERS:")
    
    # Track which components render together
    co_render_matrix = defaultdict(lambda: defaultdict(int))
    
    for commit in root.get('commitData', []):
        fas = commit.get('fiberActualDurations', [])
        if isinstance(fas, dict):
            items = list(fas.items())
        else:
            items = fas
        
        rendered_in_commit = set()
        for pair in items:
            if isinstance(pair, (list, tuple)) and len(pair) >= 2:
                fid = pair[0]
            else:
                fid = pair[0] if isinstance(pair, tuple) else pair
            
            meta = id_meta.get(fid, {})
            name = meta.get('displayName') or meta.get('key') or f'Fiber#{fid}'
            rendered_in_commit.add(name)
        
        # Track co-occurrences
        rendered_list = list(rendered_in_commit)
        for i, name1 in enumerate(rendered_list):
            for name2 in rendered_list[i+1:]:
                co_render_matrix[name1][name2] += 1
                co_render_matrix[name2][name1] += 1
    
    # Find components that always render together
    print("  Componentes que SIEMPRE renderizan juntos (>90% del tiempo):")
    for comp1, co_renders in sorted(co_render_matrix.items(), 
                                     key=lambda x: sum(x[1].values()), 
                                     reverse=True)[:10]:
        total_renders_comp1 = component_types.get(comp1, 0)
        print(f"\n  {comp1} ({total_renders_comp1} renders):")
        
        for comp2, count in sorted(co_renders.items(), 
                                    key=lambda x: x[1], 
                                    reverse=True)[:3]:
            total_renders_comp2 = component_types.get(comp2, 0)
            percentage = (count / max(total_renders_comp1, total_renders_comp2)) * 100
            if percentage > 90:
                print(f"    → {comp2}: {count}/{max(total_renders_comp1, total_renders_comp2)} veces ({percentage:.1f}%)")
    
    # Detailed analysis of top offenders
    print(f"\n\n🎯 ANÁLISIS DETALLADO DE TOP OFFENDERS:")
    
    stats = defaultdict(lambda: {"renders": 0, "total_time": 0.0, "durations": []})
    
    for commit in root.get('commitData', []):
        fas = commit.get('fiberActualDurations', [])
        if isinstance(fas, dict):
            items = fas.items()
        else:
            items = fas
        
        for pair in items:
            if isinstance(pair, (list, tuple)) and len(pair) >= 2:
                fid, dur = pair[0], pair[1]
            else:
                fid, dur = pair
            
            meta = id_meta.get(fid, {})
            name = meta.get('displayName') or meta.get('key') or f'Fiber#{fid}'
            
            try:
                dur_f = float(dur)
            except:
                dur_f = 0.0
            
            stats[name]['renders'] += 1
            stats[name]['total_time'] += dur_f
            stats[name]['durations'].append(dur_f)
    
    # Calculate detailed stats
    detailed_stats = []
    for name, s in stats.items():
        renders = s['renders']
        total = s['total_time']
        durations = s['durations']
        
        avg = total / renders if renders else 0.0
        impact = total * renders
        
        # Calculate percentiles
        sorted_durs = sorted(durations)
        p50 = sorted_durs[len(sorted_durs)//2] if sorted_durs else 0
        p95 = sorted_durs[int(len(sorted_durs)*0.95)] if sorted_durs else 0
        p99 = sorted_durs[int(len(sorted_durs)*0.99)] if sorted_durs else 0
        max_dur = max(durations) if durations else 0
        
        detailed_stats.append({
            'name': name,
            'renders': renders,
            'total_ms': round(total, 3),
            'avg_ms': round(avg, 3),
            'p50_ms': round(p50, 3),
            'p95_ms': round(p95, 3),
            'p99_ms': round(p99, 3),
            'max_ms': round(max_dur, 3),
            'impact': round(impact, 3),
        })
    
    detailed_stats.sort(key=lambda x: x['impact'], reverse=True)
    
    for i, stat in enumerate(detailed_stats[:5], 1):
        print(f"\n  #{i} - {stat['name']}:")
        print(f"    - Renders totales: {stat['renders']}")
        print(f"    - Tiempo total acumulado: {stat['total_ms']}ms")
        print(f"    - Promedio por render: {stat['avg_ms']}ms")
        print(f"    - Mediana (P50): {stat['p50_ms']}ms")
        print(f"    - P95: {stat['p95_ms']}ms")
        print(f"    - P99: {stat['p99_ms']}ms")
        print(f"    - Máximo: {stat['max_ms']}ms")
        print(f"    - Score de impacto: {stat['impact']:,.0f}")
        
        # Check if component has unusual variance
        if stat['max_ms'] > stat['avg_ms'] * 5:
            print(f"    ⚠️  VARIANZA ALTA: El peor caso es {stat['max_ms'] / stat['avg_ms']:.1f}x el promedio")
    
    print("\n" + "=" * 80)
    
    return detailed_stats

if __name__ == '__main__':
    profile_path = 'profiling-data.20-01-2026.12-09-03.json'
    analyze_profiling_deep(profile_path)
