import time
from automation.modules.browser_manager import BrowserManager
from automation.modules.login_handler import LoginHandler
from automation.modules.navigation_handler import NavigationHandler
from automation.modules.ui_controller import UIController
from automation.modules.downloader import FileDownloader
from automation.modules.element_finder import ElementFinder

class WebAutomator:
    def __init__(self, log_func):
        self.log = log_func
        self.browser = None
        self.login = None
        self.navigation = None
        self.ui = None
        self.downloader = None
        self.finder = None

    def start(self, download_dir=None):
        self.browser = BrowserManager(self.log, download_dir)
        self.browser.start_browser()
        driver = self.browser.driver
        self.login = LoginHandler(driver, self.log)
        self.navigation = NavigationHandler(driver, self.log)
        self.ui = UIController(driver, self.log)
        self.downloader = FileDownloader(driver, self.log)
        self.finder = ElementFinder(driver, self.log)
        self.execute_automation_flow()

    def execute_automation_flow(self):
        # Paso 1: Login
        self.login.perform_login()
        # Paso 2: Navegación a Mi Cartera
        self.navigation.open_sidebar_menu()
        self.navigation.navigate_to_mi_cartera()
        # Paso 3: Configurar valorización y fecha
        self.ui.select_currency('CLP')
        # Obtener la fecha seleccionada desde la UI real:
        if hasattr(self, 'get_selected_date'):
            fecha = self.get_selected_date()
        elif hasattr(self, 'date_entry') and hasattr(self.date_entry, 'get'):
            fecha = self.date_entry.get()
        else:
            fecha = '17-06-2025'  # fallback a la fecha actual
        self.log(f"[UI] Seleccionando fecha: {fecha}", level="INFO")
        self.ui.select_date(fecha)
        # Esperar a que la tabla de contratos esté visible y tenga filas
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        try:
            self.log("Esperando que la tabla de contratos esté visible y cargada...", level="INFO")
            wait = WebDriverWait(self.browser.driver, 20)
            wait.until(EC.visibility_of_element_located((By.ID, "gridTable")))
            filas = self.browser.driver.find_elements(By.XPATH, "//table[@id='gridTable']//tbody/tr")
            while not filas:
                time.sleep(0.5)
                filas = self.browser.driver.find_elements(By.XPATH, "//table[@id='gridTable']//tbody/tr")
            self.log(f"Tabla de contratos lista con {len(filas)} filas.", level="EXITO")
        except Exception as e:
            self.log(f"Error esperando la tabla de contratos: {e}", level="ERROR")
        # Paso 4: Procesar filas, abrir menú y hacer click en 'Ver contratos'
        self.downloader.process_all_rows()
        # Esperar la nueva tabla de contratos tras 'Ver contratos'
        self.log("Esperando nueva tabla de contratos tras 'Ver contratos'...", level="INFO")
        nueva_tabla = self.finder.wait_for_new_contracts_table(timeout=20)
        if not nueva_tabla:
            self.log("No se detectó la nueva tabla de contratos. Abortando descarga.", level="ERROR")
            return
        self.log("Nueva tabla de contratos lista. Procediendo a descargar Excel y archivos de contrato.", level="EXITO")
        # Paso 5: Descargar primer archivo Excel SOLO después de 'Ver contratos'
        self.downloader.download_excel_file()
        # Paso 6: Ciclo de descarga de archivos de contratos (página 1)
        self.downloader.download_contract_files()

        # --- PAGINACIÓN: Ir a página 2 si existe y procesar contratos restantes ---
        try:
            driver = self.browser.driver
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
                self.log("Botón de página 2 detectado. Avanzando a la segunda página de contratos...", level="INFO")
                pag2_btn.click()
                self.log("Esperando recarga de tabla para página 2...", level="INFO")
                nueva_tabla2 = self.finder.wait_for_new_contracts_table(timeout=20)
                if not nueva_tabla2:
                    self.log("No se detectó la tabla de contratos de la página 2. Abortando.", level="ERROR")
                    return
                self.log("Tabla de contratos de página 2 lista. Descargando archivos restantes...", level="EXITO")
                # Detectar si hay más páginas
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
                # Si solo hay 2 páginas, la segunda es la última
                is_last_page = (max_page == 2)
                self.downloader.download_contract_files(page_number=2, start_row=1, is_last_page=is_last_page)
                # Si hay más de 2 páginas, procesar las siguientes
                for page in range(3, max_page+1):
                    self.log(f"[UI] Avanzando a la página {page} de contratos...")
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
                        self.log(f"[UI] Esperando recarga de tabla para página {page}...")
                        nueva_tabla_n = self.finder.wait_for_new_contracts_table(timeout=20)
                        if not nueva_tabla_n:
                            self.log(f"[UI] No se detectó la tabla de contratos de la página {page}. Abortando.")
                            return
                        self.log(f"[UI] Tabla de contratos de página {page} lista. Descargando archivos restantes...")
                        is_last = (page == max_page)
                        self.downloader.download_contract_files(page_number=page, start_row=1, is_last_page=is_last)
            else:
                self.log("[UI] No se detectó botón de página 2. Solo una página de contratos.")
        except Exception as e:
            self.log(f"[UI] Error en la lógica de paginación: {e}")
