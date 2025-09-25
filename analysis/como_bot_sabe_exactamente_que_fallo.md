# 🔍 ANÁLISIS TÉCNICO: ¿Cómo el Bot Sabe Exactamente Qué Falló y Dónde?

**Pregunta Crítica:** *"como el bot podira saber: 1) Exactamente cual de todos fallos 2) Navegar a ese especificamente para poder descargarlo nuevamente"*

---

## 📊 1. TRACKING GRANULAR - Cómo el Bot "Recuerda" Todo

### 1.1 Sistema de Metadata en Cada Descarga

Cada vez que el bot intenta descargar un archivo, guarda **metadatos específicos**:

```python
# En downloader.py - línea ~180
session = self._start_tracking_session(
    "contract",
    {
        "contract_name": nombre_archivo,    # "Scotiabank N°3"
        "row": str(idx),                    # "4" 
        "page": str(page_number or 1),      # "2"
        "source": "contract_download",      # Tipo de descarga
        "table_position": f"page_{page}_row_{idx}"  # Posición única
    }
)
```

**Resultado:** El bot guarda exactamente:
- 📝 **Nombre del contrato**: "Scotiabank N°3" 
- 📍 **Página exacta**: "2"
- 📍 **Fila exacta**: "4"  
- ⏰ **Timestamp**: Cuándo falló
- 🚫 **Razón del fallo**: "click_failed", "timeout", etc.

### 1.2 Ejemplo Real de Datos Guardados

```json
{
  "session_id": "20250924_142315_003",
  "download_type": "contract", 
  "status": "failed",
  "metadata": {
    "contract_name": "Scotiabank N°3",
    "row": "4",
    "page": "2", 
    "failure_reason": "menu_open_failed"
  },
  "started_at": "2025-09-24T14:23:15.123Z",
  "attempts": 3
}
```

**El bot SIEMPRE sabe exactamente:** 
- ✅ Qué archivo falló: "Scotiabank N°3"
- ✅ En qué página: "2" 
- ✅ En qué fila: "4"
- ✅ Por qué falló: "menu_open_failed"

---

## 🧭 2. NAVEGACIÓN EXACTA - Cómo Regresa al Punto Específico

### 2.1 Proceso de Navegación Paso a Paso

```python
def _retry_specific_contract(self, contract_name: str, page: int, row: int):
    """
    🎯 Navegación quirúrgica a posición exacta
    """
    
    # PASO 1: Navegar a la página correcta
    self._navigate_to_page(page)  # Va a página 2
    
    # PASO 2: Esperar que la tabla se cargue
    wait = WebDriverWait(driver, 10)
    table = wait.until(EC.presence_of_element_located((By.ID, "gridTable")))
    
    # PASO 3: Localizar la fila específica
    filas = table.find_elements(By.XPATH, ".//tbody/tr")
    fila_objetivo = filas[row - 1]  # Fila 4 = índice 3
    
    # PASO 4: Localizar la columna 18 (menú de acciones)
    columnas = fila_objetivo.find_elements(By.XPATH, ".//th | .//td")
    col18 = columnas[17]  # Columna 18 = índice 17
    
    # PASO 5: Reintentar descarga en esa posición exacta
    return self._enhanced_contract_download(col18, contract_name)
```

### 2.2 Método de Navegación a Página Específica

```python
def _navigate_to_page(self, page_number: int) -> bool:
    """
    🔄 Navega exactamente a la página donde falló
    """
    
    # Buscar botones de paginación
    paginadores = self.driver.find_elements(By.CSS_SELECTOR, ".pagination li")
    
    for li in paginadores:
        try:
            a = li.find_element(By.TAG_NAME, "a")
            # ¿Es el número de página que buscamos?
            if str(page_number) in a.text and a.is_displayed():
                a.click()
                self.log(f"[Recovery] ✅ Navegando a página {page_number}")
                time.sleep(2)  # Esperar carga
                return True
        except:
            continue
    
    return False
```

---

## 💡 3. EJEMPLO CONCRETO - Caso Real de Recovery

### 3.1 Escenario: Falló "BCI N°1" en Página 2, Fila 2

**LO QUE FALLÓ ORIGINALMENTE:**
```
[14:25:30] [Contrato: BCI N°1] Procesando fila 2 de 6 en página 2
[14:25:32] [Contrato: BCI N°1] Click simple en menú Col 18 OK  
[14:25:33] [Contrato: BCI N°1] ❌ No se pudo abrir menú en Col 18
[14:25:33] [ERROR] Sesión contract_002 marcada como fallida (menu_open_failed)
```

