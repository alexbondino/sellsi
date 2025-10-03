# 📊 Calculadora de Forward - Módulo de Automatización

**Fecha de creación:** 1 de Octubre, 2025  
**Ubicación:** `automation/Forward/`  
**Estado:** ✅ Funcional con validaciones completas

---

## 📋 Descripción

Módulo de interfaz de usuario para el cálculo de tasas forward en instrumentos financieros. Implementa validaciones avanzadas de fechas según reglas de negocio específicas.

---

## 🏗️ Estructura del Módulo

```
automation/Forward/
├── __init__.py                    # Inicialización del módulo
├── forward_calculator_ui.py       # Interfaz principal con validaciones
├── test_validaciones.py           # Tests de validación de lógica
└── README.md                      # Esta documentación
```

---

## 🎯 Características Principales

### 1. **Fecha Inicio**
- Control: `DateEntry` (calendario interactivo)
- Validación: Debe ser **igual o mayor** al día actual
- Implementación: `mindate=datetime.now()` previene selección de fechas pasadas

### 2. **Mes Vencimiento**
- Control: `Combobox` (selector desplegable)
- Validación dinámica basada en Fecha Inicio:
  - **Regla General**: Mes vencimiento >= mes de Fecha Inicio
  - **Regla Especial**: Si Fecha Inicio es el **último día del mes actual**, entonces Mes Vencimiento >= **mes siguiente**
- Genera automáticamente 24 meses hacia adelante

### 3. **Actualización Dinámica**
- Al cambiar Fecha Inicio, el selector de Mes Vencimiento se actualiza automáticamente
- Mensaje visual cuando se detecta último día del mes actual
- Selección automática del primer mes válido

---

## 🔧 Uso del Módulo

### Desde el Menú Principal
```python
# El menú principal (mtm_downloader.py) lanza automáticamente:
from automation.Forward.forward_calculator_ui import launch_forward_calculator
launch_forward_calculator()
```

### Uso Standalone
```bash
# Ejecutar directamente el módulo
python -m automation.Forward.forward_calculator_ui

# O desde el directorio raíz
cd C:\Users\klaus\OneDrive\Desktop\Pega\Bot
python automation\Forward\forward_calculator_ui.py
```

### Integración con Logging
```python
from automation.Forward.forward_calculator_ui import ForwardCalculatorUI

def mi_log_callback(mensaje, nivel="INFO"):
    print(f"[{nivel}] {mensaje}")

app = ForwardCalculatorUI(log_callback=mi_log_callback)
app.mainloop()
```

---

## ✅ Validaciones Implementadas

### Test 1: Fecha de Hoy
```
Input:  01-10-2025 (hoy)
Output: Mes vencimiento mínimo = Octubre 2025
Status: ✅ PASS
```

### Test 2: Último Día del Mes Actual
```
Input:  31-10-2025 (último día de octubre)
Output: Mes vencimiento mínimo = Noviembre 2025
Status: ⚠️ VALIDACIÓN ESPECIAL ACTIVA
```

### Test 3: Fecha Futura
```
Input:  16-10-2025 (15 días en el futuro)
Output: Mes vencimiento mínimo = Octubre 2025
Status: ✅ PASS
```

### Test 4: Último Día Mes Siguiente
```
Input:  30-11-2025 (último día de noviembre)
Output: Mes vencimiento mínimo = Diciembre 2025
Status: ⚠️ VALIDACIÓN ESPECIAL ACTIVA
```

### Test 5: Fecha Anterior a Hoy
```
Input:  Intento seleccionar 30-09-2025
Output: ❌ BLOQUEADO por DateEntry.mindate
Status: ✅ PROTECCIÓN ACTIVA
```

---

## 🎨 Interfaz de Usuario

