"""
Módulo: browser_manager.py
Responsable de la gestión del navegador y configuración inicial.
"""

class BrowserManager:
    """Gestión del navegador y configuración inicial."""
    def __init__(self, log_func, download_dir=None):
        self.log = log_func
        self.download_dir = download_dir
        self.driver = None

    def start_browser(self):
        """Inicia el navegador Chrome con la configuración adecuada usando webdriver-manager."""
        from selenium import webdriver
        from selenium.webdriver.chrome.service import Service
        from webdriver_manager.chrome import ChromeDriverManager
        import os
        try:
            self.log("[Selenium] Iniciando Chrome... (webdriver-manager)", level="INFO")
            service = Service(ChromeDriverManager().install())
            options = webdriver.ChromeOptions()
            options.add_experimental_option('detach', True)
            # Configurar carpeta de descargas si se especifica
            if self.download_dir:
                prefs = {
                    "download.default_directory": self.download_dir,
                    "download.prompt_for_download": False,
                    "download.directory_upgrade": True,
                    "safebrowsing.enabled": True
                }
                options.add_experimental_option("prefs", prefs)
                self.log(f"[Selenium] Carpeta de descargas configurada: {self.download_dir}", level="INFO")
            self.driver = webdriver.Chrome(service=service, options=options)
            self.log("[Selenium] Navegando a https://app.xymmetry.com/#/", level="INFO")
            self.driver.get("https://app.xymmetry.com/#/")
        except Exception as e:
            self.log(f"[ERROR Selenium] {e}", level="ERROR")

    def configure_downloads(self, download_dir):
        """Configura la carpeta de descargas del navegador."""
        self.download_dir = download_dir
        # Este método puede ser expandido si se requiere cambiar la carpeta en caliente

    def switch_to_new_tab(self):
        """Cambia el foco a la última pestaña abierta."""
        import time
        try:
            if self.driver and len(self.driver.window_handles) > 1:
                self.log("[BrowserManager] Nueva pestaña detectada - Cambiando...", level="INFO")
                self.driver.switch_to.window(self.driver.window_handles[-1])
                time.sleep(2)
        except Exception as e:
            self.log(f"[BrowserManager] Error al cambiar de pestaña: {e}", level="ERROR")

    def close_browser(self):
        """Cierra el navegador si está abierto."""
        try:
            if self.driver:
                self.driver.quit()
                self.log("[BrowserManager] Navegador cerrado.", level="EXITO")
        except Exception as e:
            self.log(f"[BrowserManager] Error al cerrar el navegador: {e}", level="ERROR")
