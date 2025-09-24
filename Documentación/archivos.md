# Documentación de Archivos de Descarga - MtM Bot

## Tipos de Archivos Excel Descargados

### 1. Archivo Excel Principal (Portfolio Forward)
- **Función**: `download_excel_file()` en `downloader.py`
- **Endpoint**: `excelPortfolioForward`
- **Nombre por defecto**: `portfolio_forward.xlsx`
- **Descripción**: Archivo Excel principal que contiene la cartera de forwards con valorización Mark-to-Market
- **Método de descarga**: 
  - Primario: Click en botón "Descargar en Excel" (clase `btn-primary-dark`)
  - Fallback: Request HTTP POST directo al endpoint `excelPortfolioForward`
- **Validación**: Extensiones `.xlsx`, `.xls`, `.xlsm` con magic bytes `PK\x03\x04` (ZIP header)

### 2. Archivos de Contrato Individuales
- **Función**: `download_contract_files()` en `downloader.py`
- **Proceso**: Se descargan desde la vista de detalle de cada contrato
- **Método de descarga**: 
  1. Click en menú de acciones (columna 18)
  2. Seleccionar "Editar"
  3. Click en "Descargar Contrato" en la vista de detalle
- **Tipos de archivo**: PDF, Excel, ZIP según el contrato
- **Validación**: Extensiones `.pdf`, `.xlsx`, `.zip` con validación de contenido

## Configuración de Validación (download_tracker.py)

### Reglas para Excel
```python
"excel": {
    "extensions": [".xlsx", ".xls", ".xlsm"],
    "magic": [b"PK\x03\x04"],  # ZIP header
    "min_size": 1024
}
```

### Reglas para Contratos
```python
"contract": {
    "extensions": [".pdf", ".xlsx", ".zip"],
    "magic": [b"%PDF", b"PK\x03\x04"],  # PDF header y ZIP header
    "min_size": 512
}
```

## Flujo de Descarga Completo

1. **Fase 1**: Descarga del Excel principal (`portfolio_forward.xlsx`)
   - Contiene resumen de la cartera de forwards
   - Un único archivo por ejecución

2. **Fase 2**: Descarga de contratos individuales
   - Se procesa cada fila de la tabla de contratos
   - Un archivo por contrato (formato variable: PDF/Excel/ZIP)
   - Se maneja paginación si hay múltiples páginas

## Tracking y Validación

- **Sistema de seguimiento**: `DownloadTracker` monitora descargas en tiempo real
- **Validación de contenido**: Magic bytes, extensión y tamaño mínimo
- **Fallback automático**: Si falla descarga por UI, intenta POST HTTP directo
- **Reporte**: Genera `mtm_download_report.json` con estadísticas de descarga

## Ubicación de Archivos

- **Directorio base**: Configurable por usuario en la GUI
- **Estructura**: Todos los archivos se guardan en el directorio seleccionado
- **Nombres**: 
  - Excel principal: `portfolio_forward.xlsx` (solo en fallback)
  - Contratos: Nombres originales del sistema

## ⚠️ LIMITACIÓN IMPORTANTE: Nomenclatura de Archivos

**El código actual NO tiene ninguna lógica para:**
- Detectar nombres de bancos (Scotiabank, Santander, BCI, etc.)
- Renombrar archivos según el banco
- Aplicar convenciones de nomenclatura específicas
- Identificar el contenido por banco

**Comportamiento real:**
- **Excel principal**: El navegador determina el nombre según sus configuraciones
- **Archivo fallback**: Se guarda como `portfolio_forward.xlsx` fijo
- **Contratos**: Mantienen el nombre original que viene del sistema web
- **Sin personalización**: No hay código que analice o modifique nombres por banco

**Para implementar nomenclatura por banco se requeriría:**
```python
# Código no existente - ejemplo de lo que faltaría:
def detect_bank_from_content(file_path):
    # Analizar contenido del Excel/PDF
    # Buscar indicadores de banco específico
    # Retornar nombre del banco
    
def rename_file_by_bank(original_path, bank_name):
    # Generar nuevo nombre con formato banco
    # Ej: "Scotiabank_MtM_2025-09-24.xlsx"
```

## Notas Técnicas

- **Performance logs**: Se usan para detectar descargas exitosas
- **Retry logic**: Múltiples estrategias de click (simple, hover, JS, doble click)
- **Timeout**: 20 segundos por descarga individual
- **Compatibilidad**: Soporta navegación en múltiples páginas de contratos