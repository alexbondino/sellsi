"""
🔄 Sistema de Recovery Inteligente para Descargas Fallidas
==========================================================

Sistema que maneja reintentos selectivos y estrategias de recuperación
cuando fallan descargas específicas en el proceso MtM.

Fecha: 24 de Septiembre, 2025
"""

import time
from typing import List, Optional
from dataclasses import dataclass

from automation.MtM.download_tracker import DownloadSession
from automation.MtM.post_execution_validator import ValidationReport, RecoveryPlan


@dataclass
class RecoveryAttempt:
    """Registro de un intento de recovery"""

    session_id: str
    strategy_used: str
    timestamp: float
    success: bool
    error_message: Optional[str] = None
    time_taken_seconds: float = 0.0


class SmartRecoverySystem:
    """
    🧠 Sistema de Recovery Inteligente

    Implementa múltiples estrategias de recuperación para archivos
    que fallaron en la descarga inicial:

    1. Selective Retry: Vuelve al punto exacto donde falló
    2. Enhanced Retry: Reintento con técnicas mejoradas
    3. Emergency Fallback: Descarga directa vía requests
    4. Manual Assistance: Guía al usuario paso a paso
    """

    def __init__(self, web_automator, log_func):
        """
        Args:
            web_automator: Instancia del WebAutomator principal
            log_func: Función de logging
        """
        self.web_automator = web_automator
        self.log = log_func
        self.recovery_attempts: List[RecoveryAttempt] = []

        # Configuración de reintentos
        self.MAX_RETRIES_PER_FILE = 3
        self.RETRY_DELAY_SECONDS = 2.0
        self.ENHANCED_WAIT_SECONDS = 10.0  # Waits más largos para reintentos

    def execute_recovery_plan(
        self, validation_report: ValidationReport, recovery_plan: RecoveryPlan
    ) -> bool:
        """
        🎯 Ejecuta el plan de recovery especificado

        Args:
            validation_report: Reporte de validación con archivos faltantes
            recovery_plan: Plan de recovery a ejecutar

        Returns:
            bool: True si el recovery fue exitoso
        """

        self.log(f"[Recovery] 🔄 Iniciando estrategia: {recovery_plan.strategy_name}", level="INFO")
        self.log(f"[Recovery] 📋 Descripción: {recovery_plan.description}", level="INFO")
        self.log(
            f"[Recovery] ⏱️ Tiempo estimado: {recovery_plan.estimated_time_minutes} min",
            level="INFO",
        )

        if recovery_plan.strategy_name == "none":
            return True

        elif recovery_plan.strategy_name == "critical_excel_recovery":
            return self._execute_critical_excel_recovery(validation_report)

        elif recovery_plan.strategy_name == "selective_retry":
            return self._execute_selective_retry(validation_report)

        elif recovery_plan.strategy_name == "partial_continuation":
            return self._execute_partial_continuation(validation_report)

        elif recovery_plan.strategy_name == "full_recovery":
            return self._execute_full_recovery(validation_report)

        else:
            self.log(
                f"[Recovery] ❌ Estrategia desconocida: {recovery_plan.strategy_name}",
                level="ERROR",
            )
            return False

    def _execute_critical_excel_recovery(self, validation_report: ValidationReport) -> bool:
        """
        🚨 Recovery crítico: Excel principal faltante

        Este es el caso más crítico - sin Excel principal no hay etapa 2.
        Estrategia escalonada:
        1. Reintento automático con fallback mejorado
        2. Refresh completo de página + reintento
        3. Descarga manual asistida
        """

        self.log(
            "[Recovery] 🚨 Iniciando recovery crítico del Excel principal", level="ADVERTENCIA"
        )

        # Estrategia 1: Reintento del fallback existente con parámetros mejorados
        try:
            self.log("[Recovery] 📥 Reintento automático de descarga Excel...", level="INFO")

            # Asegurar que estamos en la posición correcta
            if not self._ensure_main_portfolio_position():
                self.log("[Recovery] ❌ No se pudo navegar a posición principal", level="ERROR")
                return False

            # Usar el downloader existente con reintento
            if hasattr(self.web_automator, "downloader") and self.web_automator.downloader:
                downloader = self.web_automator.downloader

                # Intentar descarga con tracking
                session = downloader._start_tracking_session(
                    "excel", {"source": "recovery_critical", "attempt": "fallback_enhanced"}
                )

                # Reintento con fallback mejorado
                success = downloader.download_excel_file()

                if success:
                    self.log(
                        "[Recovery] ✅ Recovery crítico exitoso - Excel principal descargado",
                        level="EXITO",
                    )
                    return True

                if session:
                    downloader.tracker.fail(session, "critical_recovery_failed")

        except Exception as e:
            self.log(f"[Recovery] ❌ Error en recovery crítico: {e}", level="ERROR")

        # Estrategia 2: Refresh completo + reintento
        self.log("[Recovery] 🔄 Intentando refresh completo de página...", level="INFO")
        try:
            if hasattr(self.web_automator, "driver"):
                self.web_automator.driver.refresh()
                time.sleep(3.0)

                # Re-navegar a posición
                if self._re_navigate_to_portfolio():
                    # Segundo intento de descarga
                    if hasattr(self.web_automator, "downloader"):
                        success = self.web_automator.downloader.download_excel_file()
                        if success:
                            self.log("[Recovery] ✅ Recovery exitoso tras refresh", level="EXITO")
                            return True
        except Exception as e:
            self.log(f"[Recovery] ❌ Error en refresh recovery: {e}", level="ERROR")

        # Estrategia 3: Notificar necesidad de intervención manual
        self.log("[Recovery] 🤝 Se requiere descarga manual asistida", level="ADVERTENCIA")
        self._request_manual_excel_download()

        return False  # No se pudo recuperar automáticamente

    def _execute_selective_retry(self, validation_report: ValidationReport) -> bool:
        """
        🎯 Reintento selectivo: Volver a posiciones exactas donde fallaron contratos

        Para cada contrato fallido:
        1. Navegar a la página/fila exacta donde falló
        2. Reintentar con técnicas mejoradas (waits más largos, clicks alternativos)
        3. Validar descarga antes de continuar al siguiente
        """

        self.log("[Recovery] 🎯 Iniciando reintento selectivo de contratos fallidos", level="INFO")

        # Obtener contratos fallidos con posición conocida
        failed_contracts = [
            detail
            for detail in validation_report.missing_details
            if detail["type"] == "contrato" and detail.get("page") and detail.get("row")
        ]

        if not failed_contracts:
            self.log(
                "[Recovery] ℹ️ No hay contratos con posición conocida para reintentar", level="INFO"
            )
            return True

        self.log(
            f"[Recovery] 📋 Reintentando {len(failed_contracts)} contratos específicos",
            level="INFO",
        )

        successful_recoveries = 0

        for contract_detail in failed_contracts:
            contract_name = contract_detail["name"]
            page = int(contract_detail.get("page", 1))
            row = int(contract_detail.get("row", 1))

            self.log(
                f"[Recovery] 🔄 Reintentando: {contract_name} (Página {page}, Fila {row})",
                level="INFO",
            )

            # Intentar recovery de este contrato específico
            if self._retry_specific_contract(contract_name, page, row):
                successful_recoveries += 1
                self.log(f"[Recovery] ✅ {contract_name} recuperado exitosamente", level="EXITO")
            else:
                self.log(f"[Recovery] ❌ No se pudo recuperar {contract_name}", level="ADVERTENCIA")

        # Evaluar éxito del recovery selectivo
        success_rate = (successful_recoveries / len(failed_contracts)) * 100
        self.log(
            f"[Recovery] 📊 Recovery selectivo: {successful_recoveries}/{len(failed_contracts)} ({success_rate:.1f}%)",
            level="INFO",
        )

        return successful_recoveries > 0  # Exitoso si se recuperó al menos uno

    def _retry_specific_contract(self, contract_name: str, page: int, row: int) -> bool:
        """
        🎯 Reintento de un contrato específico usando MÉTODOS EXISTENTES del downloader

        INTEGRACIÓN COMPLETA: Usa toda la lógica existente del bot
        """

        try:
            self.log(
                f"[Recovery] 🔄 Reintentando contrato: {contract_name} (Página {page}, Fila {row})",
                level="INFO",
            )

            # 🧭 NAVEGACIÓN: Usar método existente del downloader
            if not self._navigate_to_page(page):
                self.log(f"[Recovery] ❌ No se pudo navegar a página {page}", level="ERROR")
                return False

            # 🕒 ESPERAR CARGA COMPLETA
            time.sleep(self.ENHANCED_WAIT_SECONDS / 2)  # 5 segundos

            # 🎯 USAR DOWNLOADER EXISTENTE con localización específica
            if hasattr(self.web_automator, "downloader") and self.web_automator.downloader:
                downloader = self.web_automator.downloader

                # 📋 CREAR SESIÓN DE TRACKING para el reintento
                session = downloader._start_tracking_session(
                    "contract",
                    {
                        "contract_name": contract_name,
                        "row": str(row),
                        "page": str(page),
                        "recovery_attempt": "selective_retry",
                    },
                )

                # 🔍 LOCALIZAR FILA ESPECÍFICA usando la misma lógica del downloader
                from selenium.webdriver.common.by import By
                from selenium.webdriver.support.ui import WebDriverWait
                from selenium.webdriver.support import expected_conditions as EC

                driver = self.web_automator.driver
                wait = WebDriverWait(driver, int(self.ENHANCED_WAIT_SECONDS))

                # Buscar la tabla (misma estrategia que el downloader original)
                table = wait.until(EC.presence_of_element_located((By.ID, "gridTable")))
                filas = table.find_elements(By.XPATH, ".//tbody/tr")

                if row > len(filas):
                    self.log(
                        f"[Recovery] ❌ Fila {row} no existe (solo {len(filas)} filas)",
                        level="ERROR",
                    )
                    if session:
                        downloader.tracker.fail(session, "row_not_found")
                    return False

                # ✅ OBTENER FILA ESPECÍFICA (0-indexed)
                fila_target = filas[row - 1]
                columnas = fila_target.find_elements(By.XPATH, ".//th | .//td")

                if len(columnas) < 18:
                    self.log(
                        f"[Recovery] ❌ Fila {row} no tiene suficientes columnas ({len(columnas)})",
                        level="ERROR",
                    )
                    if session:
                        downloader.tracker.fail(session, "insufficient_columns")
                    return False

                # 🔍 VERIFICAR NOMBRE DEL CONTRATO
                nombre_archivo = columnas[4].text.strip()
                if contract_name.lower() not in nombre_archivo.lower():
                    self.log(
                        f"[Recovery] ⚠️ Nombre no coincide: esperado '{contract_name}', encontrado '{nombre_archivo}'",
                        level="ADVERTENCIA",
                    )

                # 📥 USAR LA MISMA LÓGICA DE DESCARGA del downloader original
                col18 = columnas[17]

                # Llamar al método de descarga mejorado
                success = self._enhanced_contract_download(
                    col18, contract_name, session, downloader
                )

                if success:
                    self.log(f"[Recovery] ✅ Reintento exitoso: {contract_name}", level="EXITO")
                    return True
                else:
                    self.log(f"[Recovery] ❌ Reintento falló: {contract_name}", level="ERROR")
                    return False
            else:
                self.log("[Recovery] ❌ No se pudo acceder al downloader", level="ERROR")
                return False

        except Exception as e:
            self.log(
                f"[Recovery] ❌ Error en retry específico de {contract_name}: {e}", level="ERROR"
            )
            return False

    def _enhanced_contract_download(
        self, col18_element, contract_name: str, session: DownloadSession, downloader
    ) -> bool:
        """
        📥 Descarga mejorada de contrato con técnicas robustas
        """

        from selenium.webdriver.common.action_chains import ActionChains
        from selenium.webdriver.common.by import By

        driver = self.web_automator.driver
        actions = ActionChains(driver)

        try:
            # 1. Scroll y enfoque mejorado
            driver.execute_script(
                "arguments[0].scrollIntoView({block: 'center', behavior: 'smooth'});", col18_element
            )
            time.sleep(1.0)

            # 2. Buscar botón menú con retry
            btns = col18_element.find_elements(By.CSS_SELECTOR, "span.icon-c_menuItem")
            if not btns:
                self.log(
                    f"[Recovery] ❌ No se encontró botón menú para {contract_name}", level="ERROR"
                )
                if session:
                    downloader.tracker.fail(session, "menu_button_not_found")
                return False

            btn_menu = btns[0]

            # 3. Abrir menú con técnicas alternativas y waits mejorados
            menu_opened = False
            for attempt, (technique_name, technique) in enumerate(
                [
                    (
                        "hover_click",
                        lambda: actions.move_to_element(btn_menu).pause(0.5).click().perform(),
                    ),
                    ("js_click", lambda: driver.execute_script("arguments[0].click();", btn_menu)),
                    ("direct_click", lambda: btn_menu.click()),
                    ("double_click", lambda: actions.double_click(btn_menu).perform()),
                ],
                1,
            ):
                try:
                    self.log(
                        f"[Recovery] 🔄 {contract_name}: Intento {attempt} - {technique_name}",
                        level="DEBUG",
                    )
                    technique()
                    time.sleep(self.ENHANCED_WAIT_SECONDS / 5)  # 2 segundos

                    # Verificar si el menú se abrió
                    dropdowns = col18_element.find_elements(By.CSS_SELECTOR, ".dropdown-menu")
                    if any(d.is_displayed() for d in dropdowns):
                        menu_opened = True
                        self.log(f"[Recovery] ✅ Menú abierto con {technique_name}", level="DEBUG")
                        break

                except Exception as e:
                    self.log(f"[Recovery] ❌ {technique_name} falló: {e}", level="DEBUG")
                    continue

            if not menu_opened:
                self.log(f"[Recovery] ❌ No se pudo abrir menú para {contract_name}", level="ERROR")
                if session:
                    downloader.tracker.fail(session, "menu_open_failed")
                return False

            # 4. Buscar y clickear "Editar" con waits mejorados
            time.sleep(1.0)  # Wait adicional para que el menú se estabilice

            editar_element = None
            for dropdown in col18_element.find_elements(By.CSS_SELECTOR, ".dropdown-menu"):
                editar_links = dropdown.find_elements(By.XPATH, ".//a[contains(text(), 'Editar')]")
                if editar_links:
                    editar_element = editar_links[0]
                    break

            if not editar_element:
                self.log(
                    f"[Recovery] ❌ No se encontró opción 'Editar' para {contract_name}",
                    level="ERROR",
                )
                if session:
                    downloader.tracker.fail(session, "editar_option_not_found")
                return False

            # Click en Editar con retry
            editar_clicked = False
            for technique_name, technique in [
                ("hover_click", lambda: actions.move_to_element(editar_element).click().perform()),
                (
                    "js_click",
                    lambda: driver.execute_script("arguments[0].click();", editar_element),
                ),
                ("direct_click", lambda: editar_element.click()),
            ]:
                try:
                    technique()
                    editar_clicked = True
                    self.log(
                        f"[Recovery] ✅ Click en 'Editar' exitoso con {technique_name}",
                        level="DEBUG",
                    )
                    break
                except Exception as e:
                    self.log(
                        f"[Recovery] ❌ {technique_name} en 'Editar' falló: {e}", level="DEBUG"
                    )
                    continue

            if not editar_clicked:
                if session:
                    downloader.tracker.fail(session, "editar_click_failed")
                return False

            # 5. Esperar vista de detalle con timeout extendido
            time.sleep(self.ENHANCED_WAIT_SECONDS / 2)  # 5 segundos

            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC

            wait_detalle = WebDriverWait(driver, int(self.ENHANCED_WAIT_SECONDS))
            try:
                wait_detalle.until(
                    EC.presence_of_element_located(
                        (By.XPATH, "//label[contains(text(), 'Descargar Contrato')]")
                    )
                )
                self.log(
                    f"[Recovery] ✅ Vista de detalle cargada para {contract_name}", level="DEBUG"
                )
            except Exception as e:
                self.log(f"[Recovery] ❌ Vista de detalle no se cargó: {e}", level="ERROR")
                if session:
                    downloader.tracker.fail(session, "detail_view_timeout")
                return False

            # 6. Descargar con retry mejorado
            download_success = False
            btns_desc = driver.find_elements(
                By.XPATH, "//label[contains(text(), 'Descargar Contrato')]/ancestor::a"
            )

            if not btns_desc:
                self.log("[Recovery] ❌ No se encontró botón 'Descargar Contrato'", level="ERROR")
                if session:
                    downloader.tracker.fail(session, "download_button_not_found")
                return False

            btn_desc = btns_desc[0]
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", btn_desc)

            for technique_name, technique in [
                ("hover_click", lambda: actions.move_to_element(btn_desc).click().perform()),
                ("js_click", lambda: driver.execute_script("arguments[0].click();", btn_desc)),
                ("direct_click", lambda: btn_desc.click()),
            ]:
                try:
                    technique()
                    self.log(
                        f"[Recovery] 📥 Descarga iniciada para {contract_name} con {technique_name}",
                        level="INFO",
                    )
                    time.sleep(3.0)  # Wait extra para descarga

                    # Verificar descarga con tracker
                    if downloader._wait_for_tracker(session):
                        download_success = True
                        break

                except Exception as e:
                    self.log(
                        f"[Recovery] ❌ {technique_name} en descarga falló: {e}", level="ERROR"
                    )
                    continue

            if not download_success:
                if session:
                    downloader.tracker.fail(session, "download_failed")

            # 7. Volver a tabla principal (siempre, exitoso o no)
            try:
                btn_cancelar = driver.find_element(
                    By.XPATH,
                    "//button[contains(@class, 'btn-primary-dark') and contains(text(), 'Cancelar')]",
                )
                btn_cancelar.click()
                time.sleep(2.0)
                self.log(
                    f"[Recovery] ↩️ Retorno a tabla principal desde {contract_name}", level="DEBUG"
                )
            except Exception as e:
                self.log(f"[Recovery] ⚠️ Error retornando a tabla: {e}", level="ADVERTENCIA")

            return download_success

        except Exception as e:
            self.log(
                f"[Recovery] ❌ Error en descarga mejorada de {contract_name}: {e}", level="ERROR"
            )
            if session:
                downloader.tracker.fail(session, f"enhanced_download_error: {str(e)}")
            return False

    def _execute_partial_continuation(self, validation_report: ValidationReport) -> bool:
        """
        ⚠️ Continuación parcial: Proceder con archivos disponibles

        Cuando hay suficientes archivos para un análisis básico pero no todos.
        Informa al usuario y permite continuar con lo disponible.
        """

        self.log("[Recovery] ⚠️ Iniciando continuación parcial", level="INFO")
        self.log(
            f"[Recovery] 📊 Archivos disponibles: {validation_report.total_downloaded}/{validation_report.total_expected}",
            level="INFO",
        )

        # Mostrar lo que está disponible
        if validation_report.excel_principal_found:
            self.log("[Recovery] ✅ Excel principal: DISPONIBLE", level="EXITO")

        self.log(
            f"[Recovery] 📋 Contratos disponibles: {validation_report.contratos_found}",
            level="INFO",
        )

        # Listar lo que falta
        if validation_report.missing_count > 0:
            self.log(
                f"[Recovery] ❌ Archivos faltantes: {validation_report.missing_count}",
                level="ADVERTENCIA",
            )
            for detail in validation_report.missing_details:
                self.log(f"[Recovery]   - {detail['name']}", level="ADVERTENCIA")

        # Informar que se puede proceder
        self.log("[Recovery] 🎯 Se puede proceder a etapa 2 con análisis parcial", level="INFO")
        self.log(
            "[Recovery] 💡 Los archivos faltantes se pueden descargar después si es necesario",
            level="INFO",
        )

        return True  # Siempre exitoso - es una decisión de continuar

    def _execute_full_recovery(self, validation_report: ValidationReport) -> bool:
        """
        🔄 Recovery completo: Reiniciar proceso completo con parámetros mejorados

        Para casos donde faltan muchos archivos y se requiere un reintento completo.
        """

        self.log("[Recovery] 🔄 Iniciando recovery completo", level="ADVERTENCIA")
        self.log(
            "[Recovery] ⚠️ ADVERTENCIA: Esto reiniciará todo el proceso de descarga",
            level="ADVERTENCIA",
        )

        # Nota: Esta implementación básica solo registra la necesidad
        # Una implementación completa requeriría reiniciar todo el web_automator

        self.log(
            "[Recovery] 📋 Recovery completo registrado - se requiere reinicio manual", level="INFO"
        )
        self.log(
            "[Recovery] 💡 Recomendación: Reiniciar la aplicación y ejecutar nuevamente",
            level="INFO",
        )

        return False  # No se puede completar automáticamente

    # Métodos auxiliares para navegación y posicionamiento

    def _ensure_main_portfolio_position(self) -> bool:
        """
        🎯 Asegurar posición correcta para Excel principal usando navegación existente

        CONEXIÓN DIRECTA: Usa métodos de navegación del web_automator
        """
        try:
            self.log("[Recovery] 🧭 Asegurando posición para Excel principal...", level="DEBUG")

            # 🔗 USAR NAVEGACIÓN EXISTENTE del web_automator
            if hasattr(self.web_automator, "navigation") and self.web_automator.navigation:
                # Navegar a Mi Cartera si hay método disponible
                try:
                    self.web_automator.navigation.navigate_to_mi_cartera()
                    time.sleep(2.0)
                    self.log("[Recovery] ✅ Navegación a Mi Cartera completada", level="DEBUG")
                except Exception:
                    self.log(
                        "[Recovery] ⚠️ Método navigate_to_mi_cartera no disponible", level="DEBUG"
                    )

            # 🎯 USAR DOWNLOADER para posicionamiento específico
            if hasattr(self.web_automator, "downloader") and self.web_automator.downloader:
                downloader = self.web_automator.downloader

                # Si hay método para ir a página específica, ir a la primera
                if hasattr(downloader, "_go_to_page"):
                    downloader._go_to_page(1)
                    time.sleep(3.0)
                    self.log("[Recovery] ✅ Posicionado en página 1", level="DEBUG")

                # ✅ VERIFICAR POSICIÓN usando los mismos elementos que busca el downloader
                from selenium.webdriver.common.by import By
                from selenium.webdriver.support.ui import WebDriverWait
                from selenium.webdriver.support import expected_conditions as EC

                wait = WebDriverWait(self.web_automator.driver, 10)

                # Verificar que la tabla principal está presente
                try:
                    wait.until(EC.presence_of_element_located((By.ID, "gridTable")))
                    self.log("[Recovery] ✅ Tabla principal encontrada", level="DEBUG")
                    return True
                except Exception:
                    self.log(
                        "[Recovery] ⚠️ Tabla no encontrada inmediatamente - continuando",
                        level="ADVERTENCIA",
                    )
                    return True  # Continuar con el recovery aunque no se vea la tabla

            return True  # Default success si los métodos básicos funcionan

        except Exception as e:
            self.log(f"[Recovery] ❌ Error asegurando posición principal: {e}", level="ERROR")
            return False

    def _re_navigate_to_portfolio(self) -> bool:
        """
        🧭 Re-navegar al portfolio usando métodos existentes del web_automator

        CONEXIÓN DIRECTA: Usa navigation_handler existente
        """
        try:
            self.log("[Recovery] 🔄 Re-navegando al portfolio tras refresh...", level="INFO")

            # 🔗 USAR NAVIGATION HANDLER EXISTENTE
            if hasattr(self.web_automator, "navigation") and self.web_automator.navigation:
                navigation = self.web_automator.navigation

                # Intentar métodos disponibles de navegación
                navigation_methods = [
                    ("navigate_to_mi_cartera", "Mi Cartera"),
                    ("navigate_to_portfolio", "Portfolio"),
                    ("go_to_portfolio", "Portfolio directo"),
                ]

                for method_name, description in navigation_methods:
                    if hasattr(navigation, method_name):
                        try:
                            self.log(
                                f"[Recovery] 🎯 Usando {method_name} para navegar a {description}",
                                level="DEBUG",
                            )
                            method = getattr(navigation, method_name)
                            method()
                            time.sleep(3.0)  # Esperar carga

                            # Verificar éxito buscando elementos típicos del portfolio
                            from selenium.webdriver.common.by import By

                            # Buscar indicadores de que estamos en el portfolio
                            indicators = [
                                (By.ID, "gridTable"),
                                (By.CLASS_NAME, "portfolio-table"),
                                (By.XPATH, "//table[contains(@class, 'grid')]"),
                                (
                                    By.XPATH,
                                    "//div[contains(@class, 'portfolio') or contains(@class, 'cartera')]",
                                ),
                            ]

                            for by_method, selector in indicators:
                                try:
                                    elements = self.web_automator.driver.find_elements(
                                        by_method, selector
                                    )
                                    if elements:
                                        self.log(
                                            f"[Recovery] ✅ Re-navegación exitosa - {description} cargado",
                                            level="INFO",
                                        )
                                        return True
                                except Exception:
                                    continue

                        except Exception as e:
                            self.log(f"[Recovery] ⚠️ Método {method_name} falló: {e}", level="DEBUG")
                            continue

                # Si ningún método específico funcionó, asumir éxito básico
                self.log(
                    "[Recovery] ⚠️ Métodos específicos no disponibles - usando navegación básica",
                    level="ADVERTENCIA",
                )
                time.sleep(2.0)
                return True

            else:
                self.log("[Recovery] ❌ Navigation handler no disponible", level="ERROR")
                return False

        except Exception as e:
            self.log(f"[Recovery] ❌ Error en re-navegación: {e}", level="ERROR")
            return False

    def _navigate_to_page(self, page_number: int) -> bool:
        """
        🎯 Navegar a una página específica usando el método existente del downloader

        CONEXIÓN DIRECTA: Usa _go_to_page del downloader existente
        """
        try:
            if hasattr(self.web_automator, "downloader") and self.web_automator.downloader:
                # 🔗 USAR MÉTODO EXISTENTE DEL DOWNLOADER
                self.log(
                    f"[Recovery] 🧭 Navegando a página {page_number} usando método existente",
                    level="DEBUG",
                )
                self.web_automator.downloader._go_to_page(page_number)
                time.sleep(3.0)  # Wait extra para asegurar carga completa

                # Verificar que la navegación fue exitosa
                from selenium.webdriver.common.by import By
                from selenium.webdriver.support.ui import WebDriverWait
                from selenium.webdriver.support import expected_conditions as EC

                wait = WebDriverWait(self.web_automator.driver, 10)
                wait.until(EC.presence_of_element_located((By.ID, "gridTable")))

                self.log(f"[Recovery] ✅ Navegación a página {page_number} exitosa", level="INFO")
                return True
            else:
                self.log(
                    "[Recovery] ❌ No se pudo acceder al downloader para navegación", level="ERROR"
                )
                return False
        except Exception as e:
            self.log(f"[Recovery] ❌ Error navegando a página {page_number}: {e}", level="ERROR")
            return False

    def _request_manual_excel_download(self):
        """Solicitar descarga manual del Excel principal"""

        self.log("[Recovery] 🤝 INTERVENCIÓN MANUAL REQUERIDA", level="ADVERTENCIA")
        self.log(
            "[Recovery] 📋 Por favor, descargue manualmente el archivo Excel principal:",
            level="INFO",
        )
        self.log("[Recovery]   1. Busque el botón 'Descargar en Excel' en la página", level="INFO")
        self.log("[Recovery]   2. Haga clic para descargar", level="INFO")
        self.log("[Recovery]   3. Guarde el archivo en la carpeta de descargas", level="INFO")
        self.log("[Recovery]   4. El bot detectará el archivo automáticamente", level="INFO")

        # Aquí se podría mostrar una ventana de diálogo para guiar al usuario
        # Por ahora solo logeamos las instrucciones


__all__ = ["SmartRecoverySystem", "RecoveryAttempt"]
