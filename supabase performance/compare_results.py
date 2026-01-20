import json

# Leer ambos análisis
with open('analysis-result.json', 'r', encoding='utf-8') as f:
    before = json.load(f)

with open('analysis-result-ultimo.json', 'r', encoding='utf-8') as f:
    after = json.load(f)

print("=" * 80)
print("COMPARACIÓN DE RENDIMIENTO - ANTES VS DESPUÉS DEL FIX")
print("=" * 80)

before_data = {item['name']: item for item in before['summary']}
after_data = {item['name']: item for item in after['summary']}

print("\n📊 TOP 10 COMPONENTES - IMPACTO")
print("-" * 80)
print(f"{'Componente':<30} {'Antes':<20} {'Después':<20} {'Mejora':<15}")
print("-" * 80)

for item in before['summary'][:10]:
    name = item['name']
    before_impact = item['impact']
    after_item = after_data.get(name, {'impact': 0})
    after_impact = after_item['impact']
    
    improvement = ((before_impact - after_impact) / before_impact * 100) if before_impact > 0 else 0
    
    print(f"{name:<30} {before_impact:>15,.0f}    {after_impact:>15,.0f}    {improvement:>10.1f}%")

print("\n" + "=" * 80)
print("MÉTRICAS DETALLADAS")
print("=" * 80)

# Anonymous
anon_before = before_data.get('Anonymous', {})
anon_after = after_data.get('Anonymous', {})

print(f"\n🎯 Componente 'Anonymous' (Principal problema):")
print(f"  Renders:        {anon_before.get('renders', 0):>6} → {anon_after.get('renders', 0):>6}  ({(anon_before.get('renders', 0) - anon_after.get('renders', 0))} menos, {((anon_before.get('renders', 0) - anon_after.get('renders', 0)) / anon_before.get('renders', 1) * 100):.1f}% reducción)")
print(f"  Tiempo total:   {anon_before.get('total_ms', 0):>6.1f}ms → {anon_after.get('total_ms', 0):>6.1f}ms  ({anon_before.get('total_ms', 0) - anon_after.get('total_ms', 0):.1f}ms menos)")
print(f"  Promedio/render:{anon_before.get('avg_ms', 0):>6.1f}ms → {anon_after.get('avg_ms', 0):>6.1f}ms")
print(f"  Impacto:        {anon_before.get('impact', 0):>15,.0f} → {anon_after.get('impact', 0):>15,.0f}  ({((anon_before.get('impact', 0) - anon_after.get('impact', 0)) / anon_before.get('impact', 1) * 100):.1f}% reducción)")

# Context Providers
mu_before = before_data.get('mu', {})
mu_after = after_data.get('mu', {})

print(f"\n🔄 Componente 'mu' (Context):")
print(f"  Renders:        {mu_before.get('renders', 0):>6} → {mu_after.get('renders', 0):>6}  ({(mu_before.get('renders', 0) - mu_after.get('renders', 0))} menos, {((mu_before.get('renders', 0) - mu_after.get('renders', 0)) / mu_before.get('renders', 1) * 100):.1f}% reducción)")
print(f"  Tiempo total:   {mu_before.get('total_ms', 0):>6.1f}ms → {mu_after.get('total_ms', 0):>6.1f}ms  ({mu_before.get('total_ms', 0) - mu_after.get('total_ms', 0):.1f}ms menos)")
print(f"  Impacto:        {mu_before.get('impact', 0):>15,.0f} → {mu_after.get('impact', 0):>15,.0f}  ({((mu_before.get('impact', 0) - mu_after.get('impact', 0)) / mu_before.get('impact', 1) * 100):.1f}% reducción)")

dm_before = before_data.get('dm', {})
dm_after = after_data.get('dm', {})

print(f"\n🔄 Componente 'dm' (Context Provider):")
print(f"  Renders:        {dm_before.get('renders', 0):>6} → {dm_after.get('renders', 0):>6}  ({(dm_before.get('renders', 0) - dm_after.get('renders', 0))} menos, {((dm_before.get('renders', 0) - dm_after.get('renders', 0)) / dm_before.get('renders', 1) * 100):.1f}% reducción)")
print(f"  Tiempo total:   {dm_before.get('total_ms', 0):>6.1f}ms → {dm_after.get('total_ms', 0):>6.1f}ms  ({dm_before.get('total_ms', 0) - dm_after.get('total_ms', 0):.1f}ms menos)")
print(f"  Impacto:        {dm_before.get('impact', 0):>15,.0f} → {dm_after.get('impact', 0):>15,.0f}  ({((dm_before.get('impact', 0) - dm_after.get('impact', 0)) / dm_before.get('impact', 1) * 100):.1f}% reducción)")

# Totales
print("\n" + "=" * 80)
print("RESUMEN GENERAL")
print("=" * 80)

total_renders_before = sum(item['renders'] for item in before['summary'][:20])
total_renders_after = sum(item['renders'] for item in after['summary'][:20])

total_time_before = sum(item['total_ms'] for item in before['summary'][:20])
total_time_after = sum(item['total_ms'] for item in after['summary'][:20])

total_impact_before = sum(item['impact'] for item in before['summary'][:20])
total_impact_after = sum(item['impact'] for item in after['summary'][:20])

print(f"\nTotal de renders (Top 20):")
print(f"  Antes:  {total_renders_before:>8,}")
print(f"  Después:{total_renders_after:>8,}")
print(f"  Reducción: {total_renders_before - total_renders_after:>6,} ({(total_renders_before - total_renders_after) / total_renders_before * 100:.1f}%)")

print(f"\nTiempo total de CPU (Top 20):")
print(f"  Antes:  {total_time_before:>8,.1f}ms")
print(f"  Después:{total_time_after:>8,.1f}ms")
print(f"  Reducción: {total_time_before - total_time_after:>6,.1f}ms ({(total_time_before - total_time_after) / total_time_before * 100:.1f}%)")

print(f"\nImpacto total (Top 20):")
print(f"  Antes:  {total_impact_before:>15,.0f}")
print(f"  Después:{total_impact_after:>15,.0f}")
print(f"  Reducción: {total_impact_before - total_impact_after:>12,.0f} ({(total_impact_before - total_impact_after) / total_impact_before * 100:.1f}%)")

print("\n" + "=" * 80)
print("✅ CONCLUSIÓN")
print("=" * 80)
print(f"""
El fix de useCallback + React.memo ha sido EXTREMADAMENTE EXITOSO:

• Renders del componente Anonymous: -{((anon_before.get('renders', 0) - anon_after.get('renders', 0)) / anon_before.get('renders', 1) * 100):.1f}% (de {anon_before.get('renders', 0)} a {anon_after.get('renders', 0)})
• Tiempo ahorrado en Anonymous: {anon_before.get('total_ms', 0) - anon_after.get('total_ms', 0):.1f}ms
• Impacto reducido en Anonymous: -{((anon_before.get('impact', 0) - anon_after.get('impact', 0)) / anon_before.get('impact', 1) * 100):.1f}%

• Renders del contexto (mu + dm): -{((mu_before.get('renders', 0) + dm_before.get('renders', 0)) - (mu_after.get('renders', 0) + dm_after.get('renders', 0)))} (de {mu_before.get('renders', 0) + dm_before.get('renders', 0)} a {mu_after.get('renders', 0) + dm_after.get('renders', 0)})

MEJORA TOTAL: {(total_impact_before - total_impact_after) / total_impact_before * 100:.1f}% reducción en impacto de rendimiento

La aplicación debería sentirse significativamente más fluida.
""")

print("=" * 80)