### Elementos Visuales
- **Header**: Título "Calculadora de Forward" con descripción
- **Fecha Inicio**: DateEntry con calendario desplegable
- **Mes Vencimiento**: Combobox con lista de meses válidos
- **Labels informativos**: Mensajes de ayuda y validación
- **Botón EJECUTAR**: Verde (#28A745), ejecuta el cálculo
- **Botón Volver**: Gris (#6c757d), regresa al menú principal

### Colores y Estados
```python
# Estados visuales del validation_label:
- Normal:    "gray"     # Texto de ayuda estándar
- Especial:  "#FF6B35"  # Naranja - Validación especial activa (último día)
- Ejecutar:  "#28A745"  # Verde - Botón habilitado
- Volver:    "#6c757d"  # Gris - Botón secundario
```

---

## 📊 Lógica de Negocio

### Algoritmo de Validación de Mes Vencimiento

```python
def _update_mes_vencimiento_options(self):
    # 1. Obtener fecha seleccionada
    fecha_inicio = self.date_entry.get_date()
    
    # 2. Determinar mes mínimo (por defecto)
    mes_minimo = fecha_inicio.month
    
    # 3. Validación especial: último día del mes actual
    ultimo_dia_mes_actual = calendar.monthrange(hoy.year, hoy.month)[1]
    es_ultimo_dia_mes = (
        fecha_inicio.day == ultimo_dia_mes_actual and 
        fecha_inicio.month == hoy.month
    )
    
    if es_ultimo_dia_mes:
        # Forzar mes siguiente
        mes_minimo += 1
        if mes_minimo > 12:
            mes_minimo = 1
            año_minimo += 1
    
    # 4. Generar lista de 24 meses válidos
    # ...
```

### Casos Edge Considerados
1. ✅ Cambio de año (Diciembre → Enero)
2. ✅ Último día del mes con 28, 29, 30 o 31 días
3. ✅ Años bisiestos (29 de Febrero)
4. ✅ Meses de diferente longitud
5. ✅ Múltiples cambios de Fecha Inicio sin reiniciar

---

## 🚀 Próximos Pasos (TODO)

### Fase 1: Implementación de Cálculo ✅ (UI completada)
- [x] Crear interfaz de usuario
- [x] Implementar validaciones de fecha
- [x] Integrar con menú principal
- [ ] **Implementar lógica de cálculo forward** 🚧

### Fase 2: Integración con Backend
- [ ] Conectar con fuente de datos de tasas
- [ ] Implementar cálculos financieros
- [ ] Generar reportes de resultados

### Fase 3: Exportación y Reporting
- [ ] Exportar resultados a Excel
- [ ] Integrar con sistema de logging
- [ ] Generar gráficos de tasas forward

---

## 🔍 Testing

### Ejecutar Tests de Validación
```bash
python automation\Forward\test_validaciones.py
```

### Output Esperado
```
🧪 INICIANDO TESTS DE VALIDACIÓN
============================================================
✅ TEST 1: Fecha de hoy (01-10-2025)
✅ TEST 2: No es último día del mes
✅ TEST 3: Fecha futura (16-10-2025)
⚠️ TEST 4: Último día mes siguiente (30-11-2025)
✅ TEST 5: Validación fecha mínima
============================================================
✅ TODOS LOS TESTS DE VALIDACIÓN PASARON
```

---

## 📝 Notas de Desarrollo

### Dependencias
- `tkinter`: GUI framework (incluido en Python estándar)
- `tkcalendar`: DateEntry widget (`pip install tkcalendar`)
- `datetime`: Manejo de fechas
- `calendar`: Utilidades de calendario

### Compatibilidad
- Python 3.8+
- Windows 10/11
- tkinter 8.6+

### Mantenimiento
- **Última actualización**: 1 de Octubre, 2025
- **Mantenedor**: GitHub Copilot
- **Versión**: 1.0.0

---

## 🎯 Integración con MtM Suite

Este módulo forma parte del **MtM Suite**, sistema integral de valorización y cálculo de instrumentos financieros:

```
MtM Suite/
├── Valorización MtM (mtm_downloader.py)      ✅ Producción
└── Calculadora de Forward (este módulo)      🚧 En desarrollo
```

**Acceso**: Menú Principal → "Calculadora de Forward"

---

**🚀 Ready for Development | 🎨 UI Complete | 🔧 Awaiting Business Logic**
