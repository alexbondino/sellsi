import tkinter as tk
from tkinter import filedialog
from tkcalendar import DateEntry
import threading
import time
import os
from components.consola_widget import ConsolaWidget
from components.botones import crear_boton_primario, crear_boton_secundario, crear_boton_ejecutar, crear_boton_icono, ICONOS
from components.mensajes import GestorMensajes

class MtMDownloaderApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("MtM Downloader")
        self.geometry("640x560")
        self.resizable(False, False)
        self.configure(bg="white")
        self.selected_folder = tk.StringVar(value="Ninguna carpeta seleccionada")
        self.setup_ui()

    def setup_ui(self):
        # Centrar el título horizontalmente usando anchor y relx
        tk.Label(self, text="MtM Downloader", font=("Arial", 24, "bold"), bg="white")\
            .place(relx=0.5, y=20, anchor="n")
        tk.Label(self, text="Selecciona una fecha", font=("Arial", 13), bg="white").place(x=30, y=70)
        self.date_entry = DateEntry(self, width=18, font=("Arial", 12), date_pattern='dd-mm-yyyy')
        self.date_entry.place(x=30, y=100)
        tk.Label(self, text="Selecciona carpeta de descarga", font=("Arial", 13), bg="white").place(x=30, y=140)
        crear_boton_primario(
            self, "Seleccionar Carpeta", self.select_folder
        ).place(x=30, y=170)
        tk.Label(
            self, textvariable=self.selected_folder, 
            font=("Arial", 10), bg="white", 
            fg="gray", wraplength=580
        ).place(x=30, y=210)
        # Consola modular
        self.consola = ConsolaWidget(self, width=int(55*1.2), height=15)
        self.consola.place(x=30, y=250)
        # Botón de instrucciones
        crear_boton_secundario(
            self, "INSTRUCCIONES", self.show_instructions
        ).place(x=420, y=70)
        # Botón ejecutar
        crear_boton_ejecutar(
            self, "EJECUTAR", self.start_automation
        ).place(x=390, y=120)
        # Versión
        self.version_label = tk.Label(self, text="Versión 1.0", font=("Arial", 9), bg="white", fg="gray")
        self.version_label.place(x=540, y=540)

    def log(self, message, level="INFO"):
        self.consola.agregar_log(message, level)

    def copiar_consola(self):
        self.clipboard_clear()
        self.clipboard_append(self.consola.obtener_contenido())
        self.log("Consola copiada al portapapeles.", level="EXITO")

    def select_folder(self):
        folder = filedialog.askdirectory()
        if folder:
            self.selected_folder.set(f"Carpeta: {folder}")
            self.log(f"Carpeta seleccionada: {folder}", level="INFO")

    def show_instructions(self):
        GestorMensajes.mostrar_instrucciones()

    def start_automation(self):
        if not GestorMensajes.validar_carpeta_seleccionada(self.selected_folder.get()):
            self.log("No se ha seleccionado una carpeta de descarga.", level="ADVERTENCIA")
            return
        self.log("=== INICIANDO AUTOMATIZACIÓN ===", level="INFO")
        self.log(f"Fecha seleccionada: {self.date_entry.get()}", level="INFO")
        self.log(f"Carpeta: {self.selected_folder.get()}", level="INFO")
        def run_automation():
            try:
                from automation.web_automator import WebAutomator
                automator = WebAutomator(self.log)
                carpeta = self.selected_folder.get().replace('Carpeta: ', '')
                automator.start(download_dir=carpeta)
                self.log("Automatización finalizada con éxito.", level="EXITO")
            except Exception as e:
                import traceback
                tb = traceback.format_exc()
                self.log(f"[ERROR Thread] {e}\n{tb}", level="ERROR")
        threading.Thread(target=run_automation, daemon=True).start()

if __name__ == "__main__":
    app = MtMDownloaderApp()
    app.mainloop()
