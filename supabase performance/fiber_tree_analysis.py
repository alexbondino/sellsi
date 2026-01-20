import json

def analyze_fiber_tree(profile_path):
    with open(profile_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    root = data['dataForRoots'][0]
    snapshots = root.get('snapshots', [])
    
    # Build fiber tree
    id_meta = {}
    for snap in snapshots:
        if isinstance(snap, (list, tuple)) and len(snap) >= 2:
            fid = snap[0]
            meta = snap[1] or {}
            id_meta[fid] = meta
    
    print("=" * 80)
    print("ANÁLISIS DEL ÁRBOL DE FIBERS")
    print("=" * 80)
    
    # Find Anonymous component
    anonymous_fibers = []
    um_fibers = []
    dm_fibers = []
    
    for fid, meta in id_meta.items():
        name = meta.get('displayName', '')
        if name == 'Anonymous':
            anonymous_fibers.append((fid, meta))
        elif name == 'um':
            um_fibers.append((fid, meta))
        elif name == 'dm':
            dm_fibers.append((fid, meta))
    
    print(f"\n COMPONENTES 'Anonymous' encontrados: {len(anonymous_fibers)}")
    for fid, meta in anonymous_fibers:
        print(f"\n  Fiber ID: {fid}")
        print(f"  Metadata completo:")
        for key, value in meta.items():
            print(f"    - {key}: {value}")
    
    print(f"\n COMPONENTES 'um' encontrados: {len(um_fibers)}")
    for fid, meta in um_fibers:
        print(f"\n  Fiber ID: {fid}")
        props = meta.get('props', [])
        print(f"  Props que cambian: {props}")
    
    print(f"\n COMPONENTES 'dm' encontrados: {len(dm_fibers)}")
    for fid, meta in dm_fibers:
        print(f"\n  Fiber ID: {fid}")
        context = meta.get('context', False)
        print(f"  Context changed: {context}")
    
    # Analyze first commit in detail
    print("\n" + "=" * 80)
    print("ANÁLISIS DETALLADO DEL PRIMER COMMIT")
    print("=" * 80)
    
    first_commit = root['commitData'][0]
    changes = first_commit.get('changeDescriptions', [])
    
    print(f"\nCambios en el primer commit: {len(changes) if changes else 0}")
    
    if changes:
        for change in changes[:10]:  # First 10
            if isinstance(change, (list, tuple)) and len(change) >= 2:
                fid = change[0]
                change_info = change[1]
                meta = id_meta.get(fid, {})
                name = meta.get('displayName', f'Fiber#{fid}')
                
                print(f"\n  {name} (Fiber #{fid}):")
                for key, value in change_info.items():
                    print(f"    - {key}: {value}")
    
    # Find which fibers are parents/children
    print("\n" + "=" * 80)
    print("BÚSQUEDA DE RELACIONES PADRE-HIJO")
    print("=" * 80)
    
    # Get snapshot at a specific point
    if len(snapshots) > 100:
        sample_snapshot = snapshots[100]
        print(f"\nAnalizando snapshot #{100}")
        print(f"Snapshot data: {sample_snapshot[:3] if len(sample_snapshot) > 3 else sample_snapshot}")
    
    # Look for fiber 46842 which is 'um' based on the output
    if 46842 in id_meta:
        print(f"\n >> Analizando Fiber #46842 (um/Tag):")
        meta = id_meta[46842]
        for key, value in meta.items():
            print(f"  {key}: {value}")
    
    if 46841 in id_meta:
        print(f"\n >> Analizando Fiber #46841 (dm - padre de um):")
        meta = id_meta[46841]
        for key, value in meta.items():
            print(f"  {key}: {value}")
    
    print("\n" + "=" * 80)

if __name__ == '__main__':
    analyze_fiber_tree('profiling-data.20-01-2026.12-09-03.json')
