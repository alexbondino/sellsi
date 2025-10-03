# 🔧 Caso Especial: UF/USD en Columna UF

## 📋 Problema

El **UF/USD** es un caso especial que NO debe tratarse como una paridad normal:
- **NO necesita** columna de "Puntos Forward"
- **Solo se usa** el Precio Spot
- **Debe ir** en la columna fija "UF" (columna B)

## 💡 Razón

El UF/USD representa el **valor de la Unidad de Fomento expresado en dólares**. No es una paridad de trading normal con forwards, sino un **indicador de referencia**.

---

## 🏗️ Solución Implementada

### Antes (Incorrecto):
```
┌──────────┬──────┬──────┬─────────────────┬─────────────────┬─────────────────┐
│          │      │      │      USD        │      EUR        │      UF         │
├──────────┼──────┼──────┼────────┬────────┼────────┬────────┼────────┬────────┤
│  Fecha   │  UF  │ IPC  │  Spot  │Pts.Fwd │  Spot  │Pts.Fwd │  Spot  │Pts.Fwd │ ❌
├──────────┼──────┼──────┼────────┼────────┼────────┼────────┼────────┼────────┤
│30/10/2025│      │      │ 920,50 │  12,30 │1050,20 │  15,40 │ 0,0254 │ 0,0001 │ ❌
└──────────┴──────┴──────┴────────┴────────┴────────┴────────┴────────┴────────┘
                   ↑                                           ↑
                Vacío                                    Header UF con Pts ❌
```

### Después (Correcto):
```
┌──────────┬────────┬──────┬─────────────────┬─────────────────┐
│          │        │      │      USD        │      EUR        │
├──────────┼────────┼──────┼────────┬────────┼────────┬────────┤
│  Fecha   │   UF   │ IPC  │  Spot  │Pts.Fwd │  Spot  │Pts.Fwd │ ✅
├──────────┼────────┼──────┼────────┼────────┼────────┼────────┤
│30/10/2025│ 0,0254 │      │ 920,50 │  12,30 │1050,20 │  15,40 │ ✅
└──────────┴────────┴──────┴────────┴────────┴────────┴────────┘
             ↑                                            ↑
        Valor UF aquí                               Sin header UF/USD ✅
```

---

## 🔧 Cambios en el Código

### Archivo: `handlers/result_extractor.py`

#### Método: `guardar_resultados_excel_matriz()`

**1. Separar UF/USD de paridades normales:**
```python
# Separar UF/USD de otras paridades
paridades_normales = [p for p in paridades if p != "UF/USD"]
tiene_uf_usd = "UF/USD" in paridades
```

**2. Headers solo para paridades normales:**
```python
# ===== ROW 1: HEADERS PRINCIPALES (merged) =====
col_idx = 4  # Empezar después de Fecha, UF, IPC
for paridad in paridades_normales:  # ← Solo normales, NO UF/USD
    moneda = paridad.split('/')[0]
    
    cell = ws.cell(row=1, column=col_idx, value=moneda)
    # ... merge cells ...
    
    col_idx += 2
```

**3. Columna UF con valor de UF/USD:**
```python
# Columna B: UF (Spot de UF/USD si existe)
if tiene_uf_usd and "UF/USD" in data_row:
    ws.cell(row=row_idx, column=2, value=data_row["UF/USD"]["spot"])
else:
    ws.cell(row=row_idx, column=2, value="")
```

**4. Ajuste de anchos de columna:**
```python
ws.column_dimensions['A'].width = 12  # Fecha
ws.column_dimensions['B'].width = 10  # UF (más ancho para decimales como 0,0254)
ws.column_dimensions['C'].width = 8   # IPC

# Solo para paridades normales
for col_idx in range(4, 4 + len(paridades_normales) * 2):
    ws.column_dimensions[get_column_letter(col_idx)].width = 14
```

**5. Logs informativos:**
```python
if tiene_uf_usd:
    self.log(f"[ResultExtract]    ⚠️ UF/USD procesado: Spot → Columna UF", level="INFO")
self.log(f"[ResultExtract]    ├─ Paridades normales (Spot+Pts): {len(paridades_normales)}", level="INFO")
```

---

## 📊 Ejemplos de Output

### Ejemplo 1: USD/CLP + EUR/CLP + UF/USD

**Input:**
```python
paridades = ["USD/CLP", "EUR/CLP", "UF/USD"]
```

**Excel Resultante:**
```
┌──────────┬────────┬──────┬─────────────────┬─────────────────┐
│          │        │      │      USD        │      EUR        │
├──────────┼────────┼──────┼────────┬────────┼────────┬────────┤
│  Fecha   │   UF   │ IPC  │  Spot  │Pts.Fwd │  Spot  │Pts.Fwd │
├──────────┼────────┼──────┼────────┼────────┼────────┼────────┤
│30/10/2025│ 0,0254 │      │ 920,50 │  12,30 │1050,20 │  15,40 │
│29/11/2025│ 0,0254 │      │ 920,50 │  24,60 │1050,20 │  30,80 │
│31/12/2025│ 0,0254 │      │ 920,50 │  36,90 │1050,20 │  46,20 │
└──────────┴────────┴──────┴────────┴────────┴────────┴────────┘
```

### Ejemplo 2: Solo USD/CLP + UF/USD

**Input:**
```python
paridades = ["USD/CLP", "UF/USD"]
```

