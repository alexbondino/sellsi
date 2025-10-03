# 🔄 Sistema de Combinaciones - Forward Automation

## 📋 Estructura Excel Requerida

### Vista Visual del Excel Final:

```
┌──────────┬──────┬──────┬─────────────────┬─────────────────┬─────────────────┐
│          │      │      │      USD        │      EUR        │   ... más ...   │
├──────────┼──────┼──────┼────────┬────────┼────────┬────────┼─────────────────┤
│  Fecha   │  UF  │ IPC  │  Spot  │Pts.Fwd │  Spot  │Pts.Fwd │   ...           │
├──────────┼──────┼──────┼────────┼────────┼────────┼────────┼─────────────────┤
│30/10/2025│      │      │ 920,50 │  12,30 │1050,20 │  15,40 │                 │
│29/11/2025│      │      │ 920,50 │  24,60 │1050,20 │  30,80 │                 │
│31/12/2025│      │      │ 920,50 │  36,90 │1050,20 │  46,20 │                 │
└──────────┴──────┴──────┴────────┴────────┴────────┴────────┴─────────────────┘
```

### Explicación Detallada:

**Row 1 (Headers Principales):**
- Columna A: Vacía
- Columna B: Vacía
- Columna C: Vacía
- Columna D-E (merged): "USD"
- Columna F-G (merged): "EUR"
- Columna H-I (merged): "UF" (si se selecciona UF/USD)
- ... etc para cada paridad

**Row 2 (Sub-Headers):**
- Columna A: "Fecha"
- Columna B: "UF"
- Columna C: "IPC"
- Columna D: "Spot"
- Columna E: "Pts. Forward"
- Columna F: "Spot"
- Columna G: "Pts. Forward"
- ... etc

**Row 3+: Datos**
- Una fila por cada fecha de vencimiento (mes)
- Valores extraídos del sistema

---

## 🔄 Flujo de Combinaciones

### Input del Usuario:
```python
{
    "fecha_inicio": datetime(2025, 10, 1),
    "mes_vencimiento": "Diciembre 2025",
    "paridades": ["USD/CLP", "EUR/CLP", "UF/USD"]
}
```

### Proceso de Ejecución:

```
PASO 1: CONFIGURACIÓN GLOBAL (UNA VEZ)
├─ Configurar Fecha Inicio: 01/10/2025
└─ Configurar Fecha Valoración: 01/10/2025

PASO 2: LOOP DE COMBINACIONES
┌─────────────────────────────────────────────┐
│ FOR cada paridad in paridades:             │
│                                             │
│   1. Cambiar Paridad = paridad             │
│                                             │
│   2. Calcular n = num_iteraciones          │
│                                             │
│   3. FOR i in range(1, n+1):               │
│      ├─ Calcular mes_i                     │
│      ├─ Calcular fecha_vencimiento_i       │
│      ├─ Configurar Vencimiento             │
│      ├─ Click Calcular                     │
│      ├─ Extraer Precio Spot Bid            │
│      ├─ Extraer Puntos Forward Bid         │
│      └─ Guardar en estructura matriz       │
│                                             │
└─────────────────────────────────────────────┘

PASO 3: GENERAR EXCEL CON FORMATO MATRIZ
├─ Crear estructura: fechas como filas
├─ Crear columnas para cada paridad (Spot + Pts)
├─ Merge headers principales (USD, EUR, etc)
├─ Aplicar formato
└─ Guardar: Forward_YYYYMMDD_HHMM.xlsx
```

---

## 🗂️ Estructura de Datos Interna