**DATOS GUARDADOS POR EL BOT:**
```json
{
  "session_id": "contract_002",
  "contract_name": "BCI N°1", 
  "page": "2",
  "row": "2",
  "failure_reason": "menu_open_failed",
  "column_failed": "18"
}
```

**RECOVERY AUTOMÁTICO:**
```python
# El sistema de recovery lee los datos guardados
failed_contract = {
    "name": "BCI N°1",
    "page": 2, 
    "row": 2,
    "reason": "menu_open_failed"
}

# 🎯 NAVEGACIÓN EXACTA
self._navigate_to_page(2)           # → Va a página 2
time.sleep(2)                       # → Espera carga
table = driver.find_element("gridTable")  # → Localiza tabla
filas = table.find_elements("tr")   # → Obtiene todas las filas
fila_2 = filas[1]                   # → Selecciona fila 2 (índice 1)
col_18 = fila_2.find_elements("td")[17]  # → Localiza columna 18

# 🔄 REINTENTO CON TÉCNICAS MEJORADAS
# Como falló "menu_open_failed", usa técnicas alternativas:
try:
    # Técnica 1: Hover + Click (más lento pero más confiable)
    actions.move_to_element(menu_btn).pause(1.0).click().perform()
except:
    # Técnica 2: JavaScript click (evita problemas de overlay)  
    driver.execute_script("arguments[0].click();", menu_btn)
except:
    # Técnica 3: Scroll + wait + retry
    driver.execute_script("arguments[0].scrollIntoView();", menu_btn)
    time.sleep(2)
    menu_btn.click()
```

---

## 🔍 4. VALIDACIÓN DE POSICIÓN CORRECTA

### 4.1 ¿Cómo Sabe Que Está en la Fila Correcta?

```python
def _validate_correct_position(self, fila_element, expected_contract_name):
    """
    ✅ Verifica que estamos en la fila correcta antes de reintentar
    """
    
    # Leer el nombre del contrato en columna 5 (nombre)
    columnas = fila_element.find_elements(By.XPATH, ".//td")
    nombre_en_fila = columnas[4].text.strip()  # Columna 5 = índice 4
    
    # ¿Coincide con lo que esperamos?
    if expected_contract_name.lower() in nombre_en_fila.lower():
        self.log(f"✅ Posición correcta: {nombre_en_fila}")
        return True
    else:
        self.log(f"⚠️ Posición incorrecta: esperado '{expected_contract_name}', encontrado '{nombre_en_fila}'")
        return False
```

### 4.2 Sistema de Fallback si Cambia la Estructura

```python
def _find_contract_by_name_fallback(self, contract_name):
    """
    🔍 Si las posiciones cambiaron, busca por nombre en toda la tabla
    """
    
    table = self.driver.find_element(By.ID, "gridTable")
    all_rows = table.find_elements(By.XPATH, ".//tbody/tr")
    
    for idx, row in enumerate(all_rows):
        columnas = row.find_elements(By.XPATH, ".//td")
        if len(columnas) >= 5:
            nombre_en_fila = columnas[4].text.strip()
            if contract_name.lower() in nombre_en_fila.lower():
                self.log(f"🔍 Contrato encontrado por nombre en nueva posición: fila {idx+1}")
                return idx + 1, row  # Nueva posición
    
    return None, None  # No encontrado
```

---

## ⚙️ 5. TÉCNICAS MEJORADAS DE DESCARGA EN RECOVERY

### 5.1 ¿Por Qué Falló la Primera Vez?

Analizando los **failure_reason** más comunes:

| Razón de Fallo | Causa Probable | Técnica de Recovery |
|----------------|----------------|-------------------|
| `menu_open_failed` | Click demasiado rápido | Hover + pause + click |
| `timeout` | Red lenta/archivo grande | Aumentar timeout 20s → 45s |
| `editar_option_not_found` | Menu no se cargó completo | Wait + re-scan del DOM |
| `download_button_not_found` | Vista detalle no cargó | Refresh + re-navegar |
| `click_failed` | Elemento oculto/overlay | JavaScript click directo |

### 5.2 Recovery Adaptativo por Tipo de Fallo

