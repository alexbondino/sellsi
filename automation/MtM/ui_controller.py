"""
Módulo: ui_controller.py
Responsable de interacciones con elementos UI (dropdowns, formularios, date pickers).
"""

class UIController:
    """Interacciones UI (dropdowns, formularios, date pickers)."""
    def __init__(self, driver, log_func):
        self.driver = driver
        self.log = log_func

    def select_currency(self, currency='CLP'):
        """Selecciona la moneda en el dropdown de valorización, robusto como en la versión pre-modular."""
        from selenium.webdriver.common.by import By
        from selenium.webdriver.common.action_chains import ActionChains
        from selenium.webdriver.support.ui import WebDriverWait
        import time
        try:
            self.log(f"[UI] Buscando dropdown de valorización para seleccionar '{currency}'...", level="INFO")
            valorizar_box = None
            # Buscar el dropdown con múltiples estrategias
            for intento in range(5):
                try:
                    valorizar_box = self.driver.find_element(By.CSS_SELECTOR, "div.orange-font-color.dropdown-menu-label.mr-3")
                    break
                except Exception:
                    try:
                        valorizar_box = self.driver.find_element(By.XPATH, "//div[contains(@class, 'dropdown-menu-label') and (.//text()[contains(., 'Valorizar')] or .//text()[contains(., 'USD')] or .//text()[contains(., 'CLP')])]")
                        break
                    except Exception:
                        self.log(f"[UI] Intento {intento+1}/5: Esperando dropdown...", level="DEBUG")
                        time.sleep(2)
            if not valorizar_box:
                self.log("[UI] No se pudo encontrar el dropdown de valorización.", level="ERROR")
                return False
            # Abrir el dropdown con todas las estrategias posibles
            dropdown_abierto = False
            actions = ActionChains(self.driver)
            for estrategia in range(4):
                try:
                    if estrategia == 0:
                        actions.move_to_element(valorizar_box).click().perform()
                    elif estrategia == 1:
                        valorizar_box.click()
                    elif estrategia == 2:
                        self.driver.execute_script("arguments[0].click();", valorizar_box)
                    elif estrategia == 3:
                        actions.double_click(valorizar_box).perform()
                    time.sleep(1)
                    # Esperar a que aparezca alguna opción con CLP
                    WebDriverWait(self.driver, 3).until(
                        lambda d: len(d.find_elements(By.XPATH, "//*[contains(text(), 'CLP') and (contains(@class, 'dropdown-item') or contains(@class, 'option') or contains(@class, 'item'))]")) > 0
                    )
                    dropdown_abierto = True
                    break
                except Exception:
                    continue
            if not dropdown_abierto:
                self.log("[UI] No se pudo abrir el dropdown de valorización.", level="ERROR")
                return False
            # --- NUEVO: Forzar apertura del dropdown con JS y esperar el menú ---
            try:
                self.driver.execute_script("arguments[0].dispatchEvent(new MouseEvent('mouseover', {bubbles:true}));", valorizar_box)
                time.sleep(0.2)
                self.driver.execute_script("arguments[0].click();", valorizar_box)
                time.sleep(0.5)
                # Esperar a que aparezca algún dropdown-menu visible
                WebDriverWait(self.driver, 5).until(
                    lambda d: any(e.is_displayed() for e in d.find_elements(By.CSS_SELECTOR, '.dropdown-menu'))
                )
                self.log("[DEBUG UI] Dropdown de valorización abierto (forzado JS)", level="DEBUG")
            except Exception as e:
                self.log(f"[DEBUG UI] No se pudo forzar apertura dropdown: {e}", level="DEBUG")
            # Buscar y seleccionar la opción CLP con todos los selectores posibles
            selectores = [
                f"//a[contains(@class, 'dropdown-item') and normalize-space(text())='{currency}']",
                f"//a[contains(@class, 'dropdown-item') and contains(text(), '{currency}')]",
                f"//li//a[text()='{currency}']",
                f"//*[contains(@class, 'dropdown-item') and text()='{currency}']",
                f"//*[text()='{currency}' and contains(@class, 'dropdown-item')]",
                f"//div[contains(@class, 'dropdown-item') and contains(text(), '{currency}')]",
                f"//span[contains(text(), '{currency}')]//parent::*[contains(@class, 'dropdown-item')]",
                f"//*[contains(@class, 'option') and contains(text(), '{currency}')]",
                f"//button[contains(text(), '{currency}')]",
                f"//*[contains(text(), '{currency}') and (contains(@class, 'item') or contains(@class, 'option') or contains(@class, 'button'))]"
            ]
            clp_encontrado = False
            # Log de debug: estructura del dropdown antes de buscar CLP
            try:
                dropdowns = self.driver.find_elements(By.XPATH, "//*[contains(@class, 'dropdown') or contains(@class, 'menu')]")
                self.log(f"[DEBUG UI] Dropdowns/menus visibles: {len(dropdowns)}", level="DEBUG")
                for i, d in enumerate(dropdowns[:5]):
                    self.log(f"[DEBUG UI] Dropdown {i+1}: tag={d.tag_name}, class={d.get_attribute('class')}, visible={d.is_displayed()}", level="DEBUG")
                clp_candidates = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'CLP')]")
                self.log(f"[DEBUG UI] Elementos con texto 'CLP': {len(clp_candidates)}", level="DEBUG")
                for i, c in enumerate(clp_candidates[:5]):
                    self.log(f"[DEBUG UI] CLP {i+1}: tag={c.tag_name}, class={c.get_attribute('class')}, visible={c.is_displayed()}", level="DEBUG")
            except Exception as e:
                self.log(f"[DEBUG UI] Error inspeccionando estructura dropdown: {e}", level="DEBUG")
            for intento in range(5):
                for selector in selectores:
                    try:
                        clp_btn = self.driver.find_element(By.XPATH, selector)
                        if clp_btn.is_displayed() and clp_btn.is_enabled():
                            try:
                                clp_btn.click()
                            except Exception:
                                self.driver.execute_script("arguments[0].click();", clp_btn)
                            self.log(f"[UI] '{currency}' seleccionado.", level="INFO")
                            clp_encontrado = True
                            break
                    except Exception:
                        continue
                if clp_encontrado:
                    break
                self.log(f"[UI] Intento {intento+1}/5: No se encontró la opción '{currency}'. Reintentando...", level="ADVERTENCIA")
                time.sleep(2)
            if not clp_encontrado:
                self.log(f"[UI] No se pudo seleccionar la opción '{currency}'.", level="ERROR")
                return False
            # Cerrar el dropdown haciendo click fuera
            try:
                body = self.driver.find_element(By.TAG_NAME, "body")
                actions.move_to_element_with_offset(body, 10, 10).click().perform()
                time.sleep(0.5)
            except Exception:
                pass
            self.log(f"[UI] Valorización '{currency}' configurada con éxito.", level="EXITO")
            return True
        except Exception as e:
            self.log(f"[ERROR UI] {e}", level="ERROR")
            return False

    def select_date(self, date_string):
        """Selecciona la fecha en el date picker (formato dd-mm-yyyy)."""
        from selenium.webdriver.common.by import By
        import time
        try:
            dia, mes, anio = date_string.split("-")
            self.log(f"[UI] Seleccionando fecha: {date_string}", level="INFO")
            # Abrir date picker
            self.open_date_picker()
            time.sleep(1)
            # Seleccionar año
            for intento in range(5):
                try:
                    year_btn = self.driver.find_element(By.CSS_SELECTOR, "button.headerlabelbtn.yearlabel")
                    anio_actual = year_btn.text.strip()
                    if anio_actual != anio:
                        year_btn.click()
                        time.sleep(0.5)
                    else:
                        break
                except Exception:
                    time.sleep(0.5)
            # Seleccionar mes
            mes_objetivo = self.mes_nombre(int(mes))
            for intento in range(5):
                try:
                    month_btn = self.driver.find_element(By.CSS_SELECTOR, "button.headerlabelbtn.monthlabel")
                    mes_actual = month_btn.text.strip()
                    if mes_actual.lower()[:3] != mes_objetivo.lower()[:3]:
                        month_btn.click()
                        time.sleep(0.5)
                    else:
                        break
                except Exception:
                    time.sleep(0.5)
            # Seleccionar día
            dia_int = int(dia)
            selectores_dia = [
                f"//td[contains(@class, 'daycell') and .//span[text()='{dia_int}']]",
                f"//td[.//span[text()='{dia_int}']]",
                f"//span[text()='{dia_int}']//parent::td",
                f"//td[text()='{dia_int}']",
                f"//*[contains(@class, 'day') and text()='{dia_int}']",
                f"//button[text()='{dia_int}']"
            ]
            # --- DEBUG: Log de días disponibles en el date picker ---
            try:
                daycells = self.driver.find_elements(By.CSS_SELECTOR, '.daycell')
                self.log(f"[DEBUG UI] daycell encontrados: {len(daycells)}", level="DEBUG")
                for i, d in enumerate(daycells[:10]):
                    span = d.find_element(By.TAG_NAME, 'span') if d.find_elements(By.TAG_NAME, 'span') else None
                    valor = span.text if span else '(sin span)'
                    self.log(f"[DEBUG UI] daycell {i+1}: class={d.get_attribute('class')}, valor={valor}, enabled={d.is_enabled()}, visible={d.is_displayed()}", level="DEBUG")
            except Exception as e:
                self.log(f"[DEBUG UI] Error inspeccionando daycells: {e}", level="DEBUG")
            for intento in range(10):
                for selector in selectores_dia:
                    try:
                        day_btn = self.driver.find_element(By.XPATH, selector)
                        if day_btn.is_displayed() and day_btn.is_enabled():
                            day_btn.click()
                            self.log(f"[UI] Día {dia_int} seleccionado.", level="INFO")
                            return True
                    except Exception:
                        continue
                time.sleep(0.5)
            self.log(f"[UI] No se pudo seleccionar el día {dia_int}.", level="ERROR")
            return False
        except Exception as e:
            self.log(f"[ERROR UI] {e}", level="ERROR")
            return False

    def open_date_picker(self):
        """Abre el date picker usando múltiples selectores."""
        from selenium.webdriver.common.by import By
        import time
        selectores = [
            "div.orange-font-color.dropdown-menu-label.mr-3 + my-date-picker button.btnpicker",
            "my-date-picker button.btnpicker",
            "button.btnpicker",
            ".date-picker button",
            ".datepicker button",
            "input[type='date'] + button",
            "input.selection.inputnoteditable + button",
            ".calendar-icon",
            ".fa-calendar",
            "[class*='calendar'] button",
            "[class*='date'] button",
            "//button[contains(@class, 'picker') or contains(@class, 'calendar') or contains(@class, 'date')]",
            "//my-date-picker//button",
            "//div[contains(@class, 'date')]//button"
        ]
        for intento in range(5):
            for selector in selectores:
                try:
                    if selector.startswith("//"):
                        btn = self.driver.find_element(By.XPATH, selector)
                    else:
                        btn = self.driver.find_element(By.CSS_SELECTOR, selector)
                    self.driver.execute_script("arguments[0].scrollIntoView(true);", btn)
                    time.sleep(0.5)
                    try:
                        btn.click()
                    except Exception:
                        self.driver.execute_script("arguments[0].click();", btn)
                    self.log(f"[UI] Date picker abierto con selector: {selector}", level="INFO")
                    return True
                except Exception:
                    continue
            time.sleep(3)
        self.log("[UI] No se pudo abrir el date picker.", level="ERROR")
        return False

    def mes_nombre(self, mes_num):
        meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
        return meses[mes_num-1]
