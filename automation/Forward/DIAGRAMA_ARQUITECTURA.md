# 🏗️ Diagrama de Arquitectura - Forward Automation

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ForwardAutomationEngine                          │
│                      (Orquestador - 300 líneas)                     │
│                                                                       │
│  Responsabilidades:                                                  │
│  • Coordinar flujo general                                          │
│  • Inicializar componentes                                          │
│  • NO hace cálculos ni UI directamente                              │
│                                                                       │
│  Flujo:                                                              │
│  1. _start_browser()                                                │
│  2. _init_components()                                              │
│  3. _perform_login()                                                │
│  4. _navigate_to_forward_section()                                  │
│  5. _execute_calculations() ← DELEGA TODO                          │
│  6. _save_results()                                                 │
└────────────┬─────────────┬──────────────┬───────────────────────────┘
             │             │              │
             │             │              │
     ┌───────▼──────┐  ┌──▼──────────┐  ┌▼────────────────┐
     │              │  │             │  │                 │
     │  Constants   │  │ Calculators │  │    Handlers     │
     │              │  │             │  │                 │
     └──────────────┘  └─────────────┘  └─────────────────┘
```

---

## 📦 Constants Package (Datos Puros)

```
constants/
├── __init__.py
└── feriados_chile.py

┌─────────────────────────────────────┐
│      feriados_chile.py              │
│         (35 líneas)                 │
├─────────────────────────────────────┤
│                                     │
│  FERIADOS_CHILE = [                │
│    datetime(2025, 10, 31), # ⚠️   │
│    datetime(2025, 11, 1),          │
│    ...                              │
│  ]                                  │
│                                     │
│  • Sin lógica                       │
│  • Solo datos                       │
│  • Fácil de actualizar              │
└─────────────────────────────────────┘
```

---

## 🧮 Calculators Package (Lógica de Negocio)

```
calculators/
├── __init__.py
├── date_calculator.py
└── iteration_calculator.py


┌──────────────────────────────────────────┐
│       DateCalculator                     │
│          (120 líneas)                    │
├──────────────────────────────────────────┤
│                                          │
│  + calcular_ultimo_dia_habil(fecha)     │
│  + es_dia_habil(fecha) → bool           │
│  + es_weekend(fecha) → bool              │
│  + es_feriado(fecha) → bool              │
│                                          │
│  Usa:                                    │
│  • FERIADOS_CHILE (constants)            │
│  • monthrange, weekday (stdlib)          │
│                                          │
│  Ventajas:                               │
│  • 100% testeable sin UI                 │
│  • Reutilizable                          │
│  • SRP puro                              │
└──────────────────────────────────────────┘
             │
             │ usa
             ▼
┌──────────────────────────────────────────┐
│     IterationCalculator                  │
│          (130 líneas)                    │
├──────────────────────────────────────────┤
│                                          │
│  + calcular_numero_iteraciones()         │
│  + calcular_mes_iteracion(i) → datetime │
│  - _parsear_mes_vencimiento()            │
│                                          │
│  Usa:                                    │
│  • DateCalculator (para último día)      │
│  • relativedelta (dateutil)              │
│                                          │
│  Lógica de negocio:                      │
│  • Si día_inicio <= último_hábil → +1    │
│  • Calcular mes base correcto            │
└──────────────────────────────────────────┘
```

---

## 🎮 Handlers Package (UI & Extracción)

```
handlers/
├── __init__.py
├── calendar_handler.py
├── form_configurator.py
└── result_extractor.py


┌──────────────────────────────────────────┐
│       CalendarHandler                    │
│          (160 líneas)                    │
├──────────────────────────────────────────┤
│                                          │
│  + configurar_fecha(xpath, fecha, nom)  │
│  + navegar_a_fecha(fecha)                │
│  + seleccionar_dia(dia)                  │
│                                          │
│  Maneja:                                 │
│  • my-date-picker calendar               │
│  • Navegación mes/año                    │
│  • Click en día (focus + click)          │
│                                          │
│  Dependencias:                           │
│  • Selenium WebDriver                    │
└──────────────────────────────────────────┘
             │
             │ usado por
             ▼
