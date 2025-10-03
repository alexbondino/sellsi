"""
Forward Automation Engine - REFACTORIZADO
Fecha: 1 de Octubre, 2025

ARQUITECTURA MODULAR:
- DateCalculator: Cálculos de fechas y feriados
- IterationCalculator: Lógica de iteraciones
- CalendarHandler: Manejo de calendarios UI
- FormConfigurator: Configuración de formularios
- ResultExtractor: Extracción y guardado de resultados

El engine ahora es un ORQUESTADOR que delega responsabilidades.
"""

from datetime import datetime
from typing import Callable, Optional, TYPE_CHECKING
import time
import sys
import os

# Agregar path para imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from automation.MtM.browser_manager import BrowserManager
from automation.shared.login_handler import LoginHandler

# Importar módulos especializados
from .calculators import DateCalculator, IterationCalculator
from .handlers import CalendarHandler, FormConfigurator, ResultExtractor

if TYPE_CHECKING:
    from selenium.webdriver.remote.webdriver import WebDriver


class ForwardAutomationEngine:
    """
    Orquestador principal para automatización Forward.
    
    Principio de Responsabilidad Única:
    - Coordinar el flujo general (start → login → navegar → configurar → extraer)
    - Delegar tareas especializadas a componentes
    
    NO hace cálculos, NO maneja UI directamente, solo ORQUESTA.
    """
    
    def __init__(
        self,
        fecha_inicio: datetime,
        mes_vencimiento: str,
        paridades: list,
        directorio_salida: str,
        log_callback: Callable,
        progress_callback: Optional[Callable] = None,
        modo_turbo: bool = False
    ):
        """
        Args:
            fecha_inicio: Fecha de inicio del cálculo
            mes_vencimiento: Mes de vencimiento (formato: "Enero 2025")
            paridades: Lista de paridades (ej: ["USD/CLP", "EUR/CLP"])
            directorio_salida: Directorio para guardar resultados
            log_callback: Función para logging
            progress_callback: Función para actualizar barra de progreso (opcional)
            modo_turbo: Si True, reduce tiempos de espera para navegación rápida
        """
        self.fecha_inicio = fecha_inicio
        self.mes_vencimiento = mes_vencimiento
        self.paridades = paridades
        self.directorio_salida = directorio_salida
        self.log = log_callback
        self.update_progress = progress_callback if progress_callback else lambda p, m="": None
        self.modo_turbo = modo_turbo
        
        # Configurar multiplicador de tiempo según modo turbo
        self.time_multiplier = 0.25 if modo_turbo else 1.0  # Turbo = 25% del tiempo (4x más rápido)
        
        # Componentes de infraestructura
        self.browser: Optional[BrowserManager] = None
        self.login: Optional[LoginHandler] = None
        self.driver: Optional["WebDriver"] = None
        
        # Componentes especializados (lazy initialization)
        self.date_calc: Optional[DateCalculator] = None
        self.iter_calc: Optional[IterationCalculator] = None
        self.form_config: Optional[FormConfigurator] = None
        self.result_extractor: Optional[ResultExtractor] = None
        
        # Resultados (nueva estructura de matriz)
        self.resultados_matriz = {}  # {fecha_str: {paridad: {spot, pts_fwd}, fecha: datetime}}
    
    def start(self) -> bool:
        """
        Flujo principal de automatización.
        
        Returns:
            True si el proceso fue exitoso, False si no
        """
        try:
            self._log_header("INICIANDO AUTOMATIZACIÓN FORWARD")
            
            # 1. Iniciar navegador
            self.update_progress(5, "Iniciando navegador...")
            self._start_browser()
            
            # 2. Inicializar componentes especializados
            self._init_components()
            
            # 3. Login
            self.update_progress(15, "Iniciando sesión...")
            self._perform_login()
            
            # 4. Navegar a sección Forward
            self.update_progress(25, "Navegando a calculadoras...")
            self._navigate_to_forward_section()
            
            # 5. Ejecutar combinaciones (paridades múltiples)
            self._execute_combinations()
            
            # 6. Guardar resultados en Excel matriz
            self.update_progress(95, "Guardando resultados en Excel...")
            self._save_results_matriz()
            
            self.update_progress(100, "Completado")
            self._log_header("PROCESO COMPLETADO EXITOSAMENTE")
            return True
            
        except Exception as e:
            self.log(f"[Engine] ❌ Error crítico: {e}", level="ERROR")
            import traceback
            self.log(f"[Engine] 📋 Traceback: {traceback.format_exc()}", level="ERROR")
            return False
        finally:
            self.log("[Engine] 💡 Navegador permanecerá abierto", level="INFO")
    
    def _init_components(self):
        """Inicializa componentes especializados"""
        self.log("[Engine] 🔧 Inicializando componentes...", level="INFO")
        
        self.date_calc = DateCalculator(self.log)
        self.iter_calc = IterationCalculator(self.log, self.date_calc)
        self.form_config = FormConfigurator(self.driver, self.log)
        self.result_extractor = ResultExtractor(self.driver, self.log)
        
        self.log("[Engine] ✅ Componentes inicializados", level="EXITO")
    
    def _start_browser(self):
        """Inicia el navegador"""
        self.log("[Engine] 🌐 Iniciando navegador...", level="INFO")
        
        self.browser = BrowserManager(self.log, self.directorio_salida)
        self.browser.start_browser()
        self.driver = self.browser.driver
        
        if not self.driver:
            raise RuntimeError("Driver no inicializado")
        
        self.log("[Engine] ✅ Navegador iniciado", level="EXITO")
    
    def _perform_login(self):
        """Ejecuta login"""
        self.log("[Engine] 🔐 Ejecutando login...", level="INFO")
        
        time.sleep(3 * self.time_multiplier)
        self.login = LoginHandler(self.driver, self.log)
        self.login.perform_login()
        time.sleep(3)
        
        self.log("[Engine] ✅ Login completado", level="EXITO")
    
    def _navigate_to_forward_section(self):
        """Navega a sección Forward"""
        self.log("[Engine] 🧭 Navegando a Net Derivatives...", level="INFO")
        
        from selenium.webdriver.common.by import By
        
        # Abrir sidebar
        self._open_sidebar()
        
        # Click en Net Derivatives
        self._click_net_derivatives()
        
        # Cambiar a nueva pestaña si se abrió
        time.sleep(2 * self.time_multiplier)
        if len(self.driver.window_handles) > 1:
            self.driver.switch_to.window(self.driver.window_handles[-1])
            time.sleep(2 * self.time_multiplier)
        
        self.log("[Engine] ✅ Navegación completada", level="EXITO")
    
    def _execute_combinations(self):
        """Ejecuta TODAS las combinaciones de paridades"""
        self.log("[Engine] 🔄 Iniciando sistema de COMBINACIONES...", level="INFO")
        self.log(f"[Engine] 📅 Inicio: {self.fecha_inicio.strftime('%d/%m/%Y')}", level="INFO")
        self.log(f"[Engine] 📆 Vencimiento: {self.mes_vencimiento}", level="INFO")
        self.log(f"[Engine] 💱 Paridades: {', '.join(self.paridades)}", level="INFO")
        
        # Calcular progreso: 30% base (navegador, login, navegación ya completados)
        # 65% restante para iteraciones (30-95%)
        self.progress_base = 30
        self.progress_range = 65
        
        # Inicializar contador de iteraciones globales
        self.iteracion_global = 0
        
        # Calcular total de iteraciones estimadas (todas las paridades tienen el mismo num de iteraciones)
        num_iter_estimadas = self.iter_calc.calcular_numero_iteraciones(
            self.fecha_inicio, 
            self.mes_vencimiento
        )
        self.total_iteraciones_estimadas = len(self.paridades) * num_iter_estimadas
        self.log(f"[Engine] 📊 Total iteraciones estimadas: {self.total_iteraciones_estimadas}", level="INFO")
        
        # CONFIGURACIÓN GLOBAL (UNA SOLA VEZ PARA TODAS LAS COMBINACIONES)
        self._log_separator("CONFIGURACIÓN GLOBAL (todas las combinaciones)")
        self.form_config.configurar_fecha_inicio(self.fecha_inicio)
        self.form_config.configurar_fecha_valoracion(self.fecha_inicio)
        
        self.log("[Engine] ✅ Fechas Inicio y Valoración configuradas", level="EXITO")
        self.log("[Engine]    ⚠️ Estas fechas NO cambiarán entre combinaciones", level="ADVERTENCIA")
        time.sleep(1 * self.time_multiplier)
        
        # LOOP DE COMBINACIONES
        for idx, paridad in enumerate(self.paridades, 1):
            self._log_separator(f"COMBINACIÓN {idx}/{len(self.paridades)}: {paridad}")
            
            # CASO ESPECIAL: UF requiere navegar a "Forward de Inflación"
            if paridad == "UF":
                self.log(f"[Engine] ⚠️ UF detectado - Navegando a Forward de Inflación", level="ADVERTENCIA")
                
                # Activar modo UF para que form_configurator use XPaths de UF
                self.form_config.set_modo_uf(True)
                
                self._click_forward_inflacion()
                time.sleep(2 * self.time_multiplier)
                # Reconfigurar fechas Inicio y Valoración para este caso especial
                self.log(f"[Engine] 🔄 Reconfigurando Inicio y Valoración para Forward de Inflación", level="INFO")
                self.form_config.configurar_fecha_inicio(self.fecha_inicio)
                self.form_config.configurar_fecha_valoracion(self.fecha_inicio)
                time.sleep(1 * self.time_multiplier)
            else:
                # Caso normal: Cambiar paridad en dropdown
                # Asegurar que modo_uf está desactivado para paridades normales
                self.form_config.set_modo_uf(False)
                self.form_config.configurar_paridad(paridad)
                time.sleep(1 * self.time_multiplier)
            
            # Ejecutar iteraciones para esta paridad
            self._execute_iterations_for_combination(paridad)
        
        self.log(f"\n[Engine] 🎉 TODAS LAS COMBINACIONES COMPLETADAS: {len(self.paridades)} paridades procesadas", level="EXITO")
    
    def _execute_iterations_for_combination(self, paridad: str):
        """
        Ejecuta las iteraciones de cálculo para UNA paridad.
        
        NUEVO COMPORTAMIENTO:
        - Iteración 1: Extrae Spot (fijo) + Pts Forward
        - Iteraciones 2+: Solo Pts Forward (Spot ya capturado)
        
        Args:
            paridad: Paridad actual (ej: "USD/CLP")
        """
        # Calcular número de iteraciones para esta paridad
        num_iteraciones = self.iter_calc.calcular_numero_iteraciones(
            self.fecha_inicio, 
            self.mes_vencimiento
        )
        
        self.log(f"[Engine] � Iteraciones para {paridad}: {num_iteraciones}", level="INFO")
        
        spot_fijo = None  # Spot se extrae SOLO en iteración 1
        
        # LOOP DE ITERACIONES (reiniciado para esta paridad)
        for i in range(1, num_iteraciones + 1):
            # Incrementar contador global
            self.iteracion_global += 1
            
            # Calcular y actualizar progreso
            if self.total_iteraciones_estimadas > 0:
                progreso_iteraciones = (self.iteracion_global / self.total_iteraciones_estimadas) * self.progress_range
                progreso_actual = self.progress_base + progreso_iteraciones
                self.update_progress(progreso_actual, f"Procesando {paridad} - Iteración {i}/{num_iteraciones}")
            
            # Calcular mes actual
            mes_actual = self.iter_calc.calcular_mes_iteracion(self.fecha_inicio, i)
            
            # Calcular fecha de vencimiento (ÚLTIMO DÍA DEL MES - sin importar si es hábil o feriado)
            from calendar import monthrange
            ultimo_dia_mes = monthrange(mes_actual.year, mes_actual.month)[1]
            fecha_vencimiento = datetime(mes_actual.year, mes_actual.month, ultimo_dia_mes)
            
            self.log(
                f"[Engine]   Iteración {i}/{num_iteraciones} - {mes_actual.strftime('%B %Y')} "
                f"(vence: {fecha_vencimiento.strftime('%d/%m/%Y')})",
                level="INFO"
            )
            
            # Configurar SOLO fecha de vencimiento (lo único que cambia)
            self.form_config.configurar_fecha_vencimiento(fecha_vencimiento)
            
            # Click Calcular
            self.form_config.click_calcular()
            
            # Extraer resultados (indicar si es UF para usar XPaths correctos)
            es_uf = (paridad == "UF")
            resultado = self.result_extractor.extraer_resultados(mes_actual, es_uf=es_uf)
            
            # ITERACIÓN 1: Capturar Spot fijo para toda la paridad
            if i == 1:
                spot_fijo = resultado["precio_spot_bid"]
                self.log(f"[Engine]      ⭐ Spot FIJO capturado: {spot_fijo}", level="INFO")
            
            # Agregar a estructura de matriz
            fecha_str = fecha_vencimiento.strftime("%d/%m/%Y")
            
            if fecha_str not in self.resultados_matriz:
                self.resultados_matriz[fecha_str] = {
                    "fecha": fecha_vencimiento
                }
            
            # Guardar: spot_fijo (solo iteración 1) + pts_fwd (todas)
            self.resultados_matriz[fecha_str][paridad] = {
                "spot_fijo": spot_fijo if i == 1 else None,  # Solo en iteración 1
                "pts_fwd": resultado["puntos_forward_bid"]
            }
            
            if i == 1:
                self.log(
                    f"[Engine]      ├─ Spot FIJO: {spot_fijo} | "
                    f"Pts Forward: {resultado['puntos_forward_bid']}",
                    level="INFO"
                )
            else:
                self.log(
                    f"[Engine]      ├─ Pts Forward: {resultado['puntos_forward_bid']} "
                    f"(Spot fijo: {spot_fijo})",
                    level="INFO"
                )
            
            self.log(f"[Engine]      └─ ✅ Guardado en matriz para {fecha_str}", level="EXITO")
            time.sleep(2 * self.time_multiplier)
        
        self.log(f"[Engine] ✅ Paridad {paridad} completada: {num_iteraciones} iteraciones | Spot fijo: {spot_fijo}", level="EXITO")
    
    def _save_results_matriz(self):
        """Guarda resultados en Excel con formato de matriz"""
        self.log("[Engine] 💾 Guardando resultados en Excel matriz...", level="INFO")
        
        if not self.resultados_matriz:
            self.log("[Engine] ⚠️ No hay resultados para guardar", level="ADVERTENCIA")
            return
        
        filepath = self.result_extractor.guardar_resultados_excel_matriz(
            self.resultados_matriz,
            self.paridades,
            self.directorio_salida
        )
        
        # Log resumen
        self.log("[Engine] 📊 RESUMEN DE RESULTADOS:", level="INFO")
        self.log(f"[Engine]    Total de fechas: {len(self.resultados_matriz)}", level="INFO")
        self.log(f"[Engine]    Total de paridades: {len(self.paridades)}", level="INFO")
        
        for fecha_str in sorted(
            self.resultados_matriz.keys(), 
            key=lambda x: self.resultados_matriz[x]["fecha"]
        ):
            self.log(f"[Engine]    📅 {fecha_str}:", level="INFO")
            for paridad in self.paridades:
                if paridad in self.resultados_matriz[fecha_str]:
                    data = self.resultados_matriz[fecha_str][paridad]
                    self.log(
                        f"[Engine]        {paridad}: Spot={data['spot']}, Pts={data['pts_fwd']}",
                        level="INFO"
                    )
    
    # ========================================================================
    # HELPERS SIMPLES
    # ========================================================================
    
    def _open_sidebar(self) -> bool:
        """Abre el menú lateral"""
        from selenium.webdriver.common.by import By
        
        for attempt in range(10):
            try:
                menu_btn = self.driver.find_element(
                    By.CSS_SELECTOR, "a.nav-link.icon-menu-left-link"
                )
                menu_btn.click()
                time.sleep(1 * self.time_multiplier)
                return True
            except:
                time.sleep(0.5 * self.time_multiplier)
        return False
    
    def _click_net_derivatives(self) -> bool:
        """Hace click en 'Net Derivatives'"""
        from selenium.webdriver.common.by import By
        
        selectors = [
            "/html/body/app-root/app-home/div[2]/app-nav-left/aside/nav/div/ul/div/div[1]/div/li/a/div[2]",
            (By.CSS_SELECTOR, "#nav-left > nav > div > ul > div > div:nth-child(2) > div > li > a > div.menu-left-nav-link-container2"),
            "//span[@class='iconTextCustom' and text()='Net derivatives']",
            "//*[contains(text(), 'Net derivatives')]",
        ]
        
        for attempt in range(10):
            for selector in selectors:
                try:
                    if isinstance(selector, tuple):
                        by_type, selector_value = selector
                        btn = self.driver.find_element(by_type, selector_value)
                    else:
                        btn = self.driver.find_element(By.XPATH, selector)
                    
                    btn.location_once_scrolled_into_view
                    time.sleep(0.3 * self.time_multiplier)
                    btn.click()
                    return True
                except:
                    continue
            time.sleep(0.5 * self.time_multiplier)
        return False
    
    def _click_forward_inflacion(self) -> bool:
        """
        Hace click en 'Forward de Inflación' (caso especial UF/USD).
        
        XPath: /html/body/app-root/app-home/div[2]/app-calculator/div/div/div/div[1]/app-calculator-nav/div/ul/li[1]/div[2]/div/ul/li[2]/div
        
        Returns:
            bool: True si el click fue exitoso
        """
        from selenium.webdriver.common.by import By
        
        selectors = [
            # XPath completo proporcionado
            "/html/body/app-root/app-home/div[2]/app-calculator/div/div/div/div[1]/app-calculator-nav/div/ul/li[1]/div[2]/div/ul/li[2]/div",
            # XPath relativo buscando el texto
            "//span[@class='nav-menu-item-title' and contains(text(), 'Forward de Inflación')]",
            "//span[contains(text(), 'Forward de Inflación')]",
            # Buscar el div contenedor
            "//div[@class='nav-menu-item-header iconed' and .//span[contains(text(), 'Forward de Inflación')]]",
        ]
        
        self.log(f"[Engine] 🎯 Intentando click en 'Forward de Inflación'...", level="INFO")
        
        for attempt in range(10):
            for selector in selectors:
                try:
                    btn = self.driver.find_element(By.XPATH, selector)
                    btn.location_once_scrolled_into_view
                    time.sleep(0.3 * self.time_multiplier)
                    btn.click()
                    self.log(f"[Engine] ✅ Click exitoso en 'Forward de Inflación'", level="EXITO")
                    return True
                except Exception as e:
                    continue
            time.sleep(0.5 * self.time_multiplier)
        
        self.log(f"[Engine] ❌ No se pudo hacer click en 'Forward de Inflación'", level="ERROR")
        return False
    
    def _log_header(self, mensaje: str):
        """Log con separador de sección"""
        self.log(f"[Engine] {'='*50}", level="INFO")
        self.log(f"[Engine] {mensaje}", level="INFO")
        self.log(f"[Engine] {'='*50}", level="INFO")
    
    def _log_separator(self, mensaje: str):
        """Log con separador"""
        self.log(f"[Engine] {'─'*50}", level="INFO")
        self.log(f"[Engine] {mensaje}", level="INFO")
        self.log(f"[Engine] {'─'*50}", level="INFO")
    
    def close_browser(self):
        """Cierra el navegador"""
        if self.browser:
            self.browser.close_browser()


# Testing standalone
if __name__ == "__main__":
    def test_log(message, level="INFO"):
        print(f"[{level}] {message}")
    
    engine = ForwardAutomationEngine(
        fecha_inicio=datetime.now(),
        mes_vencimiento="Diciembre 2025",
        paridades=["USD/CLP", "EUR/CLP"],  # ← NUEVO: lista de paridades
        directorio_salida="./test_output_forward",
        log_callback=test_log
    )
    
    engine.start()
