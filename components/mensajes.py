import tkinter as tk
from tkinter import messagebox


class GestorMensajes:
    """Clase para centralizar y gestionar todos los mensajes y modales de la aplicación"""

    @staticmethod
    def mostrar_info(titulo, mensaje):
        """Mostrar mensaje informativo"""
        return messagebox.showinfo(titulo, mensaje)

    @staticmethod
    def mostrar_advertencia(titulo, mensaje):
        """Mostrar mensaje de advertencia"""
        return messagebox.showwarning(titulo, mensaje)

    @staticmethod
    def mostrar_error(titulo, mensaje):
        """Mostrar mensaje de error"""
        return messagebox.showerror(titulo, mensaje)

    @staticmethod
    def confirmar(titulo, mensaje):
        """Mostrar diálogo de confirmación"""
        return messagebox.askyesno(titulo, mensaje)

    @staticmethod
    def mostrar_instrucciones():
        """Mostrar instrucciones de uso de la aplicación"""
        instrucciones = """INSTRUCCIONES DE USO:

1. Selecciona la fecha deseada usando el calendario
2. Selecciona la carpeta donde se descargarán los archivos
3. Presiona EJECUTAR para iniciar la automatización

El bot realizará las siguientes acciones:
• Abrir Chrome y navegar a Xymmetry
• Realizar login automático
• Navegar a "Mi cartera"
• Configurar valorización en CLP
• Seleccionar la fecha especificada
• Descargar archivos de contratos
• Mostrar logs detallados del proceso

NOTA: Mantén visible la ventana del navegador durante el proceso."""

        return GestorMensajes.mostrar_info("Instrucciones", instrucciones)

    @staticmethod
    def validar_carpeta_seleccionada(carpeta_texto):
        """Validar si se ha seleccionado una carpeta válida"""
        if "Ninguna carpeta" in carpeta_texto:
            GestorMensajes.mostrar_advertencia(
                "Advertencia", "Por favor selecciona una carpeta de descarga."
            )
            return False
        return True

    @staticmethod
    def mostrar_acerca_de():
        """Mostrar información sobre la aplicación"""
        info = """MtM Downloader v1.0

Automatizador para descarga de archivos de contratos desde Xymmetry.

Desarrollado para facilitar el proceso de descarga y gestión de datos financieros.

© 2025"""

        return GestorMensajes.mostrar_info("Acerca de", info)


class ModalPersonalizado:
    """Clase para crear modales personalizados más avanzados"""

    def __init__(self, parent, titulo, ancho=400, alto=300):
        self.parent = parent
        self.resultado = None

        # Crear ventana modal
        self.ventana = tk.Toplevel(parent)
        self.ventana.title(titulo)
        self.ventana.geometry(f"{ancho}x{alto}")
        self.ventana.resizable(False, False)
        self.ventana.transient(parent)
        self.ventana.grab_set()

        # Centrar ventana
        self.centrar_ventana(ancho, alto)

        # Frame principal
        self.frame_principal = tk.Frame(self.ventana, bg="white")
        self.frame_principal.pack(fill="both", expand=True, padx=20, pady=20)

    def centrar_ventana(self, ancho, alto):
        """Centrar la ventana modal en la pantalla"""
        x = (self.ventana.winfo_screenwidth() // 2) - (ancho // 2)
        y = (self.ventana.winfo_screenheight() // 2) - (alto // 2)
        self.ventana.geometry(f"{ancho}x{alto}+{x}+{y}")

    def agregar_contenido(self, widget):
        """Agregar widget al contenido del modal"""
        widget.pack(in_=self.frame_principal, pady=10)

    def agregar_botones(self, botones_config):
        """
        Agregar botones al modal

        Args:
            botones_config: Lista de tuplas (texto, comando)
        """
        frame_botones = tk.Frame(self.frame_principal, bg="white")
        frame_botones.pack(side="bottom", fill="x", pady=(20, 0))

        for i, (texto, comando) in enumerate(botones_config):
            boton = tk.Button(
                frame_botones, text=texto, command=comando, font=("Arial", 10), padx=20, pady=5
            )
            boton.pack(side="right", padx=(5, 0))

    def cerrar(self, resultado=None):
        """Cerrar el modal con un resultado opcional"""
        self.resultado = resultado
        self.ventana.destroy()

    def mostrar(self):
        """Mostrar el modal y esperar hasta que se cierre"""
        self.ventana.wait_window()
        return self.resultado


def crear_modal_progreso(parent, titulo="Procesando..."):
    """Crear modal de progreso simple"""
    modal = ModalPersonalizado(parent, titulo, 300, 150)

    # Label de estado
    label_estado = tk.Label(
        modal.frame_principal,
        text="Procesando, por favor espere...",
        font=("Arial", 12),
        bg="white",
    )
    modal.agregar_contenido(label_estado)

    # Barra de progreso (simulada con label)
    progress_text = tk.Label(
        modal.frame_principal, text="⬜⬜⬜⬜⬜⬜⬜⬜", font=("Arial", 14), bg="white"
    )
    modal.agregar_contenido(progress_text)

    return modal, label_estado, progress_text
