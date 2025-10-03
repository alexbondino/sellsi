"""
FormConfigurator - Responsabilidad: Configuración del formulario Forward

Principio de Responsabilidad Única (SRP):
- Configurar dropdown Paridad
- Configurar inputs de fecha (Inicio, Valoración, Vencimiento)
- Click en botón Calcular
"""

from datetime import datetime
from typing import Callable, TYPE_CHECKING
import time

if TYPE_CHECKING:
    from selenium.webdriver.remote.webdriver import WebDriver

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import StaleElementReferenceException
from .calendar_handler import CalendarHandler


class FormConfigurator:
    """
    Configurador especializado en el formulario Forward.
    
    Responsabilidades:
    - Configurar Paridad (dropdown)
    - Configurar fechas (usando CalendarHandler)
    - Ejecutar cálculo (botón Calcular)
    """
    
    # Mapeo de paridades a valores del dropdown
    PARIDAD_VALUE_MAP = {
        "USD/CLP": "1",
        "EUR/CLP": "12",
        "EUR/USD": "33",
        "JPY/CLP": "16",
        "USD/JPY": "34",
        "UF/USD": "22",
        "GBP/CLP": "18",
        "GBP/USD": "19",
        "USD/CAD": "14",
        "USD/NOK": "3",
        "USD/DKK": "4",
        "USD/SEK": "5",
        "USD/COP": "6",
        "USD/ARS": "7",
        "USD/BRL": "8",
        "USD/PEN": "9",
        "USD/MXN": "10",
        "USD/CHF": "13",
        "AUD/USD": "20",
        "NZD/USD": "21",
        "CAD/CLP": "17",
        "EUR/COP": "15",
        "USD/CNH": "11",
        "CNH/CLP": "35",
        "CHF/CLP": "37",
        "EUR/MXN": "42",
        "GBP/MXN": "43",
        "JPY/MXN": "44"
        # NOTA: UF no está aquí - usa Forward de Inflación (interfaz diferente)
    }
    
    # XPaths del formulario - PARIDAD (USD/CLP, EUR/CLP, etc.)
    PARIDAD_XPATH = "/html/body/app-root/app-home/div[2]/app-calculator/div/div/div/div[2]/app-currency-forward/app-calculator-forward/div[2]/div/div[1]/div[1]/div/select"
    
    FECHA_INICIO_XPATH = "/html/body/app-root/app-home/div[2]/app-calculator/div/div/div/div[2]/app-currency-forward/app-calculator-forward/div[2]/div/div[3]/div[1]/my-date-picker/div/div/input"
    
    FECHA_VALORACION_XPATH = "/html/body/app-root/app-home/div[2]/app-calculator/div/div/div/div[2]/app-currency-forward/app-calculator-forward/div[2]/div/div[3]/div[2]/my-date-picker/div/div/input"
    
    FECHA_VENCIMIENTO_XPATH = "/html/body/app-root/app-home/div[2]/app-calculator/div/div/div/div[2]/app-currency-forward/app-calculator-forward/div[2]/div/div[4]/div[2]/my-date-picker/div/div/input"
    
    CALCULAR_XPATH = "/html/body/app-root/app-home/div[2]/app-calculator/div/div/div/div[2]/app-currency-forward/app-calculator-forward/div[2]/div/div[5]/div/button[2]"
    
    # XPaths del formulario - FORWARD DE INFLACIÓN (UF)
    UF_FECHA_INICIO_XPATH = "/html/body/app-root/app-home/div[2]/app-calculator/div/div/div/div[2]/app-inflation-forward/app-calculator-forward/div[2]/div/div[1]/div[1]/my-date-picker/div/div/input"
    
    UF_FECHA_VALORACION_XPATH = "/html/body/app-root/app-home/div[2]/app-calculator/div/div/div/div[2]/app-inflation-forward/app-calculator-forward/div[2]/div/div[1]/div[2]/my-date-picker/div/div/input"
    
    UF_FECHA_VENCIMIENTO_XPATH = "/html/body/app-root/app-home/div[2]/app-calculator/div/div/div/div[2]/app-inflation-forward/app-calculator-forward/div[2]/div/div[2]/div[2]/my-date-picker/div/div/input"
    
    UF_CALCULAR_XPATH = "/html/body/app-root/app-home/div[2]/app-calculator/div/div/div/div[2]/app-inflation-forward/app-calculator-forward/div[2]/div/div[3]/div/button[2]"
    
    def __init__(self, driver: "WebDriver", log_callback: Callable):
        """
        Args:
            driver: Instancia de Selenium WebDriver
            log_callback: Función para logging
        """
        self.driver = driver
        self.log = log_callback
        self.calendar_handler = CalendarHandler(driver, log_callback)
        self.modo_uf = False  # Flag para detectar si estamos en Forward de Inflación
    
    def set_modo_uf(self, activar: bool):
        """
        Activa o desactiva el modo UF (Forward de Inflación).
        Esto cambia los XPaths usados para fechas y botón calcular.
        
        Args:
            activar: True para Forward de Inflación, False para Paridad normal
        """
        self.modo_uf = activar
        modo_texto = "Forward de Inflación (UF)" if activar else "Paridad (USD/EUR)"
        self.log(f"[FormConfig] 🔧 Modo cambiado a: {modo_texto}", level="INFO")
    
    def configurar_paridad(self, paridad: str = "USD/CLP"):
        """
        Selecciona la paridad en el dropdown.
        
        Args:
            paridad: Valor a seleccionar (ej: "USD/CLP")
        """
        try:
            self.log(f"[FormConfig] 💱 Configurando Paridad {paridad}...", level="INFO")
            
            time.sleep(1)
            dropdown = self.driver.find_element(By.XPATH, self.PARIDAD_XPATH)
            select = Select(dropdown)
            
            # Usar mapeo si existe, sino usar visible_text
            if paridad in self.PARIDAD_VALUE_MAP:
                select.select_by_value(self.PARIDAD_VALUE_MAP[paridad])
            else:
                self.log(f"[FormConfig] ⚠️ Paridad {paridad} no encontrada en mapeo, usando visible_text", level="ADVERTENCIA")
                select.select_by_visible_text(paridad)
            
            self.log(f"[FormConfig] ✅ Paridad {paridad} seleccionada", level="EXITO")
            time.sleep(0.5)
            
        except Exception as e:
            self.log(f"[FormConfig] ❌ Error configurando paridad: {e}", level="ERROR")
            raise
    
    def configurar_fecha_inicio(self, fecha: datetime):
        """Configura la fecha de Inicio (usa XPath según modo UF o Paridad)"""
        xpath = self.UF_FECHA_INICIO_XPATH if self.modo_uf else self.FECHA_INICIO_XPATH
        self.log(f"[FormConfig] 📅 Configurando Fecha Inicio: {fecha.strftime('%d/%m/%Y')}", level="INFO")
        self.calendar_handler.configurar_fecha(xpath, fecha, "Inicio")
    
    def configurar_fecha_valoracion(self, fecha: datetime):
        """Configura la fecha de Valoración (usa XPath según modo UF o Paridad)"""
        xpath = self.UF_FECHA_VALORACION_XPATH if self.modo_uf else self.FECHA_VALORACION_XPATH
        self.log(f"[FormConfig] 📅 Configurando Fecha Valoración: {fecha.strftime('%d/%m/%Y')}", level="INFO")
        self.calendar_handler.configurar_fecha(xpath, fecha, "Valoración")
    
    def configurar_fecha_vencimiento(self, fecha: datetime):
        """Configura la fecha de Vencimiento (usa XPath según modo UF o Paridad)"""
        xpath = self.UF_FECHA_VENCIMIENTO_XPATH if self.modo_uf else self.FECHA_VENCIMIENTO_XPATH
        self.log(f"[FormConfig] 📅 Configurando Fecha Vencimiento: {fecha.strftime('%d/%m/%Y')}", level="INFO")
        self.calendar_handler.configurar_fecha(xpath, fecha, "Vencimiento")
    
    def click_calcular(self):
        """Hace click en el botón Calcular (usa XPath según modo UF o Paridad)"""
        try:
            xpath = self.UF_CALCULAR_XPATH if self.modo_uf else self.CALCULAR_XPATH
            self.log("[FormConfig] ⚡ Click en botón Calcular...", level="INFO")
            
            time.sleep(2)
            
            # Reintentar si hay StaleElement
            for intento in range(3):
                try:
                    boton = self.driver.find_element(By.XPATH, xpath)
                    self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", boton)
                    time.sleep(0.5)
                    self.driver.execute_script("arguments[0].click();", boton)
                    self.log("[FormConfig] ✅ Click exitoso", level="EXITO")
                    break
                except StaleElementReferenceException:
                    time.sleep(1)
                    if intento == 2:
                        raise
            
            time.sleep(3)  # Esperar procesamiento
            
        except Exception as e:
            self.log(f"[FormConfig] ❌ Error en click Calcular: {e}", level="ERROR")
            raise
