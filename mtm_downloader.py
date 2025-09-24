import tkinter as tk
from tkinter import filedialog
from tkcalendar import DateEntry
import threading
from components.consola_widget import ConsolaWidget
from components.botones import crear_boton_primario, crear_boton_secundario, crear_boton_ejecutar
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
                import sys, os, glob, traceback
                base_dir = os.path.dirname(__file__)
                if base_dir not in sys.path:
                    sys.path.insert(0, base_dir)
                self.log("[DEBUG IMPORT] Intentando importar automation.web_automator", level="DEBUG")
                try:
                    from automation.web_automator import WebAutomator
                except ModuleNotFoundError as e1:
                    auto_dir = os.path.join(base_dir, 'automation')
                    existentes = [os.path.basename(f) for f in glob.glob(os.path.join(auto_dir, '*'))]
                    self.log(f"[DEBUG IMPORT] Contenido automation/: {existentes}", level="DEBUG")
                    raise
                automator = WebAutomator(self.log)
                carpeta = self.selected_folder.get().replace('Carpeta: ', '')
                automator.start(download_dir=carpeta)
                self.log("Automatización finalizada con éxito.", level="EXITO")
            except Exception as e:
                import traceback
                tb = traceback.format_exc()
                self.log(f"[ERROR Thread] {e}\n{tb}", level="ERROR")
        threading.Thread(target=run_automation, daemon=True).start()

class ForwardCalculatorPlaceholder(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Calculadora de Forward")
        self.geometry("480x240")
        self.resizable(False, False)
        self.configure(bg="white")
        tk.Label(
            self,
            text="DISEÑAR MENU NUEVO",
            font=("Arial", 16, "bold"),
            bg="white",
            fg="#007ACC"
        ).pack(pady=30)
        tk.Label(
            self,
            text="Esta vista es un placeholder para la futura Calculadora de Forward.",
            font=("Arial", 11),
            bg="white",
            fg="gray",
            wraplength=420
        ).pack(pady=10)
        crear_boton_secundario(
            self,
            "Volver al menú principal",
            self.volver_menu_principal
        ).pack(pady=20)

    def volver_menu_principal(self):
        self.destroy()
        launch_start_menu()


class StartMenuApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("MtM Suite")
        self.geometry("420x220")
        self.resizable(False, False)
        self.configure(bg="white")
        tk.Label(
            self,
            text="Selecciona un módulo",
            font=("Arial", 18, "bold"),
            bg="white"
        ).pack(pady=25)
        crear_boton_primario(
            self,
            "Valorización MtM",
            self.abrir_mtm_downloader,
            width=22
        ).pack(pady=10)
        crear_boton_ejecutar(
            self,
            "Calculadora de Forward",
            self.abrir_calculadora_forward,
            width=20,
            height=1
        ).pack()

    def abrir_mtm_downloader(self):
        self.destroy()
        app = MtMDownloaderApp()
        app.mainloop()

    def abrir_calculadora_forward(self):
        self.destroy()
        placeholder = ForwardCalculatorPlaceholder()
        placeholder.mainloop()


def launch_start_menu():
    menu = StartMenuApp()
    menu.mainloop()

if __name__ == "__main__":
    launch_start_menu()
