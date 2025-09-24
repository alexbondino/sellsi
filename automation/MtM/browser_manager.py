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
        """Inicia el navegador Chrome con configuración de descargas y logging de red."""
        from selenium import webdriver
        from selenium.webdriver.chrome.service import Service
        from webdriver_manager.chrome import ChromeDriverManager
        import pathlib
        try:
            self.log("[Selenium] Iniciando Chrome... (webdriver-manager)", level="INFO")
            service = Service(ChromeDriverManager().install())
            options = webdriver.ChromeOptions()
            options.add_experimental_option('detach', True)
            # Forzar perfil persistente para mantener cookies/sesión (mitiga problemas de token)
            profile_dir = pathlib.Path('./chrome_profile').resolve()
            profile_dir.mkdir(parents=True, exist_ok=True)
            options.add_argument(f"--user-data-dir={profile_dir}")
            # Configurar carpeta de descargas
            if self.download_dir:
                dl_path = pathlib.Path(self.download_dir).resolve()
                dl_path.mkdir(parents=True, exist_ok=True)
                prefs = {
                    "download.default_directory": str(dl_path),
                    "download.prompt_for_download": False,
                    "download.directory_upgrade": True,
                    "safebrowsing.enabled": True
                }
                options.add_experimental_option("prefs", prefs)
                self.log(f"[Selenium] Carpeta de descargas configurada: {dl_path}", level="INFO")
            # Logging performance / network (Selenium 4: usar set_capability)
            options.set_capability('goog:loggingPrefs', {"performance": "ALL", "browser": "ALL"})
            self.driver = webdriver.Chrome(service=service, options=options)
            # Habilitar descarga vía CDP (si permitido)
            try:
                self.driver.execute_cdp_cmd("Page.setDownloadBehavior", {
                    "behavior": "allow",
                    "downloadPath": str(pathlib.Path(self.download_dir).resolve()) if self.download_dir else str(profile_dir)
                })
                self.log("[Selenium] Page.setDownloadBehavior aplicado.", level="DEBUG")
            except Exception as e:
                self.log(f"[Selenium] No se pudo aplicar setDownloadBehavior: {e}", level="DEBUG")
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