### Opción 1: Dict de Dicts (ELEGIDA)
```python
{
    "30/10/2025": {
        "fecha": datetime(2025, 10, 30),
        "USD/CLP": {"spot": "920,50", "pts_fwd": "12,30"},
        "EUR/CLP": {"spot": "1050,20", "pts_fwd": "15,40"},
        "UF/USD": {"spot": "0,0254", "pts_fwd": "0,0001"}
    },
    "29/11/2025": {
        "fecha": datetime(2025, 11, 29),
        "USD/CLP": {"spot": "920,50", "pts_fwd": "24,60"},
        "EUR/CLP": {"spot": "1050,20", "pts_fwd": "30,80"},
        "UF/USD": {"spot": "0,0254", "pts_fwd": "0,0002"}
    },
    "31/12/2025": {
        "fecha": datetime(2025, 12, 31),
        "USD/CLP": {"spot": "920,50", "pts_fwd": "36,90"},
        "EUR/CLP": {"spot": "1050,20", "pts_fwd": "46,20"},
        "UF/USD": {"spot": "0,0254", "pts_fwd": "0,0003"}
    }
}
```

**Ventajas:**
- Fácil lookup por fecha
- Natural para agregar nuevas paridades
- Fácil conversión a Excel matriz

---

## 📊 Implementación Excel con openpyxl

### Código de Ejemplo:

```python
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def crear_excel_matriz(resultados, paridades, output_path):
    """
    Crea Excel con formato de matriz.
    
    resultados: Dict[fecha_str, Dict[paridad, Dict[spot, pts_fwd]]]
    paridades: List[str] - Ej: ["USD/CLP", "EUR/CLP"]
    """
    wb = Workbook()
    ws = wb.active
    ws.title = "Forward Results"
    
    # ===== ROW 1: HEADERS PRINCIPALES =====
    col_idx = 4  # Empezar después de Fecha, UF, IPC
    for paridad in paridades:
        # Extraer solo la moneda base (USD, EUR, UF)
        moneda = paridad.split('/')[0]
        
        # Escribir header en columna actual
        cell = ws.cell(row=1, column=col_idx, value=moneda)
        cell.font = Font(bold=True, size=12)
        cell.alignment = Alignment(horizontal='center', vertical='center')
        
        # Merge con la siguiente columna (Spot + Pts Forward)
        ws.merge_cells(
            start_row=1, start_column=col_idx,
            end_row=1, end_column=col_idx+1
        )
        
        col_idx += 2  # Avanzar 2 columnas (Spot + Pts)
    
    # ===== ROW 2: SUB-HEADERS =====
    ws.cell(row=2, column=1, value="Fecha").font = Font(bold=True)
    ws.cell(row=2, column=2, value="UF").font = Font(bold=True)
    ws.cell(row=2, column=3, value="IPC").font = Font(bold=True)
    
    col_idx = 4
    for _ in paridades:
        ws.cell(row=2, column=col_idx, value="Spot").font = Font(bold=True, size=9)
        ws.cell(row=2, column=col_idx+1, value="Pts. Forward").font = Font(bold=True, size=9)
        col_idx += 2
    
    # ===== ROW 3+: DATOS =====
    fechas_ordenadas = sorted(resultados.keys(), key=lambda x: resultados[x]["fecha"])
    
    for row_idx, fecha_str in enumerate(fechas_ordenadas, start=3):
        data_row = resultados[fecha_str]
        
        # Columna A: Fecha (formato dd/mm/yyyy)
        ws.cell(row=row_idx, column=1, value=data_row["fecha"].strftime("%d/%m/%Y"))
        
        # Columnas B y C: Vacías por ahora (UF, IPC)
        ws.cell(row=row_idx, column=2, value="")
        ws.cell(row=row_idx, column=3, value="")
        
        # Columnas de paridades
        col_idx = 4
        for paridad in paridades:
            if paridad in data_row:
                ws.cell(row=row_idx, column=col_idx, value=data_row[paridad]["spot"])
                ws.cell(row=row_idx, column=col_idx+1, value=data_row[paridad]["pts_fwd"])
            else:
                # Si no hay datos para esta paridad en esta fecha
                ws.cell(row=row_idx, column=col_idx, value="")
                ws.cell(row=row_idx, column=col_idx+1, value="")
            
            col_idx += 2
    
    # ===== FORMATO =====
    # Anchos de columna
    ws.column_dimensions['A'].width = 12  # Fecha
    ws.column_dimensions['B'].width = 8   # UF
    ws.column_dimensions['C'].width = 8   # IPC
    for col_idx in range(4, 4 + len(paridades) * 2):
        ws.column_dimensions[get_column_letter(col_idx)].width = 12
    
    # Bordes
    thin_border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    for row in ws.iter_rows(min_row=1, max_row=ws.max_row, min_col=1, max_col=ws.max_column):
        for cell in row:
            cell.border = thin_border
    
    # ===== GUARDAR =====
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    filename = f"Forward_{timestamp}.xlsx"
    filepath = output_path / filename
    
    wb.save(filepath)
    return filepath
```