┌──────────────────────────────────────────┐
│      FormConfigurator                    │
│          (120 líneas)                    │
├──────────────────────────────────────────┤
│                                          │
│  + configurar_paridad(paridad)           │
│  + configurar_fecha_inicio(fecha)        │
│  + configurar_fecha_valoracion(fecha)    │
│  + configurar_fecha_vencimiento(fecha)   │
│  + click_calcular()                      │
│                                          │
│  XPaths (constantes de clase):           │
│  • PARIDAD_XPATH                         │
│  • FECHA_INICIO_XPATH                    │
│  • FECHA_VALORACION_XPATH                │
│  • FECHA_VENCIMIENTO_XPATH               │
│  • CALCULAR_XPATH                        │
│                                          │
│  Usa:                                    │
│  • CalendarHandler (delegación)          │
│  • Selenium Select (dropdown)            │
└──────────────────────────────────────────┘


┌──────────────────────────────────────────┐
│       ResultExtractor                    │
│          (130 líneas)                    │
├──────────────────────────────────────────┤
│                                          │
│  + extraer_resultados(mes) → Dict        │
│  + guardar_resultados_excel(results)     │
│  - _extraer_valor(xpath) → str           │
│                                          │
│  Extrae:                                 │
│  • Precio Spot Bid                       │
│  • Puntos Forward Bid                    │
│                                          │
│  Guarda:                                 │
│  • DataFrame (pandas)                    │
│  • Excel (.xlsx)                         │
│                                          │
│  Estructura resultado:                   │
│  {                                       │
│    "mes": "Enero",                       │
│    "año": 2025,                          │
│    "mes_numero": 1,                      │
│    "precio_spot_bid": "958,35",          │
│    "puntos_forward_bid": "123,45"        │
│  }                                       │
└──────────────────────────────────────────┘
```

---

## 🔄 Flujo de Ejecución Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER CALL                                │
│                                                                 │
│  engine = ForwardAutomationEngine(                              │
│      fecha_inicio=datetime(2025, 10, 1),                        │
│      mes_vencimiento="Diciembre 2025",                          │
│      directorio_salida="./output",                              │
│      log_callback=log_func                                      │
│  )                                                              │
│  engine.start()                                                 │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ENGINE START()                               │
└───────────────────────┬─────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
  ┌──────────┐   ┌──────────┐   ┌──────────┐
  │ Browser  │   │  Login   │   │ Navigate │
  └──────────┘   └──────────┘   └──────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│              INIT COMPONENTS (Lazy Init)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  self.date_calc = DateCalculator(log)                          │
│  self.iter_calc = IterationCalculator(log, date_calc)          │
│  self.form_config = FormConfigurator(driver, log)              │
│  self.result_extractor = ResultExtractor(driver, log)          │
│                                                                 │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│              EXECUTE CALCULATIONS (Iteraciones)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. num_iter = iter_calc.calcular_numero_iteraciones(...)      │
│     └─> DateCalculator.calcular_ultimo_dia_habil(mes_inicio)   │
│         └─> Valida feriados (31 Oct 2025 ⚠️)                   │
│                                                                 │
│  2. CONFIGURACIÓN INICIAL (UNA VEZ):                           │
│     • form_config.configurar_paridad()                          │
│     • form_config.configurar_fecha_inicio()                     │
│       └─> CalendarHandler.configurar_fecha(...)                │
│     • form_config.configurar_fecha_valoracion()                 │
│       └─> CalendarHandler.configurar_fecha(...)                │
│                                                                 │
│  3. FOR i in range(1, num_iter + 1):                           │
│                                                                 │
│     a) mes_actual = iter_calc.calcular_mes_iteracion(i)        │
│                                                                 │
│     b) fecha_venc = date_calc.calcular_ultimo_dia_habil(mes)   │
│        └─> Valida feriados/weekends                            │
│                                                                 │
│     c) form_config.configurar_fecha_vencimiento(fecha_venc)    │
│        └─> CalendarHandler.configurar_fecha(...)               │
│                                                                 │
│     d) form_config.click_calcular()                            │
│                                                                 │
│     e) resultado = result_extractor.extraer_resultados(mes)    │
│        └─> Extrae Precio Spot Bid, Puntos Forward Bid          │
│                                                                 │
│     f) resultados.append(resultado)                            │
│                                                                 │
│  END FOR                                                        │
│                                                                 │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SAVE RESULTS                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  result_extractor.guardar_resultados_excel(                     │
│      resultados,                                                │
│      directorio_salida                                          │
│  )                                                              │
│                                                                 │
│  Crea: forward_resultados_YYYYMMDD_HHMMSS.xlsx                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔗 Diagrama de Dependencias

```
                    ForwardAutomationEngine
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
        ▼                   ▼                    ▼
  BrowserManager      LoginHandler    [Componentes Propios]
   (shared)            (shared)              │
                                    ┌─────────┼─────────┐
                                    │         │         │
                                    ▼         ▼         ▼
                            DateCalculator  FormConfig  ResultExtractor
                                    │         │             │
                                    │         ▼             │
                                    │    CalendarHandler    │
                                    │                       │
                                    └───────────┬───────────┘
                                                │
                                                ▼
                                        IterationCalculator
                                                │
                                                │ usa
                                                ▼
                                        DateCalculator
                                                │
                                                │ usa
                                                ▼
                                         FERIADOS_CHILE
                                          (constants)
