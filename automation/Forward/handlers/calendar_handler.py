"""
CalendarHandler - Responsabilidad: Interacción con calendarios my-date-picker

Principio de Responsabilidad Única (SRP):
- Navegar calendario a mes/año específico
- Seleccionar día específico
- Manejo de estados del calendario (abierto/cerrado)
"""

from datetime import datetime
from typing import Callable, TYPE_CHECKING
import time

if TYPE_CHECKING:
    from selenium.webdriver.remote.webdriver import WebDriver

from selenium.webdriver.common.by import By


class CalendarHandler:
    """
    Manejador especializado en calendarios my-date-picker.
    
    Responsabilidades:
    - Navegar entre meses/años
    - Seleccionar días
    - Validar estados del calendario
    """
    
    # Mapeo de nombres de meses (calendario puede estar en inglés o español)
    MESES_MAP = {
        "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
        "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
        "ene": 1, "feb": 2, "mar": 3, "abr": 4, "may": 5, "jun": 6,
        "jul": 7, "ago": 8, "sep": 9, "oct": 10, "nov": 11, "dic": 12
    }
    
    def __init__(self, driver: "WebDriver", log_callback: Callable):
        """
        Args:
            driver: Instancia de Selenium WebDriver
            log_callback: Función para logging
        """
        self.driver = driver
        self.log = log_callback
    
    def configurar_fecha(self, input_xpath: str, fecha: datetime, nombre_campo: str):
        """
        Configura una fecha en un input con calendario my-date-picker.
        
        Args:
            input_xpath: XPath del input del calendario
            fecha: Fecha a configurar
            nombre_campo: Nombre del campo (para logs)
        """
        try:
            # 1. Click en el input para abrir calendario
            input_elem = self.driver.find_element(By.XPATH, input_xpath)
            input_elem.click()
            time.sleep(1)
            
            # 2. Navegar al mes y año correctos
            self.navegar_a_fecha(fecha)
            
            # 3. Seleccionar el día
            self.seleccionar_dia(fecha.day)
            
            # 4. Esperar a que el calendario se cierre
            time.sleep(1.5)
            
            # 5. Verificar (solo log)
            try:
                input_elem = self.driver.find_element(By.XPATH, input_xpath)
                valor_input = input_elem.get_attribute("value")
                self.log(f"[Calendar]    └─ Valor en {nombre_campo}: '{valor_input}'", level="INFO")
            except:
                pass
            
            self.log(f"[Calendar] ✅ Fecha {nombre_campo} configurada", level="EXITO")
            
        except Exception as e:
            self.log(f"[Calendar] ❌ Error configurando {nombre_campo}: {e}", level="ERROR")
            raise
    
    def navegar_a_fecha(self, fecha: datetime):
        """
        Navega el calendario hasta el mes y año deseados.
        
        Args:
            fecha: Fecha objetivo
        """
        max_intentos = 24  # Máximo 2 años de navegación
        
        for _ in range(max_intentos):
            try:
                # Obtener mes y año actuales del calendario
                mes_label = self.driver.find_element(By.CSS_SELECTOR, "button.monthlabel")
                año_label = self.driver.find_element(By.CSS_SELECTOR, "button.yearlabel")
                
                mes_actual_texto = mes_label.text.lower()
                año_actual = int(año_label.text)
                mes_actual = self.MESES_MAP.get(mes_actual_texto[:3], 1)
                
                # Verificar si ya estamos en el mes/año correctos
                if mes_actual == fecha.month and año_actual == fecha.year:
                    return
                
                # Determinar dirección de navegación
                if año_actual < fecha.year or (año_actual == fecha.year and mes_actual < fecha.month):
                    # Avanzar
                    botones = self.driver.find_elements(
                        By.CSS_SELECTOR, "button.headerbtn.mydpicon.icon-mydpright"
                    )
                    if botones and not botones[0].get_attribute("disabled"):
                        botones[0].click()
                        time.sleep(0.3)
                else:
                    # Retroceder
                    botones = self.driver.find_elements(
                        By.CSS_SELECTOR, "button.headerbtn.mydpicon.icon-mydpleft"
                    )
                    if botones and not botones[0].get_attribute("disabled"):
                        botones[0].click()
                        time.sleep(0.3)
                        
            except Exception:
                break
    
    def seleccionar_dia(self, dia: int):
        """
        Selecciona un día específico en el calendario.
        
        Args:
            dia: Número del día (1-31)
        """
        try:
            time.sleep(0.5)
            
            for intento in range(10):
                try:
                    # Buscar todas las celdas del mes actual
                    celdas_currmonth = self.driver.find_elements(
                        By.CSS_SELECTOR, "td.daycell.currmonth"
                    )
                    
                    for celda in celdas_currmonth:
                        try:
                            span = celda.find_element(By.TAG_NAME, "span")
                            texto = span.text.strip()
                            
                            if texto == str(dia):
                                if celda.is_displayed() and celda.is_enabled():
                                    # CRÍTICO: Hacer FOCUS primero (tabindex="0")
                                    self.driver.execute_script("arguments[0].focus();", celda)
                                    time.sleep(0.2)
                                    celda.click()
                                    time.sleep(0.5)
                                    return
                        except Exception:
                            continue
                    
                    time.sleep(0.5)
                    
                except Exception:
                    time.sleep(0.5)
            
            raise ValueError(f"No se encontró el día {dia} en el calendario")
            
        except Exception as e:
            self.log(f"[Calendar] ❌ Error seleccionando día {dia}: {e}", level="ERROR")
            raise
