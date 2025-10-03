"""
IterationCalculator - Responsabilidad: Cálculo de iteraciones y meses

Principio de Responsabilidad Única (SRP):
- Determinar cuántas iteraciones se necesitan (n)
- Calcular qué mes corresponde a cada iteración
- Lógica de negocio: si día_inicio cuenta o no
"""

from datetime import datetime
from dateutil.relativedelta import relativedelta
from typing import Callable
from .date_calculator import DateCalculator


class IterationCalculator:
    """
    Calculador especializado en determinar iteraciones.
    
    Responsabilidades:
    - Calcular número de iteraciones necesarias
    - Determinar mes correspondiente a cada iteración
    - Aplicar regla de negocio: día_inicio <= último_día_hábil
    """
    
    # Mapeo de nombres de meses en español
    MESES_ES = {
        "enero": 1, "febrero": 2, "marzo": 3, "abril": 4,
        "mayo": 5, "junio": 6, "julio": 7, "agosto": 8,
        "septiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12
    }
    
    def __init__(self, log_callback: Callable, date_calculator: DateCalculator):
        """
        Args:
            log_callback: Función para logging
            date_calculator: Instancia de DateCalculator para cálculos de fechas
        """
        self.log = log_callback
        self.date_calc = date_calculator
    
    def calcular_numero_iteraciones(
        self, 
        fecha_inicio: datetime, 
        mes_vencimiento_str: str
    ) -> int:
        """
        Calcula cuántas iteraciones se necesitan.
        
        Regla de negocio:
        - Si día_inicio <= último_día_hábil del mes_inicio → mes inicio CUENTA
        - Siempre se incluyen todos los meses hasta mes_vencimiento
        
        Args:
            fecha_inicio: Fecha de inicio del cálculo
            mes_vencimiento_str: String como "Diciembre 2025"
            
        Returns:
            Número de iteraciones (n)
        """
        # Parsear mes_vencimiento
        mes_venc, año_venc = self._parsear_mes_vencimiento(mes_vencimiento_str)
        
        # Calcular diferencia de meses
        meses_totales_vencimiento = año_venc * 12 + mes_venc
        meses_totales_inicio = fecha_inicio.year * 12 + fecha_inicio.month
        num_meses_base = meses_totales_vencimiento - meses_totales_inicio
        
        # Calcular último día del mes de inicio (sin considerar días hábiles)
        from calendar import monthrange
        ultimo_dia_mes_inicio = monthrange(fecha_inicio.year, fecha_inicio.month)[1]
        
        # Aplicar regla de negocio
        if fecha_inicio.day <= ultimo_dia_mes_inicio:
            num_iteraciones = num_meses_base + 1
            self.log(
                f"[IterCalc] 📊 Día inicio ({fecha_inicio.day}) <= "
                f"último día del mes ({ultimo_dia_mes_inicio}) → Mes inicio CUENTA", 
                level="INFO"
            )
        else:
            num_iteraciones = num_meses_base
            self.log(
                f"[IterCalc] 📊 Día inicio ({fecha_inicio.day}) > "
                f"último día del mes ({ultimo_dia_mes_inicio}) → Mes inicio NO cuenta", 
                level="INFO"
            )
        
        self.log(f"[IterCalc] 🔢 Número de iteraciones: {num_iteraciones}", level="INFO")
        return num_iteraciones
    
    def calcular_mes_iteracion(
        self, 
        fecha_inicio: datetime, 
        numero_iteracion: int
    ) -> datetime:
        """
        Calcula qué mes corresponde a una iteración específica.
        
        Args:
            fecha_inicio: Fecha de inicio del cálculo
            numero_iteracion: Número de iteración (1, 2, 3, ...)
            
        Returns:
            datetime representando el primer día del mes correspondiente
        """
        # Calcular último día del mes de inicio (sin considerar días hábiles)
        from calendar import monthrange
        ultimo_dia_mes_inicio = monthrange(fecha_inicio.year, fecha_inicio.month)[1]
        
        # Determinar mes base
        if fecha_inicio.day <= ultimo_dia_mes_inicio:
            # Empezar desde el mes de inicio
            mes_base = datetime(fecha_inicio.year, fecha_inicio.month, 1)
        else:
            # Empezar desde el mes siguiente
            mes_base = datetime(fecha_inicio.year, fecha_inicio.month, 1) + relativedelta(months=1)
        
        # Sumar (iteracion - 1) meses
        mes_iteracion = mes_base + relativedelta(months=(numero_iteracion - 1))
        
        return mes_iteracion
    
    def _parsear_mes_vencimiento(self, mes_vencimiento_str: str) -> tuple[int, int]:
        """
        Parsea un string como "Diciembre 2025" a (mes, año).
        
        Args:
            mes_vencimiento_str: String formato "Mes Año"
            
        Returns:
            Tupla (mes: int, año: int)
        """
        partes = mes_vencimiento_str.lower().split()
        mes_nombre = partes[0]
        año = int(partes[1])
        mes = self.MESES_ES.get(mes_nombre, 1)
        
        return mes, año
