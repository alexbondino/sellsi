import tkinter as tk
from .tooltip import agregar_tooltip


def crear_boton_personalizado(parent, texto, comando, **kwargs):
    """
    Crear un botón personalizado con estilos predefinidos

    Args:
        parent: Widget padre
        texto: Texto del botón
        comando: Función a ejecutar al hacer clic
        **kwargs: Argumentos adicionales para personalizar el botón

    Returns:
        Widget Button creado
    """
    # Configuración por defecto
    config_default = {
        "font": ("Arial", 11),
        "cursor": "hand2",
        "borderwidth": 1,
        "relief": "raised",
    }

    # Actualizar con argumentos proporcionados
    config_default.update(kwargs)

    # Crear botón
    boton = tk.Button(parent, text=texto, command=comando, **config_default)

    return boton


def crear_boton_primario(parent, texto, comando, **kwargs):
    """Crear botón con estilo primario (azul)"""
    config = {"bg": "#007ACC", "fg": "white", "font": ("Arial", 11, "bold"), **kwargs}
    return crear_boton_personalizado(parent, texto, comando, **config)


def crear_boton_secundario(parent, texto, comando, **kwargs):
    """Crear botón con estilo secundario (verde)"""
    config = {"bg": "#28a745", "fg": "white", "font": ("Arial", 11, "bold"), **kwargs}
    return crear_boton_personalizado(parent, texto, comando, **config)


def crear_boton_ejecutar(parent, texto, comando, **kwargs):
    """Crear botón con estilo especial para ejecutar (cyan)"""
    config = {
        "bg": "#06EFFF",
        "fg": "black",
        "font": ("Arial", 14, "bold"),
        "width": 15,
        "height": 2,
        **kwargs,
    }
    return crear_boton_personalizado(parent, texto, comando, **config)


def crear_boton_con_tooltip(parent, texto, comando, tooltip_text, **kwargs):
    """
    Crear botón personalizado con tooltip

    Args:
        parent: Widget padre
        texto: Texto del botón
        comando: Función a ejecutar al hacer clic
        tooltip_text: Texto del tooltip
        **kwargs: Argumentos adicionales para el botón

    Returns:
        Tupla (boton, tooltip)
    """
    boton = crear_boton_personalizado(parent, texto, comando, **kwargs)
    tooltip = agregar_tooltip(boton, tooltip_text)

    return boton, tooltip


def crear_boton_icono(parent, icono, comando, tooltip_text=None, **kwargs):
    """
    Crear botón con icono (usando Unicode)

    Args:
        parent: Widget padre
        icono: Carácter Unicode del icono
        comando: Función a ejecutar al hacer clic
        tooltip_text: Texto del tooltip (opcional)
        **kwargs: Argumentos adicionales para el botón

    Returns:
        Widget Button creado (o tupla con tooltip si se especifica)
    """
    config = {
        "font": ("Arial", 16),
        "bg": "#f8f8f8",
        "fg": "#007ACC",
        "borderwidth": 0,
        "activebackground": "#e0f7fa",
        "width": 2,
        "height": 1,
        **kwargs,
    }

    boton = crear_boton_personalizado(parent, icono, comando, **config)

    if tooltip_text:
        tooltip = agregar_tooltip(boton, tooltip_text)
        return boton, tooltip

    return boton


# Iconos comunes (Unicode)
ICONOS = {
    "copiar": "\u2398",
    "descargar": "\u2b07",
    "configuracion": "\u2699",
    "ayuda": "\u2753",
    "carpeta": "\u1f4c1",
    "archivo": "\u1f4c4",
    "play": "\u25b6",
    "pause": "\u23f8",
    "stop": "\u23f9",
    "refresh": "\u27f3",
}