**Excel Resultante:**
```
┌──────────┬────────┬──────┬─────────────────┐
│          │        │      │      USD        │
├──────────┼────────┼──────┼────────┬────────┤
│  Fecha   │   UF   │ IPC  │  Spot  │Pts.Fwd │
├──────────┼────────┼──────┼────────┼────────┤
│30/10/2025│ 0,0254 │      │ 920,50 │  12,30 │
│29/11/2025│ 0,0254 │      │ 920,50 │  24,60 │
│31/12/2025│ 0,0254 │      │ 920,50 │  36,90 │
└──────────┴────────┴──────┴────────┴────────┘
```

### Ejemplo 3: Solo UF/USD (sin otras paridades)

**Input:**
```python
paridades = ["UF/USD"]
```

**Excel Resultante:**
```
┌──────────┬────────┬──────┐
│          │        │      │
├──────────┼────────┼──────┤
│  Fecha   │   UF   │ IPC  │
├──────────┼────────┼──────┤
│30/10/2025│ 0,0254 │      │
│29/11/2025│ 0,0254 │      │
│31/12/2025│ 0,0254 │      │
└──────────┴────────┴──────┘
```

---

## 🔄 Flujo de Procesamiento

```
INPUT: paridades = ["USD/CLP", "EUR/CLP", "UF/USD"]

        ↓

SEPARACIÓN:
├─ paridades_normales = ["USD/CLP", "EUR/CLP"]
└─ tiene_uf_usd = True

        ↓

LOOP COMBINACIONES:
├─ Combinación 1: USD/CLP
│   ├─ Iteración 1: Oct 2025 → Spot + Pts Forward
│   ├─ Iteración 2: Nov 2025 → Spot + Pts Forward
│   └─ Iteración 3: Dec 2025 → Spot + Pts Forward
│
├─ Combinación 2: EUR/CLP
│   ├─ Iteración 1: Oct 2025 → Spot + Pts Forward
│   ├─ Iteración 2: Nov 2025 → Spot + Pts Forward
│   └─ Iteración 3: Dec 2025 → Spot + Pts Forward
│
└─ Combinación 3: UF/USD
    ├─ Iteración 1: Oct 2025 → Solo Spot ⚠️
    ├─ Iteración 2: Nov 2025 → Solo Spot ⚠️
    └─ Iteración 3: Dec 2025 → Solo Spot ⚠️

        ↓

ESTRUCTURA MATRIZ:
{
    "30/10/2025": {
        "fecha": datetime(2025, 10, 30),
        "USD/CLP": {"spot": "920,50", "pts_fwd": "12,30"},
        "EUR/CLP": {"spot": "1050,20", "pts_fwd": "15,40"},
        "UF/USD": {"spot": "0,0254", "pts_fwd": "0,0001"}  ← pts_fwd extraído pero NO usado
    }
}

        ↓

EXCEL GENERATION:
├─ Headers merged: Solo USD, EUR (NO UF)
├─ Columna B (UF): data["UF/USD"]["spot"]
├─ Columnas 4-5: USD (Spot + Pts)
└─ Columnas 6-7: EUR (Spot + Pts)
```

---

## 🎯 Casos de Uso

### 1. Análisis de Paridades vs UF
- Ver evolución de USD/CLP, EUR/CLP
- Comparar con valor UF en mismas fechas
- Calcular ratios UF/paridad

### 2. Reportes Financieros
- Formato estándar: UF en columna fija
- Otras monedas con sus forwards
- Fácil comparación histórica

### 3. Inputs para Otros Sistemas
- Columna UF lista para ser leída
- No confundir con forwards de UF (no existen)
- Formato profesional y limpio

---

## ⚠️ Consideraciones Importantes

### 1. UF/USD NO tiene Puntos Forward
- El valor de la UF no tiene mercado forward como divisas
- Solo se cotiza el spot del día
- Por eso NO aparece como header con columnas Spot+Pts

### 2. Extracción desde Sistema
- El bot SÍ extrae "Puntos Forward" de UF/USD (puede venir del sistema)
- Pero en Excel solo usamos el Spot
- Los puntos se descartan al generar Excel

### 3. Orden de Columnas
- **Fijas (siempre):** Fecha | UF | IPC
- **Dinámicas:** Dependen de paridades seleccionadas (sin UF/USD)
- Ejemplo: USD/CLP → 2 cols, EUR/CLP → 2 cols, total = 3 fijas + 4 dinámicas = 7 cols

---

## 🧪 Testing

### Test Case 1: Con UF/USD
```python
engine = ForwardAutomationEngine(
    fecha_inicio=datetime(2025, 10, 1),
    mes_vencimiento="Diciembre 2025",
    paridades=["USD/CLP", "UF/USD"],
    directorio_salida="./output",
    log_callback=log
)
engine.start()

# Expected:
# - Excel con 5 columnas: Fecha | UF | IPC | USD Spot | USD Pts
# - Columna UF llena con valores ~0,025x
# - Log: "⚠️ UF/USD procesado: Spot → Columna UF"
```

### Test Case 2: Sin UF/USD
```python
engine = ForwardAutomationEngine(
    fecha_inicio=datetime(2025, 10, 1),
    mes_vencimiento="Diciembre 2025",
    paridades=["USD/CLP", "EUR/CLP"],
    directorio_salida="./output",
    log_callback=log
)
engine.start()

# Expected:
# - Excel con 7 columnas: Fecha | UF | IPC | USD Spot | USD Pts | EUR Spot | EUR Pts
# - Columna UF vacía
# - Sin log de UF/USD
```

---

## 📝 Resumen

✅ **UF/USD es caso especial**
✅ **Solo Spot extraído**
✅ **Va en columna fija UF (B)**
✅ **NO aparece como header merged**
✅ **Paridades normales: Spot + Pts Forward**
✅ **Anchos de columna ajustados**
✅ **Logs informativos agregados**

---

**Sistema actualizado para manejar correctamente UF/USD!** 🎉
