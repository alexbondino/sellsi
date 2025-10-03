"""
DateCalculator - Responsabilidad: Cálculos de fechas y validación de días hábiles

Principio de Responsabilidad Única (SRP):
- Calcular último día hábil de un mes
- Validar si un día es hábil (no weekend, no feriado)
- Operaciones de calendario (monthrange, weekday)
"""

from datetime import datetime
from calendar import monthrange
from typing import Callable, List
from ..constants import FERIADOS_CHILE


class DateCalculator:
    """
    Calculador especializado en operaciones de fechas y días hábiles.
    
    Responsabilidades:
    - Calcular último día hábil del mes
    - Validar feriados nacionales
    - Validar weekends
    """
    
    def __init__(self, log_callback: Callable):
        """
        Args:
            log_callback: Función para logging (firma: log(message, level="INFO"))
        """
        self.log = log_callback
        self.feriados = FERIADOS_CHILE
    
    def calcular_ultimo_dia_habil(self, fecha: datetime) -> datetime:
        """
        Calcula el último día hábil del mes (excluyendo weekends y feriados).
        
        Args:
            fecha: Cualquier fecha del mes a evaluar
            
        Returns:
            datetime con el último día hábil del mes
        """
        # Obtener último día del mes
        ultimo_dia = monthrange(fecha.year, fecha.month)[1]
        fecha_ultimo_dia = datetime(fecha.year, fecha.month, ultimo_dia)
        
        self.log(
            f"[DateCalc] 📊 Calculando último día hábil de {fecha.strftime('%B %Y')}", 
            level="INFO"
        )
        self.log(f"[DateCalc]    └─ Último día del mes: {ultimo_dia}", level="INFO")
        
        # Retroceder hasta encontrar un día hábil
        dias_retrocedidos = 0
        feriados_encontrados = []
        
        while not self.es_dia_habil(fecha_ultimo_dia):
            if self.es_feriado(fecha_ultimo_dia):
                nombre_dia = fecha_ultimo_dia.strftime('%d/%m/%Y (%A)')
                feriados_encontrados.append(nombre_dia)
                self.log(
                    f"[DateCalc]    ⚠️ {nombre_dia} es FERIADO NACIONAL", 
                    level="ADVERTENCIA"
                )
            
            fecha_ultimo_dia = fecha_ultimo_dia.replace(day=fecha_ultimo_dia.day - 1)
            dias_retrocedidos += 1
        
        # Log resumen
        if dias_retrocedidos > 0:
            weekends = dias_retrocedidos - len(feriados_encontrados)
            self.log(
                f"[DateCalc]    ⬅️ Retrocedido {dias_retrocedidos} día(s) "
                f"({len(feriados_encontrados)} feriados, {weekends} weekends)", 
                level="INFO"
            )
        
        self.log(
            f"[DateCalc]    ✅ Último día hábil: {fecha_ultimo_dia.strftime('%d/%m/%Y (%A)')}", 
            level="EXITO"
        )
        
        return fecha_ultimo_dia
    
    def es_dia_habil(self, fecha: datetime) -> bool:
        """
        Verifica si una fecha es día hábil (no weekend ni feriado).
        
        Args:
            fecha: Fecha a verificar
            
        Returns:
            True si es día hábil, False si no
        """
        return not self.es_weekend(fecha) and not self.es_feriado(fecha)
    
    def es_weekend(self, fecha: datetime) -> bool:
        """
        Verifica si una fecha cae en fin de semana.
        
        Args:
            fecha: Fecha a verificar
            
        Returns:
            True si es sábado o domingo, False si no
        """
        return fecha.weekday() >= 5  # 5=Sábado, 6=Domingo
    
    def es_feriado(self, fecha: datetime) -> bool:
        """
        Verifica si una fecha es feriado nacional chileno.
        
        Args:
            fecha: Fecha a verificar
            
        Returns:
            True si es feriado, False si no
        """
        return fecha in self.feriados
    
    def obtener_ultimo_dia_mes(self, fecha: datetime) -> int:
        """
        Obtiene el número del último día del mes (28, 29, 30 o 31).
        
        Args:
            fecha: Cualquier fecha del mes
            
        Returns:
            Número del último día (1-31)
        """
        return monthrange(fecha.year, fecha.month)[1]
