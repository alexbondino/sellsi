import time
from typing import Optional, Any, cast
from automation.MtM.browser_manager import BrowserManager
from automation.shared.login_handler import LoginHandler
from automation.MtM.navigation_handler import NavigationHandler
from automation.MtM.ui_controller import UIController
from automation.MtM.downloader import FileDownloader
from automation.MtM.element_finder import ElementFinder

class WebAutomator:
    def __init__(self, log_func):
        self.log = log_func
        # Dependencias inicializadas en start()
        self.browser: Optional[BrowserManager] = None
        self.login: Optional[LoginHandler] = None
        self.navigation: Optional[NavigationHandler] = None
        self.ui: Optional[UIController] = None
        self.downloader: Optional[FileDownloader] = None
        self.finder: Optional[ElementFinder] = None
        # Atributos opcionales que podrían venir del integrador/GUI
        self.date_entry: Optional[Any] = None  # GUI date widget

    def _ensure_initialized(self) -> None:
        if self.browser is None or self.browser.driver is None:
            raise RuntimeError("BrowserManager no inicializado")
        if self.login is None:
            raise RuntimeError("LoginHandler no inicializado")
        if self.navigation is None:
            raise RuntimeError("NavigationHandler no inicializado")
        if self.ui is None:
            raise RuntimeError("UIController no inicializado")
        if self.downloader is None:
            raise RuntimeError("FileDownloader no inicializado")
        if self.finder is None:
            raise RuntimeError("ElementFinder no inicializado")

    @property
    def driver(self):  # tipo dinámico para evitar dependencias circulares de tipos
        if self.browser is None or self.browser.driver is None:
            raise RuntimeError("Driver no inicializado")
        return self.browser.driver

    def _resolve_date(self) -> str:
        # Orden de resolución: método get_selected_date -> widget date_entry -> fallback
        if hasattr(self, 'get_selected_date'):
            try:
                return getattr(self, 'get_selected_date')()  # type: ignore[no-any-return]
            except Exception:
                pass
        if self.date_entry and hasattr(self.date_entry, 'get'):
            try:
                return self.date_entry.get()
            except Exception:
                pass
        return '17-06-2025'

    def start(self, download_dir=None):
        self.browser = BrowserManager(self.log, download_dir)
        self.browser.start_browser()
        driver = self.browser.driver
        self.login = LoginHandler(driver, self.log)
        self.navigation = NavigationHandler(driver, self.log)
        self.ui = UIController(driver, self.log)
        self.downloader = FileDownloader(driver, self.log, self.browser.download_dir)
        self.finder = ElementFinder(driver, self.log)
        self._run_flow()

    def _run_flow(self):
        self._ensure_initialized()
        login = cast(LoginHandler, self.login)
        navigation = cast(NavigationHandler, self.navigation)
        ui = cast(UIController, self.ui)
        downloader = cast(FileDownloader, self.downloader)
        finder = cast(ElementFinder, self.finder)
        driver = self.driver

        login.perform_login()
        navigation.open_sidebar_menu()
        navigation.navigate_to_mi_cartera()
        ui.select_currency('CLP')
        fecha = self._resolve_date()
        self.log(f"[UI] Seleccionando fecha: {fecha}", level="INFO")
        ui.select_date(fecha)
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        try:
            self.log("Esperando que la tabla de contratos esté visible y cargada...", level="INFO")
            wait = WebDriverWait(driver, 20)
            wait.until(EC.visibility_of_element_located((By.ID, "gridTable")))
            filas = driver.find_elements(By.XPATH, "//table[@id='gridTable']//tbody/tr")
            while not filas:
                time.sleep(0.5)
                filas = driver.find_elements(By.XPATH, "//table[@id='gridTable']//tbody/tr")
            self.log(f"Tabla de contratos lista con {len(filas)} filas.", level="EXITO")
        except Exception as e:
            self.log(f"Error esperando la tabla de contratos: {e}", level="ERROR")
        downloader.process_all_rows()
        self.log("Esperando nueva tabla de contratos tras 'Ver contratos'...", level="INFO")
        nueva_tabla = finder.wait_for_new_contracts_table(timeout=20)
        if not nueva_tabla:
            self.log("No se detectó la nueva tabla de contratos. Abortando descarga.", level="ERROR")
            return
        self.log("Nueva tabla de contratos lista. Procediendo a descargar Excel y archivos de contrato.", level="EXITO")
        downloader.download_excel_file()
        downloader.download_contract_files()
        try:
            pag2_btn = None
            paginadores = driver.find_elements(By.CSS_SELECTOR, ".pagination li")
            for li in paginadores:
                try:
                    a = li.find_element(By.TAG_NAME, "a")
                    if "2" in a.text and a.is_displayed() and a.is_enabled():
                        pag2_btn = a
                        break
                except Exception:
                    continue
            if pag2_btn:
                self.log("Botón de página 2 detectado. Avanzando...", level="INFO")
                pag2_btn.click()
                self.log("Esperando recarga de tabla para página 2...", level="INFO")
                nueva_tabla2 = finder.wait_for_new_contracts_table(timeout=20)
                if not nueva_tabla2:
                    self.log("No se detectó la tabla de la página 2. Abortando.", level="ERROR")
                    return
                self.log("Tabla página 2 lista. Descargando archivos restantes...", level="EXITO")
                paginadores2 = driver.find_elements(By.CSS_SELECTOR, ".pagination li")
                max_page = 2
                for li in paginadores2:
                    try:
                        a = li.find_element(By.TAG_NAME, "a")
                        try:
                            num = int(a.text.strip())
                            if num > max_page:
                                max_page = num
                        except Exception:
                            continue
                    except Exception:
                        continue
                is_last_page = (max_page == 2)
                downloader.download_contract_files(page_number=2, start_row=1, is_last_page=is_last_page)
                for page in range(3, max_page+1):
                    self.log(f"[UI] Avanzando a la página {page}...", level="INFO")
                    pag_btn = None
                    paginadores_n = driver.find_elements(By.CSS_SELECTOR, ".pagination li")
                    for li in paginadores_n:
                        try:
                            a = li.find_element(By.TAG_NAME, "a")
                            if str(page) in a.text and a.is_displayed() and a.is_enabled():
                                pag_btn = a
                                break
                        except Exception:
                            continue
                    if pag_btn:
                        pag_btn.click()
                        self.log(f"[UI] Esperando recarga de tabla para página {page}...", level="INFO")
                        nueva_tabla_n = finder.wait_for_new_contracts_table(timeout=20)
                        if not nueva_tabla_n:
                            self.log(f"[UI] No se detectó la tabla de la página {page}. Abortando.", level="ERROR")
                            return
                        self.log(f"[UI] Tabla página {page} lista. Descargando archivos restantes...", level="INFO")
                        is_last = (page == max_page)
                        downloader.download_contract_files(page_number=page, start_row=1, is_last_page=is_last)
            else:
                self.log("[UI] Solo una página de contratos.", level="INFO")
        except Exception as e:
            self.log(f"[UI] Error en la lógica de paginación: {e}", level="ERROR")

    # Compatibilidad con código previo
    def execute_automation_flow(self):  # pragma: no cover - simple wrapper
        self._run_flow()
