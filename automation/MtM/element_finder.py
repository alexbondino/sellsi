"""
Módulo: element_finder.py
Responsable de la búsqueda robusta de elementos con múltiples estrategias.
"""

class ElementFinder:
    """Búsqueda robusta de elementos con múltiples estrategias."""
    def __init__(self, driver, log_func):
        self.driver = driver
        self.log = log_func

    def find_with_multiple_selectors(self, selectors, timeout=10):
        """Busca un elemento usando múltiples selectores (XPATH o CSS)."""
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        wait = WebDriverWait(self.driver, timeout)

        for selector in selectors:
            try:
                if selector.startswith("//"):
                    elem = wait.until(lambda d: d.find_element(By.XPATH, selector))
                else:
                    elem = wait.until(lambda d: d.find_element(By.CSS_SELECTOR, selector))
                if getattr(elem, "is_displayed", lambda: True)() and getattr(elem, "is_enabled", lambda: True)():
                    self.log(f"[ElementFinder] Elemento encontrado con selector: {selector}", level="DEBUG")
                    return elem
            except Exception:
                continue

        self.log("[ElementFinder] No se encontró el elemento con los selectores dados.", level="ADVERTENCIA")
        return None

    def wait_for_element_visible(self, selector, timeout=20):
        """Espera a que un elemento sea visible."""
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        try:
            wait = WebDriverWait(self.driver, timeout)
            if selector.startswith("//"):
                elem = wait.until(EC.visibility_of_element_located((By.XPATH, selector)))
            else:
                elem = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, selector)))
            self.log(f"[ElementFinder] Elemento visible: {selector}", level="DEBUG")
            return elem
        except Exception as e:
            self.log(f"[ElementFinder] No se encontró elemento visible: {e}", level="ADVERTENCIA")
            return None

    def click_with_strategies(self, element):
        """Intenta hacer click en un elemento usando varias estrategias."""
        from selenium.webdriver.common.action_chains import ActionChains
        try:
            actions = ActionChains(self.driver)
            try:
                element.click()
                self.log("[ElementFinder] Click simple exitoso.", level="DEBUG")
                return True
            except Exception:
                try:
                    actions.move_to_element(element).click().perform()
                    self.log("[ElementFinder] Hover + click exitoso.", level="DEBUG")
                    return True
                except Exception:
                    try:
                        self.driver.execute_script("arguments[0].click();", element)
                        self.log("[ElementFinder] Click JS exitoso.", level="DEBUG")
                        return True
                    except Exception as e:
                        self.log(f"[ElementFinder] Fallo todas las estrategias de click: {e}", level="ERROR")
                        return False
        except Exception as e:
            self.log(f"[ElementFinder] Error en click_with_strategies: {e}", level="ERROR")
            return False

    def find_visible_elements(self, selector):
        """Devuelve todos los elementos visibles para un selector."""
        from selenium.webdriver.common.by import By
        try:
            if selector.startswith("//"):
                elems = self.driver.find_elements(By.XPATH, selector)
            else:
                elems = self.driver.find_elements(By.CSS_SELECTOR, selector)
            visibles = [e for e in elems if e.is_displayed() and e.is_enabled()]
            self.log(f"[ElementFinder] {len(visibles)} elementos visibles encontrados para: {selector}", level="DEBUG")
            return visibles
        except Exception as e:
            self.log(f"[ElementFinder] Error buscando elementos visibles: {e}", level="ERROR")
            return []

    def _get_first_row_texts(self):
        """Devuelve una lista con los textos de todas las celdas de la primera fila de #gridTable."""
        from selenium.webdriver.common.by import By
        try:
            table = self.driver.find_element(By.ID, "gridTable")
            tbody = table.find_element(By.TAG_NAME, "tbody")
            rows = tbody.find_elements(By.TAG_NAME, "tr")
            if not rows:
                return []
            first_row = rows[0]
            cells = first_row.find_elements(By.XPATH, "./th | ./td")
            return [cell.text.strip() for cell in cells]
        except Exception:
            return []

    def wait_for_spinner_to_disappear(self, timeout=15):
        """Espera a que desaparezca cualquier overlay/spinner que bloquee la tabla."""
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.invisibility_of_element_located((By.CSS_SELECTOR, '.spinner-loading-container'))
            )
            self.log('[ElementFinder] Spinner desapareció.')
        except Exception:
            self.log('[ElementFinder] Timeout esperando que desaparezca el spinner.', level="ADVERTENCIA")

    def wait_for_new_contracts_table(self, timeout=20):
        """Espera a que esté presente y visible el primer #dropdownMenuLink dentro de la tabla #gridTable tras 'Ver contratos'."""
        from selenium.webdriver.common.by import By
        import time

        try:
            self.wait_for_spinner_to_disappear(timeout=timeout)
            self.log("[ElementFinder] Esperando aparición de menú de acciones (#dropdownMenuLink) en la tabla de contratos...", level="DEBUG")
            start = time.time()
            while time.time() - start < timeout:
                try:
                    self.wait_for_spinner_to_disappear(timeout=timeout)
                    # Buscar el primer #dropdownMenuLink dentro de la tabla
                    table = self.driver.find_element(By.ID, "gridTable")
                    menu = table.find_element(By.CSS_SELECTOR, "#dropdownMenuLink")
                    if menu.is_displayed():
                        self.log("[ElementFinder] Menú de acciones detectado en la tabla de contratos.")
                        self.log_first_row_cells()
                        return table
                except Exception:
                    # No encontrado aún, seguir esperando
                    pass
                time.sleep(0.5)

            self.log("[ElementFinder] Timeout esperando menú de acciones en la tabla de contratos tras 'Ver contratos'.", level="ADVERTENCIA")
            return None
        except Exception as e:
            self.log(f"[ElementFinder] Error esperando nueva tabla de contratos: {e}", level="ERROR")
            return None

    def log_first_row_cells(self):
        """Imprime en el log el texto de todas las celdas de la primera fila de #gridTable."""
        from selenium.webdriver.common.by import By
        try:
            table = self.driver.find_element(By.ID, "gridTable")
            tbody = table.find_element(By.TAG_NAME, "tbody")
            rows = tbody.find_elements(By.TAG_NAME, "tr")
            if not rows:
                self.log("[ElementFinder] No hay filas en el tbody de #gridTable.", level="ADVERTENCIA")
                return
            first_row = rows[0]
            cells = first_row.find_elements(By.XPATH, "./th | ./td")
            for idx, cell in enumerate(cells):
                self.log(f"[ElementFinder] Fila 1, Columna {idx+1}: '{cell.text.strip()}'", level="DEBUG")
        except Exception as e:
            self.log(f"[ElementFinder] Error al loguear celdas de la primera fila: {e}", level="ERROR")
