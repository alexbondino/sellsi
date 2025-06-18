"""
Módulo: login_handler.py
Responsable de la autenticación y verificación de login.
"""

class LoginHandler:
    """Manejo de login/autenticación."""
    def __init__(self, driver, log_func):
        self.driver = driver
        self.log = log_func

    def perform_login(self, username="jromeroy1", password="88128782Aa"):
        """Realiza el login en la página de Xymmetry."""
        from selenium.webdriver.common.by import By
        import time
        try:
            user_box = self.driver.find_element(By.NAME, "userName")
            pass_box = self.driver.find_element(By.NAME, "userPassword")
            btn_login = self.driver.find_element(By.CLASS_NAME, "submit-btn-login")
            usuario = user_box.get_attribute("value")
            contrasena = pass_box.get_attribute("value")
            self.log(f"[Login] Usuario actual: '{usuario}', Contraseña actual: '{contrasena}'", level="DEBUG")
            if not usuario or not contrasena or usuario != username:
                user_box.clear()
                pass_box.clear()
                user_box.send_keys(username)
                pass_box.send_keys(password)
                self.log("[Login] Usuario y contraseña rellenados.", level="INFO")
                btn_login.click()
                self.log("[Login] Click en Ingresar.", level="INFO")
            else:
                btn_login.click()
                self.log("[Login] Ambos campos llenos y usuario correcto, click en Ingresar.", level="INFO")
            time.sleep(2)
            if self.check_login_error():
                self.log("[Login] Usuario o contraseña incorrectos. Reintentando...", level="ADVERTENCIA")
                self.retry_login(username, password)
            else:
                self.log("[Login] Login exitoso.", level="EXITO")
        except Exception as e:
            self.log(f"[ERROR Login] {e}", level="ERROR")

    def check_login_error(self):
        """Verifica si aparece un error de login."""
        from selenium.webdriver.common.by import By
        import time
        try:
            time.sleep(1)
            modals = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Nombre de usuario o contraseña no válidos')]")
            return len(modals) > 0
        except Exception:
            return False

    def retry_login(self, username, password):
        """Reintenta el login con las credenciales proporcionadas."""
        from selenium.webdriver.common.by import By
        import time
        try:
            user_box = self.driver.find_element(By.NAME, "userName")
            pass_box = self.driver.find_element(By.NAME, "userPassword")
            user_box.clear()
            pass_box.clear()
            user_box.send_keys(username)
            pass_box.send_keys(password)
            btn_login = self.driver.find_element(By.CLASS_NAME, "submit-btn-login")
            btn_login.click()
            self.log("[Login] Reintento con credenciales.", level="ADVERTENCIA")
            time.sleep(2)
        except Exception as e:
            self.log(f"[ERROR Retry Login] {e}", level="ERROR")