```python
def _enhanced_contract_download(self, col18_element, contract_name, session):
    """
    📥 Descarga con técnicas adaptativas según fallo previo
    """
    
    # Analizar fallo previo para adaptar estrategia
    previous_failure = session.metadata.get("failure_reason", "unknown")
    
    if previous_failure == "menu_open_failed":
        # Usar técnica más lenta pero confiable
        self._slow_reliable_menu_open(col18_element)
        
    elif previous_failure == "timeout":
        # Aumentar timeout significativamente  
        self.ENHANCED_WAIT_SECONDS = 45  # vs 10 normal
        
    elif previous_failure == "click_failed":
        # Usar solo JavaScript clicks
        self._js_only_clicks(col18_element)
    
    # Proceder con descarga usando técnica específica...
```

---

## 🎯 6. EJEMPLO COMPLETO: Recovery de Principio a Fin

### Situación: 
- **Original**: 13 descargas iniciadas
- **Resultado**: 10 exitosas, 3 fallidas
- **Fallidas**: "Scotiabank N°3" (Pág.2, Fila 4), "BCI N°1" (Pág.2, Fila 2), "Santander N°2" (Pág.1, Fila 7)

### Recovery Automático:

```python
# 📊 PASO 1: Validación identifica las fallidas
validation_report = validator.validate_complete_download()
# Result: missing_count = 3, failed_sessions = [session1, session2, session3]

# 🧠 PASO 2: Decide estrategia = "selective_retry" 
recovery_plan = decision_engine.decide_recovery_strategy(validation_report)

# 🔄 PASO 3: Recovery ejecuta reintentos selectivos
for failed_session in validation_report.failed_sessions:
    
    # Extraer datos guardados
    contract_name = failed_session.metadata["contract_name"]  # "BCI N°1"
    page = int(failed_session.metadata["page"])              # 2  
    row = int(failed_session.metadata["row"])                # 2
    
    # 🧭 Navegar exactamente a esa posición
    self._navigate_to_page(page)        # → Ir a página 2
    
    # 🎯 Localizar fila específica  
    table = self.driver.find_element(By.ID, "gridTable")
    filas = table.find_elements(By.XPATH, ".//tbody/tr")
    fila_objetivo = filas[row - 1]      # → Fila 2 (índice 1)
    
    # ✅ Validar posición correcta
    if self._validate_correct_position(fila_objetivo, contract_name):
        # 🔄 Reintentar con técnicas mejoradas
        success = self._enhanced_contract_download(fila_objetivo, contract_name, failed_session)
        
        if success:
            self.log(f"✅ {contract_name} recuperado exitosamente")
        else:
            self.log(f"❌ No se pudo recuperar {contract_name}")
```

**Resultado Esperado:**
```
[14:30:15] 🔄 Iniciando reintento selectivo...
[14:30:16] 🎯 Reintentando: BCI N°1 (Página 2, Fila 2)
[14:30:17] ✅ Posición correcta: BCI N°1 
[14:30:18] 🔄 Usando técnica mejorada: hover_click_slow
[14:30:21] ✅ BCI N°1 recuperado exitosamente
[14:30:22] 🎯 Reintentando: Scotiabank N°3 (Página 2, Fila 4)  
[14:30:23] ✅ Scotiabank N°3 recuperado exitosamente
[14:30:24] 📊 Recovery selectivo: 2/3 archivos (66.7%)
```

---

## 🧠 7. RESPUESTA DIRECTA A TU PREGUNTA

### **1) ¿Cómo sabe exactamente cuál falló?**

✅ **Metadata granular guardada en cada intento:**
```python
# El bot guarda esto para CADA archivo:
{
    "contract_name": "BCI N°1",      # Nombre exacto
    "page": "2",                     # Página específica  
    "row": "2",                      # Fila específica
    "failure_reason": "timeout",     # Razón específica del fallo
    "column_failed": "18",           # Columna donde falló
    "timestamp": "14:25:33"          # Cuándo falló
}
```

### **2) ¿Cómo navega específicamente a ese lugar?**

✅ **Navegación quirúrgica paso a paso:**
```python
# 1. Va a la página exacta
self._navigate_to_page(2)  # Click en botón "2" de paginación

# 2. Localiza la tabla
table = driver.find_element(By.ID, "gridTable") 

# 3. Cuenta filas y va a la específica  
filas = table.find_elements("tr")
fila_objetivo = filas[1]  # Fila 2 = índice 1

# 4. Localiza la columna de acciones
col18 = fila_objetivo.find_elements("td")[17]  # Col 18 = índice 17

# 5. Reintenta con técnica mejorada específica para ese tipo de fallo
```

**Resultado:** El bot puede navegar exactamente al pixel donde falló y reintentar con la técnica más apropiada para ese tipo específico de fallo.

¿Te queda claro cómo el sistema puede localizar exactamente qué falló y volver a esa posición específica? 🎯