---

## 🔧 Cambios Necesarios en el Código

### 1. `forward_automation_engine.py`

```python
def __init__(self, fecha_inicio, mes_vencimiento, paridades, directorio_salida, log_callback):
    """
    paridades: List[str] - Ej: ["USD/CLP", "EUR/CLP", "UF/USD"]
    """
    self.paridades = paridades
    
    # Nueva estructura de resultados (Dict de Dicts)
    self.resultados_matriz = {}  # {fecha_str: {paridad: {spot, pts_fwd}}}

def _execute_combinations(self):
    """Loop de combinaciones."""
    
    # Configurar fechas UNA VEZ
    self.form_config.configurar_fecha_inicio(self.fecha_inicio)
    self.form_config.configurar_fecha_valoracion(self.fecha_inicio)
    
    # Loop de paridades
    for idx, paridad in enumerate(self.paridades, 1):
        self.log(f"\n{'='*60}")
        self.log(f"COMBINACIÓN {idx}/{len(self.paridades)}: {paridad}")
        self.log(f"{'='*60}")
        
        # Cambiar paridad
        self.form_config.configurar_paridad(paridad)
        
        # Ejecutar iteraciones para esta paridad
        self._execute_iterations_for_combination(paridad)

def _execute_iterations_for_combination(self, paridad):
    """Ejecuta iteraciones para una paridad."""
    
    num_iter = self.iter_calc.calcular_numero_iteraciones(
        self.fecha_inicio, self.mes_vencimiento
    )
    
    for i in range(1, num_iter + 1):
        mes_actual = self.iter_calc.calcular_mes_iteracion(self.fecha_inicio, i)
        fecha_venc = self.date_calc.calcular_ultimo_dia_habil(mes_actual)
        
        # Configurar y calcular
        self.form_config.configurar_fecha_vencimiento(fecha_venc)
        self.form_config.click_calcular()
        
        # Extraer resultados
        resultado = self.result_extractor.extraer_resultados(mes_actual)
        
        # Agregar a estructura matriz
        fecha_str = fecha_venc.strftime("%d/%m/%Y")
        
        if fecha_str not in self.resultados_matriz:
            self.resultados_matriz[fecha_str] = {
                "fecha": fecha_venc
            }
        
        self.resultados_matriz[fecha_str][paridad] = {
            "spot": resultado["precio_spot_bid"],
            "pts_fwd": resultado["puntos_forward_bid"]
        }
```

### 2. `handlers/result_extractor.py`

```python
def guardar_resultados_excel_matriz(self, resultados_matriz, paridades, directorio):
    """
    Nueva función para guardar en formato matriz.
    
    resultados_matriz: Dict[fecha_str, Dict[paridad, Dict[spot, pts_fwd]]]
    paridades: List[str]
    """
    from openpyxl import Workbook
    from openpyxl.styles import Font, Alignment, Border, Side
    from openpyxl.utils import get_column_letter
    from datetime import datetime
    from pathlib import Path
    
    wb = Workbook()
    ws = wb.active
    ws.title = "Forward Results"
    
    # ... (código de ejemplo anterior)
    
    # Guardar con formato: Forward_YYYYMMDD_HHMM.xlsx
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    filename = f"Forward_{timestamp}.xlsx"
    filepath = Path(directorio) / filename
    
    wb.save(filepath)
    
    self.log(f"✅ Excel guardado: {filepath}")
    return str(filepath)
```

