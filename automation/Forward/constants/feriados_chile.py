"""
Feriados Nacionales de Chile (2025-2026)

Fuente: https://www.feriados.cl/
Incluye feriados irrenunciables y trasladados
"""

from datetime import datetime

FERIADOS_CHILE = [
    # 2025
    datetime(2025, 1, 1),   # Año Nuevo (irrenunciable)
    datetime(2025, 4, 18),  # Viernes Santo
    datetime(2025, 4, 19),  # Sábado Santo
    datetime(2025, 5, 1),   # Día del Trabajo (irrenunciable)
    datetime(2025, 5, 21),  # Día de las Glorias Navales
    datetime(2025, 6, 29),  # San Pedro y San Pablo
    datetime(2025, 6, 30),  # San Pedro y San Pablo (trasladado)
    datetime(2025, 7, 16),  # Día de la Virgen del Carmen
    datetime(2025, 8, 15),  # Asunción de la Virgen
    datetime(2025, 9, 18),  # Día de la Independencia (irrenunciable)
    datetime(2025, 9, 19),  # Día de las Glorias del Ejército (irrenunciable)
    datetime(2025, 10, 31), # Día de las Iglesias Evangélicas y Protestantes ⚠️
    datetime(2025, 11, 1),  # Día de Todos los Santos
    datetime(2025, 12, 8),  # Inmaculada Concepción
    datetime(2025, 12, 25), # Navidad (irrenunciable)
    
    # 2026
    datetime(2026, 1, 1),   # Año Nuevo (irrenunciable)
    datetime(2026, 4, 3),   # Viernes Santo
    datetime(2026, 4, 4),   # Sábado Santo
    datetime(2026, 5, 1),   # Día del Trabajo (irrenunciable)
    datetime(2026, 5, 21),  # Día de las Glorias Navales
    datetime(2026, 6, 29),  # San Pedro y San Pablo
    datetime(2026, 7, 16),  # Día de la Virgen del Carmen
    datetime(2026, 8, 15),  # Asunción de la Virgen
    datetime(2026, 9, 18),  # Día de la Independencia (irrenunciable)
    datetime(2026, 9, 19),  # Día de las Glorias del Ejército (irrenunciable)
    datetime(2026, 10, 31), # Día de las Iglesias Evangélicas y Protestantes
    datetime(2026, 11, 1),  # Día de Todos los Santos
    datetime(2026, 12, 8),  # Inmaculada Concepción
    datetime(2026, 12, 25), # Navidad (irrenunciable)
]