```

---

## 📊 Diagrama de Flujo de Datos

```
┌──────────────┐
│  User Input  │
│              │
│ fecha_inicio │───┐
│ mes_venc     │   │
│ directorio   │   │
└──────────────┘   │
                   │
                   ▼
         ┌────────────────┐
         │ Engine.__init__│
         └────────┬───────┘
                  │
                  ▼
         ┌────────────────────┐
         │ _init_components() │
         └────────┬───────────┘
                  │
      ┌───────────┼────────────┐
      │           │            │
      ▼           ▼            ▼
 DateCalc    IterCalc    FormConfig
      │           │            │
      │           └─────┬──────┘
      │                 │
      ▼                 ▼
 último_día_hábil   num_iteraciones
      │                 │
      │                 │
      │       ┌─────────┴──────────┐
      │       │                    │
      │       ▼                    ▼
      │   mes_iteracion_1    mes_iteracion_n
      │       │                    │
      │       ├────────────────────┤
      │       │                    │
      └───────┼────────────────────┘
              │
              ▼
         fecha_vencimiento
              │
              ▼
     FormConfig.configurar()
              │
              ▼
     FormConfig.click_calcular()
              │
              ▼
   ResultExtractor.extraer_resultados()
              │
              ▼
         resultados[]
              │
              ▼
   ResultExtractor.guardar_excel()
              │
              ▼
     ┌────────────────┐
     │  Excel File    │
     │  (.xlsx)       │
     └────────────────┘
```

---

## 🎯 Beneficios Visuales

```
ANTES (Monolítico):
┌────────────────────────────────────┐
│  ForwardAutomationEngine           │
│  (815 líneas - TODO mezclado)      │
│                                    │
│  • Cálculos                        │
│  • UI                              │
│  • Lógica de negocio               │
│  • Extracción                      │
│  • Guardado                        │
│  • Navegación                      │
│  • ...                             │
│                                    │
│  ❌ Imposible de testear           │
│  ❌ Difícil de mantener            │
│  ❌ Acoplamiento alto              │
└────────────────────────────────────┘


DESPUÉS (Modular):
┌─────────────────────────────────────────────────────┐
│         ForwardAutomationEngine                     │
│         (Orquestador - 300 líneas)                  │
│                                                     │
│  ✅ Solo coordina                                  │
│  ✅ Fácil de entender                              │
│  ✅ Bajo acoplamiento                              │
└──────┬────────┬────────┬────────┬─────────────────┘
       │        │        │        │
       ▼        ▼        ▼        ▼
   ┌────────┐┌────┐┌────────┐┌────────┐
   │  Date  ││Iter││  Form  ││Result  │
   │  Calc  ││Calc││ Config ││Extract │
   └────────┘└────┘└────────┘└────────┘
       │        │        │        │
       ▼        ▼        ▼        ▼
   ✅ Test   ✅ Test ✅ Test  ✅ Test
   ✅ Reuse  ✅ Reuse ✅ Reuse ✅ Reuse
```

---

## 📈 Métricas de Complejidad

```
Complejidad Ciclomática (por archivo):

ANTES:
forward_automation_engine.py: ████████████████████ (20+)

DESPUÉS:
forward_automation_engine.py:  ████████ (8)
date_calculator.py:             ██████ (6)
iteration_calculator.py:        █████ (5)
calendar_handler.py:            ███████ (7)
form_configurator.py:           ████ (4)
result_extractor.py:            █████ (5)

Promedio: 5.8 (vs 20+ antes) = 71% mejora ✅
```

---

## 🎓 Patrones de Diseño Aplicados

1. **Strategy Pattern**: Diferentes calculadores intercambiables
2. **Facade Pattern**: Engine esconde complejidad de componentes
3. **Dependency Injection**: Componentes reciben dependencias en __init__
4. **Single Responsibility**: Cada clase tiene una razón para cambiar
5. **Separation of Concerns**: UI != Lógica != Datos

---

**Arquitectura modular completada! 🎉**
