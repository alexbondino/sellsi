"""
Módulo: downloader.py
Responsable de la descarga de archivos y gestión del ciclo de descarga.
"""

import json
import time
from pathlib import Path
from typing import Optional

import requests
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from automation.MtM.download_tracker import DownloadTracker


class FileDownloader:
    """Descarga de archivos y gestión del ciclo de descarga."""

    def __init__(self, driver, log_func, download_dir: Optional[str] = None):
        self.driver = driver
        self.log = log_func
        self.download_root = self._prepare_download_dir(download_dir)
        self.tracker = DownloadTracker(self.download_root, log_func)

    def download_excel_file(self):
        """Descarga el archivo Excel principal."""
        session = self._start_tracking_session("excel", {"source": "excelPortfolioForward"})
        try:
            wait = WebDriverWait(self.driver, 15)
            actions = ActionChains(self.driver)
            self.log("[Descarga] Buscando botón 'Descargar en Excel' (archivo 1)...", level="INFO")
            btn_excel1 = wait.until(
                EC.element_to_be_clickable(
                    (
                        By.XPATH,
                        "//button[contains(@class, 'btn-primary-dark') and contains(., 'Descargar en Excel')]",
                    )
                )
            )
            actions.move_to_element(btn_excel1).click().perform()
            self.log("[Descarga] Archivo Excel N°1 descargando...", level="EXITO")
            time.sleep(1.5)
            if self._wait_for_tracker(session):
                return True
            self.log(
                "[Descarga] No se detectó archivo Excel. Intentando fallback via requests...",
                level="ADVERTENCIA",
            )
            fallback_path = self._fallback_excel_download()
            if fallback_path:
                self.log(
                    f"[Descarga] Fallback requests OK (Excel) -> {fallback_path.name}",
                    level="EXITO",
                )
                if session:
                    self.tracker.mark_manual_file(session, fallback_path, fallback_used=True)
                return True
            self.log("[Descarga] Fallback requests falló.", level="ERROR")
            if session:
                self.tracker.fail(session, "fallback_failed")
            return False
        except Exception as e:
            self.log(f"[ERROR Descarga Excel] {e}", level="ERROR")
            if session:
                self.tracker.fail(session, "exception")
            return False

    def process_all_rows(self):
        """Procesa cada fila del gridTable, abre menú en Col 5, prueba clicks en 'Ver contratos'."""
        try:
            wait = WebDriverWait(self.driver, 10)
            table = wait.until(EC.presence_of_element_located((By.ID, "gridTable")))
            filas = table.find_elements(By.XPATH, ".//tbody/tr")
            total_filas = len(filas)
            self.log(f"[Contratos] Total de filas detectadas: {total_filas}", level="INFO")
            for idx in range(1, total_filas + 1):
                try:
                    self.log(f"[Contratos] Procesando fila {idx} de {total_filas}", level="INFO")
                    table = self.driver.find_element(By.ID, "gridTable")
                    filas = table.find_elements(By.XPATH, ".//tbody/tr")
                    if idx > len(filas):
                        self.log(f"[Contratos] Fila {idx} ya no existe.", level="ADVERTENCIA")
                        continue
                    fila = filas[idx - 1]
                    columnas = fila.find_elements(By.XPATH, ".//th | .//td")
                    if len(columnas) < 5:
                        self.log(
                            f"[Contratos] Fila {idx} tiene solo {len(columnas)} columnas.",
                            level="ADVERTENCIA",
                        )
                        continue
                    col5 = columnas[4]
                    menu_abierto = False
                    for nombre in ["click simple", "hover+click", "JS click", "doble click"]:
                        try:
                            col5_fresh = self.driver.find_elements(
                                By.XPATH,
                                f"//table[@id='gridTable']//tbody/tr[{idx}]/td[5] | //table[@id='gridTable']//tbody/tr[{idx}]/th[5]",
                            )
                            if not col5_fresh:
                                self.log(
                                    f"[Contratos] No se pudo refrescar col5 en Fila {idx}.",
                                    level="ADVERTENCIA",
                                )
                                continue
                            btns = col5_fresh[0].find_elements(
                                By.CSS_SELECTOR, "span.icon-c_menuItem"
                            )
                            if not btns:
                                self.log(
                                    f"[Contratos] No se encontró botón de menú en Fila {idx}, Col 5 (refrescado).",
                                    level="ADVERTENCIA",
                                )
                                continue
                            btn_menu = btns[0]
                            self.driver.execute_script(
                                "arguments[0].scrollIntoView({block: 'center'});", btn_menu
                            )
                            actions = ActionChains(self.driver)
                            funcion = {
                                "click simple": lambda: btn_menu.click(),
                                "hover+click": (
                                    lambda: actions.move_to_element(btn_menu).click().perform()
                                ),
                                "JS click": lambda: self.driver.execute_script(
                                    "arguments[0].click();", btn_menu
                                ),
                                "doble click": lambda: actions.double_click(btn_menu).perform(),
                            }[nombre]
                            funcion()
                            self.log(
                                f"[Contratos] {nombre} en botón menú Fila {idx} Col 5 OK",
                                level="DEBUG",
                            )
                            time.sleep(1)
                            dropdowns = col5_fresh[0].find_elements(
                                By.CSS_SELECTOR, ".dropdown-menu"
                            )
                            if any(d.is_displayed() for d in dropdowns):
                                menu_abierto = True
                                col5 = col5_fresh[0]
                                break
                        except Exception as e:
                            self.log(f"[Contratos] {nombre} falló: {e}", level="DEBUG")
                    if not menu_abierto:
                        self.log(
                            f"[Contratos] No se pudo abrir el menú de acciones en Fila {idx} Col 5.",
                            level="ADVERTENCIA",
                        )
                        continue
                    ver_contratos = None
                    for d in col5.find_elements(By.CSS_SELECTOR, ".dropdown-menu"):
                        links = d.find_elements(By.XPATH, ".//a[contains(text(), 'Ver contratos')]")
                        if links:
                            ver_contratos = links[0]
                            break
                    if not ver_contratos:
                        self.log(
                            f"[Contratos] No se encontró opción 'Ver contratos' en el menú de Fila {idx} Col 5.",
                            level="ADVERTENCIA",
                        )
                        continue
                    for nombre in ["click simple", "hover+click", "JS click", "doble click"]:
                        try:
                            actions = ActionChains(self.driver)
                            if ver_contratos is None:
                                continue
                            acciones_map = {
                                "click simple": lambda elem=ver_contratos: elem.click(),
                                "hover+click": (
                                    lambda elem=ver_contratos: actions.move_to_element(elem)
                                    .click()
                                    .perform()
                                ),
                                "JS click": lambda elem=ver_contratos: self.driver.execute_script(
                                    "arguments[0].click();", elem
                                ),
                                "doble click": (
                                    lambda elem=ver_contratos: actions.double_click(elem).perform()
                                ),
                            }
                            accion = acciones_map.get(nombre)
                            if accion:
                                accion()
                            self.log(f"[Contratos] {nombre} en 'Ver contratos' OK", level="EXITO")
                            time.sleep(1)
                            break
                        except Exception as e:
                            self.log(
                                f"[Contratos] {nombre} en 'Ver contratos' falló: {e}", level="ERROR"
                            )
                except Exception as e:
                    self.log(f"[ERROR Contratos] Error en fila {idx}: {e}", level="ERROR")
                    continue
        except Exception as e:
            self.log(f"[ERROR Contratos] Error general: {e}", level="ERROR")

    def download_contract_files(self, page_number=None, start_row=1, is_last_page=False):
        """Descarga los archivos de contrato para cada fila de la nueva tabla de contratos.
        Si page_number > 1, después de cada descarga vuelve a la página y continúa desde la fila siguiente.
        Si is_last_page=True, muestra el mensaje final de éxito al terminar.
        """
        try:
            from selenium.webdriver.common.by import By
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC

            wait = WebDriverWait(self.driver, 15)
            # Si se especifica page_number > 1, ir a esa página antes de empezar
            if page_number and page_number > 1:
                self._go_to_page(page_number)
            table = wait.until(EC.presence_of_element_located((By.ID, "gridTable")))
            filas = table.find_elements(By.XPATH, ".//tbody/tr")
            total_filas = len(filas)
            self.log(
                f"[Contratos] Iniciando loop de descarga de contratos. Total filas: {total_filas}",
                level="INFO",
            )
            idx = start_row
            while idx <= total_filas:
                try:
                    # Refrescar tabla y filas en cada iteración
                    table = self.driver.find_element(By.ID, "gridTable")
                    filas = table.find_elements(By.XPATH, ".//tbody/tr")
                    if idx > len(filas):
                        self.log(f"[Contratos] Fila {idx} ya no existe.", level="ADVERTENCIA")
                        idx += 1
                        continue
                    fila = filas[idx - 1]
                    columnas = fila.find_elements(By.XPATH, ".//th | .//td")
                    if len(columnas) < 18:
                        self.log(
                            f"[Contratos] Fila {idx} tiene solo {len(columnas)} columnas.",
                            level="ADVERTENCIA",
                        )
                        idx += 1
                        continue
                    nombre_archivo = columnas[4].text.strip()
                    self.log(
                        f"[Contrato: {nombre_archivo}] Procesando fila {idx} de {total_filas}",
                        level="INFO",
                    )
                    col18 = columnas[17]
                    btns = col18.find_elements(By.CSS_SELECTOR, "span.icon-c_menuItem")
                    if not btns:
                        self.log(
                            f"[Contrato: {nombre_archivo}] No se encontró botón menú en Col 18.",
                            level="ADVERTENCIA",
                        )
                        idx += 1
                        continue
                    btn_menu = btns[0]
                    self.driver.execute_script(
                        "arguments[0].scrollIntoView({block: 'center'});", btn_menu
                    )
                    from selenium.webdriver.common.action_chains import ActionChains

                    actions = ActionChains(self.driver)
                    menu_abierto = False
                    for nombre_click, funcion in [
                        ("click simple", lambda: btn_menu.click()),
                        (
                            "hover+click",
                            lambda: actions.move_to_element(btn_menu).click().perform(),
                        ),
                        (
                            "JS click",
                            lambda: self.driver.execute_script("arguments[0].click();", btn_menu),
                        ),
                        ("doble click", lambda: actions.double_click(btn_menu).perform()),
                    ]:
                        try:
                            funcion()
                            self.log(
                                f"[Contrato: {nombre_archivo}] {nombre_click} en menú Col 18 OK",
                                level="DEBUG",
                            )
                            import time

                            time.sleep(1)
                            dropdowns = col18.find_elements(By.CSS_SELECTOR, ".dropdown-menu")
                            if any(d.is_displayed() for d in dropdowns):
                                menu_abierto = True
                                break
                        except Exception as e:
                            self.log(
                                f"[Contrato: {nombre_archivo}] {nombre_click} en menú Col 18 falló: {e}",
                                level="DEBUG",
                            )
                    if not menu_abierto:
                        self.log(
                            f"[Contrato: {nombre_archivo}] No se pudo abrir menú en Col 18.",
                            level="ADVERTENCIA",
                        )
                        idx += 1
                        continue
                    editar = None
                    for d in col18.find_elements(By.CSS_SELECTOR, ".dropdown-menu"):
                        links = d.find_elements(By.XPATH, ".//a[contains(text(), 'Editar')]")
                        if links:
                            editar = links[0]
                            break
                    if not editar:
                        self.log(
                            f"[Contrato: {nombre_archivo}] No se encontró opción 'Editar' en menú.",
                            level="ADVERTENCIA",
                        )
                        idx += 1
                        continue
                    editar_ok = False
                    for nombre_click, funcion in [
                        ("click simple", lambda: editar and editar.click()),
                        (
                            "hover+click",
                            lambda: editar and actions.move_to_element(editar).click().perform(),
                        ),
                        (
                            "JS click",
                            lambda: editar
                            and self.driver.execute_script("arguments[0].click();", editar),
                        ),
                        ("doble click", lambda: editar and actions.double_click(editar).perform()),
                    ]:
                        try:
                            funcion()
                            self.log(
                                f"[Contrato: {nombre_archivo}] {nombre_click} en 'Editar' OK",
                                level="EXITO",
                            )
                            editar_ok = True
                            import time

                            time.sleep(1)
                            break
                        except Exception as e:
                            self.log(
                                f"[Contrato: {nombre_archivo}] {nombre_click} en 'Editar' falló: {e}",
                                level="ERROR",
                            )
                    if not editar_ok:
                        self.log(
                            f"[Contrato: {nombre_archivo}] No se pudo hacer click en 'Editar'.",
                            level="ADVERTENCIA",
                        )
                        idx += 1
                        continue
                    # Esperar vista de detalle
                    try:
                        wait_detalle = WebDriverWait(self.driver, 15)
                        wait_detalle.until(
                            EC.presence_of_element_located(
                                (By.XPATH, "//label[contains(text(), 'Descargar Contrato')]")
                            )
                        )
                        self.log(
                            f"[Contrato: {nombre_archivo}] Vista de detalle cargada.", level="INFO"
                        )
                    except Exception as e:
                        self.log(
                            f"[Contrato: {nombre_archivo}] No se detectó vista de detalle: {e}",
                            level="ERROR",
                        )
                        idx += 1
                        continue
                    # Buscar y clickear botón 'Descargar Contrato'
                    session = self._start_tracking_session(
                        "contract",
                        {
                            "contract_name": nombre_archivo,
                            "row": str(idx),
                            "page": str(page_number or 1),
                        },
                    )
                    descargado = False
                    for intento in range(1, 4):
                        try:
                            btns_desc = self.driver.find_elements(
                                By.XPATH,
                                "//label[contains(text(), 'Descargar Contrato')]/ancestor::a",
                            )
                            if not btns_desc:
                                self.log(
                                    f"[Contrato: {nombre_archivo}] No se encontró botón 'Descargar Contrato'.",
                                    level="ADVERTENCIA",
                                )
                                break
                            btn_desc = btns_desc[0]
                            self.driver.execute_script(
                                "arguments[0].scrollIntoView({block: 'center'});", btn_desc
                            )
                            for nombre_click, funcion in [
                                ("click simple", lambda: btn_desc and btn_desc.click()),
                                (
                                    "hover+click",
                                    lambda: btn_desc
                                    and actions.move_to_element(btn_desc).click().perform(),
                                ),
                                (
                                    "JS click",
                                    lambda: btn_desc
                                    and self.driver.execute_script(
                                        "arguments[0].click();", btn_desc
                                    ),
                                ),
                                (
                                    "doble click",
                                    lambda: btn_desc and actions.double_click(btn_desc).perform(),
                                ),
                            ]:
                                try:
                                    funcion()
                                    self.log(
                                        f"[Descarga] [Contrato: {nombre_archivo}] {nombre_click} en 'Descargar Contrato' OK",
                                        level="EXITO",
                                    )
                                    descargado = True
                                    import time

                                    time.sleep(2)
                                    break
                                except Exception as e:
                                    self.log(
                                        f"[Contrato: {nombre_archivo}] {nombre_click} en 'Descargar Contrato' falló: {e}",
                                        level="ERROR",
                                    )
                            if descargado:
                                if not self._wait_for_tracker(session):
                                    self.tracker.fail(session, "timeout")
                                break
                        except Exception as e:
                            self.log(
                                f"[Contrato: {nombre_archivo}] Error buscando/clickeando 'Descargar Contrato': {e}",
                                level="ERROR",
                            )
                    if not descargado:
                        self.log(
                            f"[Contrato: {nombre_archivo}] No se pudo descargar el contrato.",
                            level="ADVERTENCIA",
                        )
                        if session:
                            self.tracker.fail(session, "click_failed")
                    # Click en 'Cancelar' para volver a la tabla principal
                    try:
                        btn_cancelar = self.driver.find_element(
                            By.XPATH,
                            "//button[contains(@class, 'btn-primary-dark') and contains(text(), 'Cancelar')]",
                        )
                        self.driver.execute_script(
                            "arguments[0].scrollIntoView({block: 'center'});", btn_cancelar
                        )
                        btn_cancelar.click()
                        self.log(
                            f"[Contrato: {nombre_archivo}] Click en 'Cancelar' OK. Esperando tabla principal...",
                            level="INFO",
                        )
                        # Esperar que la tabla principal esté visible
                        wait_tabla = WebDriverWait(self.driver, 20)
                        wait_tabla.until(EC.visibility_of_element_located((By.ID, "gridTable")))
                        import time

                        time.sleep(1)
                        # Si estamos en página > 1, volver a la página y continuar desde la siguiente fila
                        if page_number and page_number > 1:
                            self._go_to_page(page_number)
                            # refrescar filas y total_filas por si la tabla cambió
                            table = wait.until(EC.presence_of_element_located((By.ID, "gridTable")))
                            filas = table.find_elements(By.XPATH, ".//tbody/tr")
                            total_filas = len(filas)
                    except Exception as e:
                        self.log(
                            f"[Contrato: {nombre_archivo}] Error al volver a la tabla principal: {e}",
                            level="ERROR",
                        )
                    idx += 1
                except Exception as e:
                    self.log(f"[ERROR Contrato] Error en fila {idx}: {e}", level="ERROR")
                    idx += 1
                    continue
            self.log("[Contratos] Loop de descarga de contratos finalizado.", level="INFO")
            if is_last_page:
                self.log(
                    '✅ Las Descargas se han realizado con exito!, revisa el directorio "input directorio", para verificar y luego como validacion final ejecutalo en el Macro de Excel MtM, Exito!',
                    level="EXITO",
                )
                from components.mensajes import GestorMensajes

                GestorMensajes.mostrar_info(
                    "✅ Proceso Finalizado",
                    "✅ Proceso Finalizado\n\nContinua con el Macro en Excel MtM! ✅",
                )
        except Exception as e:
            self.log(
                f"[ERROR Contratos] Error general en descarga de contratos: {e}", level="ERROR"
            )

    def get_completed_downloads(self):
        if not self.tracker:
            return []
        return self.tracker.get_completed_sessions()

    def _go_to_page(self, page_number):
        """Navega a la página indicada en la paginación de la tabla de contratos."""
        from selenium.webdriver.common.by import By
        import time

        paginadores = self.driver.find_elements(By.CSS_SELECTOR, ".pagination li")
        for li in paginadores:
            try:
                a = li.find_element(By.TAG_NAME, "a")
                if str(page_number) in a.text and a.is_displayed() and a.is_enabled():
                    a.click()
                    self.log(
                        f"[Contratos] Navegando manualmente a la página {page_number}...",
                        level="INFO",
                    )
                    time.sleep(1)
                    break
            except Exception:
                continue

    # ----------------- NUEVOS MÉTODOS DE FALLBACK -----------------
    def _collect_performance_entries(self):
        entries = []
        try:
            raw = self.driver.get_log("performance")
            for r in raw:
                try:
                    msg = json.loads(r["message"])["message"]
                    entries.append(msg)
                except Exception:
                    continue
        except Exception:
            pass
        return entries

    def _detect_recent_download(self):
        """Heurística: buscar en performance log una respuesta con cabecera content-type Excel o un POST a excelPortfolioForward."""
        entries = self._collect_performance_entries()
        for e in entries[-200:]:  # limitar inspección
            if e.get("method") == "Network.responseReceived":
                params = e.get("params", {})
                response = params.get("response", {})
                url = response.get("url", "")
                if "excelPortfolioForward" in url and response.get("status") == 200:
                    return True
                ctype = response.get("headers", {}).get("Content-Type", "").lower()
                if "application/vnd.ms-excel" in ctype or "spreadsheetml" in ctype:
                    return True
        return False

    def _fallback_excel_download(self) -> Optional[Path]:
        """Replica el POST necesario para obtener el Excel. Devuelve la ruta del archivo o None."""
        try:
            # 1. Intentar encontrar el último POST con body a excelPortfolioForward
            entries = self._collect_performance_entries()
            post_body = None
            post_headers = {}
            post_url = None
            for e in reversed(entries):
                if e.get("method") == "Network.requestWillBeSent":
                    params = e.get("params", {})
                    req = params.get("request", {})
                    url = req.get("url", "")
                    if "excelPortfolioForward" in url and req.get("method") == "POST":
                        post_url = url
                        post_body = req.get("postData")
                        # headers base (filtrados)
                        for hk, hv in req.get("headers", {}).items():
                            lk = hk.lower()
                            if lk in ("accept", "content-type", "user-agent", "referer"):
                                post_headers[hk] = hv
                        break
            if not post_url:
                self.log(
                    "[Fallback] No se encontró request POST excelPortfolioForward en logs.",
                    level="ERROR",
                )
                return None
            # 2. Construir sesión requests con cookies
            sess = requests.Session()
            for c in self.driver.get_cookies():
                try:
                    sess.cookies.set(c["name"], c["value"], domain=c.get("domain"))
                except Exception:
                    continue
            # 3. Headers mínimos
            if "User-Agent" not in post_headers:
                post_headers["User-Agent"] = self.driver.execute_script(
                    "return navigator.userAgent;"
                )
            if "Referer" not in post_headers:
                post_headers["Referer"] = self.driver.current_url
            # 4. Hacer POST
            self.log(f"[Fallback] POST a {post_url}", level="INFO")
            data = post_body if post_body else ""
            resp = sess.post(post_url, data=data, headers=post_headers, timeout=60)
            if resp.status_code != 200:
                self.log(f"[Fallback] Status inesperado: {resp.status_code}", level="ERROR")
                return None
            # 5. Segundo paso: a veces el Excel viene en una segunda petición GET; buscar redirect
            content_type = resp.headers.get("Content-Type", "").lower()
            if "json" in content_type and "application/json" in content_type:
                # Podría ser que el server devuelve un token/URL; intentar parsear
                try:
                    j = resp.json()
                    possible_url = j.get("url") or j.get("downloadUrl")
                    if possible_url:
                        self.log(
                            "[Fallback] Encontrada URL secundaria, descargando...", level="INFO"
                        )
                        sec = sess.get(possible_url, headers=post_headers, timeout=60)
                        if sec.status_code == 200:
                            resp = sec
                            content_type = resp.headers.get("Content-Type", "").lower()
                except Exception:
                    pass
            # 6. Validar si es Excel
            if not any(x in content_type for x in ["excel", "spreadsheet"]):
                # Puede que llegue octet-stream igualmente válido
                if "application/octet-stream" not in content_type:
                    self.log(
                        f"[Fallback] Content-Type no parece Excel: {content_type}",
                        level="ADVERTENCIA",
                    )
            # 7. Guardar archivo
            download_dir = self._resolve_download_dir()
            fname = "portfolio_forward.xlsx"
            target = download_dir / fname
            with open(target, "wb") as f:
                f.write(resp.content)
            self.log(f"[Fallback] Archivo guardado en {target}", level="EXITO")
            return target
        except Exception as e:
            self.log(f"[Fallback] Error descargando Excel: {e}", level="ERROR")
            return None

    def _resolve_download_dir(self):
        return self.download_root

    def _prepare_download_dir(self, download_dir: Optional[str]) -> Path:
        base = Path(download_dir).resolve() if download_dir else Path("./descargas_excel").resolve()
        base.mkdir(parents=True, exist_ok=True)
        return base

    def _start_tracking_session(self, download_type: str, metadata: Optional[dict] = None):
        try:
            return self.tracker.begin(download_type, metadata)
        except Exception as exc:
            self.log(f"[Tracker] No se pudo iniciar sesión ({download_type}): {exc}", level="ERROR")
            return None

    def _wait_for_tracker(self, session) -> bool:
        if not session:
            return False
        result = self.tracker.wait_for_file(session)
        if result:
            self.log(
                f"[Tracker] Sesión {session.session_id}: archivo {result.file_info.path.name} detectado.",
                level="INFO",
            )
            return True
        return False
