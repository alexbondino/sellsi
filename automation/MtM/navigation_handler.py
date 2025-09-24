"""
Módulo: navigation_handler.py
Responsable de la navegación entre secciones de la aplicación.
"""

class NavigationHandler:
    """Navegación entre secciones de la aplicación."""
    def __init__(self, driver, log_func):
        self.driver = driver
        self.log = log_func

    def open_sidebar_menu(self):
        """Abre el menú lateral si está disponible."""
        from selenium.webdriver.common.by import By
        import time
        try:
            self.log("[Automatización] Buscando botón de menú lateral...", level="INFO")
            for _ in range(10):
                try:
                    menu_btn = self.driver.find_element(By.CSS_SELECTOR, "a.nav-link.icon-menu-left-link")
                    menu_btn.click()
                    self.log("[Automatización] Menú lateral abierto.", level="EXITO")
                    return True
                except Exception:
                    time.sleep(0.5)
            self.log("[Automatización] No se encontró el botón de menú lateral.", level="ADVERTENCIA")
            return False
        except Exception as e:
            self.log(f"[ERROR Navegación] {e}", level="ERROR")
            return False

    def navigate_to_mi_cartera(self):
        """Navega a la sección 'Mi cartera' y cambia de pestaña si es necesario."""
        from selenium.webdriver.common.by import By
        import time

        try:
            self.log("[Automatización] Buscando botón 'Mi cartera' en sidebar...", level="INFO")
            mi_cartera_selectors = [
                "//span[contains(@class, 'iconTextCustom') and text()='Mi cartera']",
                "//span[contains(text(), 'Mi cartera')]",
                "//a[contains(text(), 'Mi cartera')]",
                "//div[contains(text(), 'Mi cartera')]",
                "//*[contains(text(), 'Mi cartera')]",
            ]
            for _ in range(10):
                for selector in mi_cartera_selectors:
                    try:
                        cartera_btn = self.driver.find_element(By.XPATH, selector)
                        cartera_btn.location_once_scrolled_into_view
                        cartera_btn.click()
                        self.log("[Automatización] Click en 'Mi cartera'.", level="INFO")
                        time.sleep(2)
                        # Cambiar de pestaña si es necesario
                        if len(self.driver.window_handles) > 1:
                            self.log("[Automatización] Nueva pestaña detectada - Cambiando...", level="INFO")
                            self.driver.switch_to.window(self.driver.window_handles[-1])
                            time.sleep(2)
                        return True
                    except Exception:
                        continue
                time.sleep(0.5)
            self.log("[Automatización] No se encontró el botón 'Mi cartera'.", level="ADVERTENCIA")
            return False
        except Exception as e:
            self.log(f"[ERROR Navegación] {e}", level="ERROR")
            return False

    def wait_for_page_load(self, timeout=15):
        """Espera a que la página cargue completamente (puede personalizarse)."""
        from selenium.webdriver.support.ui import WebDriverWait
        try:
            WebDriverWait(self.driver, timeout).until(
                lambda d: d.execute_script('return document.readyState') == 'complete'
            )
            self.log("[Navegación] Página cargada completamente.", level="EXITO")
            return True
        except Exception as e:
            self.log(f"[Navegación] Timeout esperando carga de página: {e}", level="ERROR")
            return False
