"""
Mejoras propuestas para FileDownloader
Agregar estas funciones al archivo downloader.py
"""

def validate_download_completeness(self):
    """
    Valida que todas las descargas se completaron correctamente
    Retorna un reporte detallado de éxito/fallos
    """
    sessions = self.get_completed_downloads()
    
    # Categorizar sesiones
    successful = [s for s in sessions if s.status == "success"]
    failed = [s for s in sessions if s.status in ["failed", "invalid"]]
    
    # Log del resumen
    self.log(f"📊 RESUMEN DE DESCARGAS:", level="INFO")
    self.log(f"✅ Exitosas: {len(successful)}", level="INFO")
    self.log(f"❌ Fallidas: {len(failed)}", level="INFO" if len(failed) == 0 else "ERROR")
    
    # Detalles de fallos
    if failed:
        self.log("❌ DETALLES DE FALLOS:", level="ERROR")
        for session in failed:
            contract = session.metadata.get("contract_name", "unknown")
            reason = session.metadata.get("failure_reason", "unknown")
            self.log(f"  - {contract}: {reason}", level="ERROR")
    
    # Generar reporte
    self.tracker.export_report()
    
    return {
        "total": len(sessions),
        "successful": len(successful),
        "failed": len(failed),
        "success_rate": len(successful) / len(sessions) if sessions else 0,
        "all_successful": len(failed) == 0
    }

def count_expected_contracts(self):
    """
    Cuenta el número total de contratos esperados recorriendo todas las páginas
    """
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    
    wait = WebDriverWait(self.driver, 10)
    total_contracts = 0
    page = 1
    
    try:
        while True:
            # Ir a la página actual
            if page > 1:
                self._go_to_page(page)
            
            # Contar filas en la página actual
            table = wait.until(EC.presence_of_element_located((By.ID, "gridTable")))
            filas = table.find_elements(By.XPATH, ".//tbody/tr")
            contratos_pagina = len(filas)
            
            self.log(f"📊 Página {page}: {contratos_pagina} contratos", level="DEBUG")
            total_contracts += contratos_pagina
            
            # Verificar si hay más páginas
            paginadores = self.driver.find_elements(By.CSS_SELECTOR, ".pagination li")
            next_page_exists = False
            
            for li in paginadores:
                try:
                    a = li.find_element(By.TAG_NAME, "a")
                    if str(page + 1) in a.text and a.is_displayed() and a.is_enabled():
                        next_page_exists = True
                        break
                except Exception:
                    continue
            
            if not next_page_exists:
                break
                
            page += 1
            
        self.log(f"📊 Total contratos esperados: {total_contracts}", level="INFO")
        return total_contracts
        
    except Exception as e:
        self.log(f"❌ Error contando contratos esperados: {e}", level="ERROR")
        return -1  # Indicador de error

def enhanced_download_with_validation(self):
    """
    Versión mejorada del proceso de descarga con validación final
    """
    # 1. Contar archivos esperados
    expected_contracts = self.count_expected_contracts()
    expected_total = expected_contracts + 1  # +1 para el Excel principal
    
    self.log(f"🎯 Archivos esperados: {expected_total} (1 Excel + {expected_contracts} contratos)", level="INFO")
    
    # 2. Ejecutar descargas normales
    self.download_excel_file()
    
    # Proceso normal de contratos (páginas múltiples)
    # ... código existente ...
    
    # 3. Validación final
    validation_result = self.validate_download_completeness()
    
    # 4. Comparar esperados vs obtenidos
    if expected_total > 0:  # Solo si pudimos contar
        if validation_result["successful"] == expected_total:
            self.log("✅ PERFECTO: Todos los archivos descargados correctamente", level="EXITO")
        else:
            missing = expected_total - validation_result["successful"]
            self.log(f"❌ PROBLEMA: Faltan {missing} archivos de {expected_total}", level="ERROR")
    
    return validation_result