### 3. `forward_calculator_ui.py`

```python
# Agregar selector de paridades múltiples

# Frame de paridades
frame_paridades = tk.LabelFrame(...)
frame_paridades.grid(...)

# Variables para checkboxes
self.paridad_vars = {
    "USD/CLP": tk.BooleanVar(value=True),  # Default seleccionado
    "EUR/CLP": tk.BooleanVar(value=False),
    "EUR/USD": tk.BooleanVar(value=False),
    "UF/USD": tk.BooleanVar(value=False),
    # ... más paridades
}

# Crear checkboxes
for paridad, var in self.paridad_vars.items():
    cb = tk.Checkbutton(
        frame_paridades,
        text=paridad,
        variable=var,
        font=("Segoe UI", 10),
        bg=BG_COLOR,
        fg=TEXT_COLOR,
        selectcolor=BG_COLOR
    )
    cb.pack(anchor="w", padx=5, pady=2)

# Al ejecutar:
def ejecutar_bot(self):
    # Obtener paridades seleccionadas
    paridades = [p for p, var in self.paridad_vars.items() if var.get()]
    
    if not paridades:
        messagebox.showwarning("Sin paridades", "Selecciona al menos una paridad")
        return
    
    # Pasar al engine
    engine = ForwardAutomationEngine(
        fecha_inicio=self.fecha_inicio,
        mes_vencimiento=self.mes_vencimiento,
        paridades=paridades,  # ← NUEVO
        directorio_salida=self.directorio,
        log_callback=self.agregar_log
    )
```

---

## 📝 Mapeo de Paridades a Valores

Del HTML vemos que el `<select>` usa valores numéricos:

```python
PARIDAD_VALUE_MAP = {
    "USD/CLP": "1",
    "EUR/CLP": "12",
    "EUR/USD": "33",
    "JPY/CLP": "16",
    "USD/JPY": "34",
    "UF/USD": "22",
    "GBP/CLP": "18",
    "GBP/USD": "19",
    "USD/CAD": "14",
    "USD/NOK": "3",
    "USD/DKK": "4",
    "USD/SEK": "5",
    "USD/COP": "6",
    "USD/ARS": "7",
    "USD/BRL": "8",
    "USD/PEN": "9",
    "USD/MXN": "10",
    "USD/CHF": "13",
    "AUD/USD": "20",
    "NZD/USD": "21",
    "CAD/CLP": "17",
    "EUR/COP": "15",
    "USD/CNH": "11",
    "CNH/CLP": "35",
    "CHF/CLP": "37",
    "EUR/MXN": "42",
    "GBP/MXN": "43",
    "JPY/MXN": "44"
}
```

Este mapeo debe ir en `handlers/form_configurator.py`.

---

## ✅ Checklist de Implementación

- [ ] Crear `PARIDAD_VALUE_MAP` en `form_configurator.py`
- [ ] Actualizar `__init__` de `ForwardAutomationEngine` para recibir `paridades: List[str]`
- [ ] Cambiar estructura de resultados de `List[Dict]` a `Dict[fecha, Dict[paridad, Dict]]`
- [ ] Implementar `_execute_combinations()` con loop de paridades
- [ ] Implementar `_execute_iterations_for_combination(paridad)`
- [ ] Crear `guardar_resultados_excel_matriz()` en `ResultExtractor`
- [ ] Actualizar UI para incluir selector múltiple de paridades
- [ ] Validar que al menos 1 paridad esté seleccionada
- [ ] Probar con 2-3 paridades diferentes

---

**Arquitectura lista para implementar sistema de combinaciones! 🎯**
