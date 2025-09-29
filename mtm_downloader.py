import tkinter as tk
from tkinter import filedialog
from tkcalendar import DateEntry
import threading
import sys
import os
import glob
from components.consola_widget import ConsolaWidget
from components.botones import crear_boton_primario, crear_boton_secundario, crear_boton_ejecutar
from components.mensajes import GestorMensajes
from components.excel_validator import ExcelValidator
from components.timeline_component import TimelineComponent, integrate_timeline_with_automation

# Importar validación de macros
try:
    from automation.shared.validacion.macro_config_popup import show_macro_config_popup
    MACRO_VALIDATION_AVAILABLE = True
    print("✅ [DEBUG] Popup de macros importado correctamente")
except ImportError as e:
    MACRO_VALIDATION_AVAILABLE = False
    print(f"⚠️ [DEBUG] No se pudo importar popup de macros: {e}")


class MtMDownloaderApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("MtM Downloader")
        self.geometry("832x768")  # Aumentado altura de 680 a 768 píxeles
        self.resizable(False, False)
        self.configure(bg="white")

        # Variables de estado
        self.selected_folder = tk.StringVar(value="Ninguna carpeta seleccionada")
        self.excel_directory = tk.StringVar(value="Ningún directorio seleccionado")
        self.validation_status = tk.StringVar(value="⚠️ Pendiente validación")
        self.excel_files_valid = False

        # Inicializar validador
        self.excel_validator = ExcelValidator()
        
        # Inicializar timeline y callbacks
        self.timeline = None
        self.timeline_callbacks = None

        self.setup_ui()

    def setup_ui(self):
        # === TIMELINE HEADER ===
        self.timeline = TimelineComponent(self)
        self.timeline.pack(fill="x", pady=(10, 0))
        
        # Configurar callbacks del timeline
        self.timeline_callbacks = integrate_timeline_with_automation(self.timeline)
        
        # === HEADER PRINCIPAL ===
        tk.Label(self, text="MtM Downloader", font=("Arial", 20, "bold"), bg="white").place(
            relx=0.5, y=180, anchor="n"
        )

        # === CONFIGURACIÓN DE FECHA ===
        tk.Label(self, text="Selecciona una fecha", font=("Arial", 13), bg="white").place(
            x=30, y=220
        )
        self.date_entry = DateEntry(self, width=18, font=("Arial", 12), date_pattern="dd-mm-yyyy")
        self.date_entry.place(x=30, y=250)

        # === VALIDACIÓN DE ARCHIVOS EXCEL (NUEVA SECCIÓN) ===
        tk.Label(
            self,
            text="📊 Validación de Archivos Excel",
            font=("Arial", 13, "bold"),
            bg="white",
            fg="#007ACC",
        ).place(x=30, y=290)

        tk.Label(
            self, text="Directorio con archivos de macros:", font=("Arial", 11), bg="white"
        ).place(x=30, y=320)

        crear_boton_primario(
            self, "Seleccionar Directorio Excel", self.select_excel_directory
        ).place(x=30, y=350)

        # Botón para validar archivos (movido aquí desde botones de acción)
        crear_boton_secundario(
            self, "Validar Archivos", self.validate_excel_files_manual, width=15
        ).place(x=30, y=380)

        # Status de validación
        self.validation_label = tk.Label(
            self,
            textvariable=self.validation_status,
            font=("Arial", 11, "bold"),
            bg="white",
            fg="#FF6B35",  # Color naranja por defecto
        )
        self.validation_label.place(x=30, y=410)

        # Información del directorio Excel
        tk.Label(
            self,
            textvariable=self.excel_directory,
            font=("Arial", 9),
            bg="white",
            fg="gray",
            wraplength=360,  # Reducido para dar espacio a la derecha
        ).place(x=30, y=440)

        # === CARPETA DE DESCARGA (MOVIDA A LA DERECHA) ===
        tk.Label(self, text="📁 Carpeta de Descarga", font=("Arial", 13, "bold"), bg="white", fg="#007ACC").place(
            x=360, y=290
        )
        tk.Label(self, text="Selecciona carpeta de descarga", font=("Arial", 11), bg="white").place(
            x=360, y=320
        )
        crear_boton_primario(self, "Seleccionar Carpeta", self.select_folder).place(x=360, y=350)
        tk.Label(
            self,
            textvariable=self.selected_folder,
            font=("Arial", 10),
            bg="white",
            fg="gray",
            wraplength=350,
        ).place(x=380, y=380)

        # === CONSOLA ===
        self.consola = ConsolaWidget(self, width=int(55 * 1.2), height=12)
        self.consola.place(x=30, y=490)
        
        # Log DEBUG para troubleshooting (después de crear consola)
        self.log("[INIT] Timeline component initialized (832x768 layout)", level="DEBUG")
        self.log(f"[INIT] Timeline callbacks configured: {bool(self.timeline_callbacks)}", level="DEBUG")

        # Botón pequeño para limpiar mensajes corruptos (junto a la consola)
        crear_boton_secundario(self, "Limpiar", self._limpiar_mensajes_corruptos, width=8).place(
            x=545, y=465
        )

        # === BOTONES DE ACCIÓN ===
        crear_boton_secundario(self, "INSTRUCCIONES", self.show_instructions).place(x=620, y=220)

        # Botón ejecutar (ahora con validación)
        self.execute_button = crear_boton_ejecutar(self, "EJECUTAR", self.start_automation)
        self.execute_button.place(x=620, y=270)
        
        # Botón temporal Paso 2 para testing
        crear_boton_secundario(self, "PASO 2", self.paso_2_handler).place(x=620, y=320)

        # === VERSIÓN ===
        self.version_label = tk.Label(
            self, text="Versión 1.0", font=("Arial", 9), bg="white", fg="gray"
        )
        self.version_label.place(x=540, y=748)  # Ajustado para nueva altura (768-20)

    def log(self, message, level="INFO"):
        self.consola.agregar_log(message, level)

    def copiar_consola(self):
        self.clipboard_clear()
        self.clipboard_append(self.consola.obtener_contenido())
        self.log("Consola copiada al portapapeles.", level="EXITO")

    def _limpiar_mensajes_corruptos(self):
        """Limpiar mensajes corruptos de la consola (ej: líneas con [[[[[[[[)"""
        self.consola.limpiar_mensajes_corruptos()
        self.log("🧹 Mensajes corruptos eliminados de la consola", level="INFO")

    def select_folder(self):
        self.log("[UI] Opening folder dialog for download directory", level="DEBUG")
        folder = filedialog.askdirectory()
        if folder:
            self.selected_folder.set(f"Carpeta: {folder}")
            self.log(f"Carpeta seleccionada: {folder}", level="INFO")
            self.log(f"[PATH] Download folder set to: {folder}", level="DEBUG")
        else:
            self.log("[UI] Download folder selection cancelled by user", level="DEBUG")

    def select_excel_directory(self):
        """Selecciona el directorio que contiene los archivos Excel de macros"""
        self.log("[UI] Opening Excel directory dialog", level="DEBUG")
        directory = filedialog.askdirectory(
            title="Seleccionar directorio con archivos Excel de macros"
        )
        if directory:
            self.excel_directory.set(f"Directorio: {directory}")
            self.log(f"Directorio Excel seleccionado: {directory}", level="INFO")
            self.log(f"[PATH] Excel directory set to: {directory}", level="DEBUG")

            # Validación automática
            self._validate_excel_directory(directory)
        else:
            self.log("[UI] Excel directory selection cancelled by user", level="DEBUG")

    def validate_excel_files_manual(self):
        """Validación manual de archivos Excel (sin seleccionar nuevo directorio)"""
        current_dir = self.excel_directory.get()
        if current_dir == "Ningún directorio seleccionado":
            self.log("Primero selecciona un directorio con archivos Excel", level="ADVERTENCIA")
            return

        # Extraer ruta real del directorio
        directory_path = current_dir.replace("Directorio: ", "")
        self._validate_excel_directory(directory_path)

    def _validate_excel_directory(self, directory_path: str):
        """Método interno para validar directorio de Excel"""
        self.log("🔍 Iniciando validación de archivos Excel...", level="INFO")

        try:
            is_valid, found_files, messages = self.excel_validator.validate_directory(
                directory_path
            )

            # Log inmediato del resultado de la validación
            if is_valid:
                self.log("✅ VALIDACIÓN COMPLETADA - Todos los archivos encontrados", level="EXITO")
            else:
                self.log(
                    "❌ VALIDACIÓN INCOMPLETA - Faltan archivos requeridos", level="ADVERTENCIA"
                )

            # Actualizar estado interno
            self.excel_files_valid = is_valid

            # Mostrar resumen de archivos encontrados
            if found_files:
                self.log(f"📊 Resumen de archivos detectados: {len(found_files)}/2", level="INFO")
                for file_type, file_info in found_files.items():
                    config = self.excel_validator.PATTERNS[file_type]
                    extension = os.path.splitext(file_info.filename)[1].lower()
                    self.log(
                        f"   • {config['display_name']}: {file_info.filename} ({extension})",
                        level="EXITO",
                    )
            else:
                self.log(
                    "📂 No se detectaron archivos válidos en el directorio", level="ADVERTENCIA"
                )

            # Actualizar UI
            if is_valid:
                self.validation_status.set("✅ Archivos validados correctamente")
                self.validation_label.configure(fg="#28A745")  # Verde
                self._update_execute_button_state()
            else:
                self.validation_status.set("❌ Faltan archivos requeridos")
                self.validation_label.configure(fg="#DC3545")  # Rojo
                self._update_execute_button_state()

            # Mostrar mensajes detallados en la consola (solo los más importantes)
            for message in messages:
                # Filtrar mensajes para evitar spam en consola
                if "✅" in message and "encontrado:" in message:
                    continue  # Ya lo mostramos arriba en el resumen
                elif "🎉" in message:
                    self.log(message, level="EXITO")
                elif "❌" in message and ("NO encontrado" in message):
                    self.log(message, level="ERROR")
                elif "💡" in message or "📝" in message:
                    self.log(message, level="INFO")
                elif "⚠️" in message and "archivo(s)" in message:
                    continue  # Evitar mensaje redundante

            # Log final del estado
            if is_valid:
                self.log("🎯 Estado: Listo para ejecutar descarga", level="EXITO")
            else:
                self.log(
                    "🚫 Estado: Descarga bloqueada hasta completar validación", level="ADVERTENCIA"
                )

        except Exception as e:
            self.log(f"❌ Error durante validación: {str(e)}", level="ERROR")
            self.validation_status.set("❌ Error en validación")
            self.validation_label.configure(fg="#DC3545")
            self.excel_files_valid = False
            self._update_execute_button_state()

    def _update_execute_button_state(self):
        """Actualiza el estado visual del botón EJECUTAR"""
        if self.excel_files_valid:
            # Habilitar botón con estilo normal
            self.execute_button.configure(state="normal", bg="#28A745", fg="white")
        else:
            # Deshabilitar visualmente (pero mantener funcional para mostrar mensaje)
            self.execute_button.configure(state="normal", bg="#FFC107", fg="black")

    def show_instructions(self):
        GestorMensajes.mostrar_instrucciones()

    def paso_2_handler(self):
        """
        Handler para Paso 2: Seleccionar y abrir el archivo MtM Excel validado
        """
        self.log("🚀 Iniciando Paso 2...", level="INFO")
        
        # Validar que tenemos una carpeta seleccionada
        if not GestorMensajes.validar_carpeta_seleccionada(self.selected_folder.get()):
            self.log("❌ Selecciona primero una carpeta de descarga", level="ERROR")
            return
            
        carpeta_descarga = self.selected_folder.get().replace("Carpeta: ", "")
        
        # Buscar archivo MtM Excel usando ExcelValidator
        validator = ExcelValidator()
        is_valid, found_files, messages = validator.validate_directory(carpeta_descarga)
        
        # Buscar específicamente el archivo MtM (con prioridad)
        mtm_file = None
        for file_type, file_info in found_files.items():
            if 'mtm' in file_type.lower() or 'mtm' in file_info.filename.lower():
                mtm_file = file_info.full_path
                self.log(f"📂 Archivo MtM encontrado: {file_info.filename}", level="INFO")
                break
        
        if not mtm_file:
            self.log("❌ No se encontró archivo MtM Excel (MtM_v...)", level="ERROR")
            self.log("� Asegúrate de que el directorio contiene un archivo MtM_v*.xlsm", level="INFO")
            return
        
        # NUEVO FLUJO: Escribir I14 + Ejecutar Macro automáticamente
        self.log(f"📂 Procesando archivo MtM con automatización completa...", level="INFO")
        try:
            import os
            
            if os.path.exists(mtm_file):
                # Automatización completa usando módulo modular (Paso 1 + Paso 2)
                self.log("⚡ Paso 2: Automatización Excel usando arquitectura modular...", level="INFO")
                success = self._ejecutar_automatizacion_modular(mtm_file, carpeta_descarga)
                
                if success:
                    self.log("🎉 ¡AUTOMATIZACIÓN COMPLETADA!", level="EXITO")
                    self.log("✅ ✓ Carpeta configurada en I14", level="EXITO")
                    self.log("✅ ✓ Tablas limpiadas automáticamente", level="EXITO")
                    self.log("✅ ✓ Excel listo para trabajo manual", level="EXITO")
                else:
                    self.log("⚠️ Automatización incompleta - revisar logs", level="ADVERTENCIA")
                
                self.log("📋 IMPORTANTE: Habilita las macros si Excel te lo pregunta", level="INFO")
                
            else:
                self.log(f"❌ El archivo no existe: {mtm_file}", level="ERROR")
                return
            
            # Actualizar timeline a fase 2 si está disponible
            if hasattr(self, 'timeline_callbacks') and self.timeline_callbacks:
                self.timeline_callbacks['start_phase2']()
                self.log("[TIMELINE] Iniciando fase de procesamiento Excel", level="DEBUG")
                
        except Exception as e:
            self.log(f"❌ Error abriendo archivo MtM: {e}", level="ERROR")

    def _ejecutar_automatizacion_modular(self, mtm_file_path: str, carpeta_descarga: str) -> bool:
        """
        Ejecuta la automatización Excel usando el módulo modular del Paso 2
        
        Args:
            mtm_file_path: Ruta completa del archivo Excel MtM
            carpeta_descarga: Carpeta de descarga a configurar
            
        Returns:
            bool: True si la automatización fue exitosa
        """
        try:
            # Importar módulo de automatización Excel (importación dinámica por espacios en nombre)
            import sys
            import os
            
            # Agregar el directorio al path temporalmente
            paso2_dir = os.path.join(os.path.dirname(__file__), "automation", "MtM", "Paso 2")
            if paso2_dir not in sys.path:
                sys.path.insert(0, paso2_dir)
            
            import excel_automation  # type: ignore
            ejecutar_automatizacion_excel = excel_automation.ejecutar_automatizacion_excel
            
            self.log("📦 Usando módulo modular: automation/MtM/Paso 2/excel_automation.py", level="DEBUG")
            
            # Ejecutar automatización completa
            success = ejecutar_automatizacion_excel(
                excel_file_path=mtm_file_path,
                carpeta_descarga=carpeta_descarga,
                log_callback=self.log
            )
            
            return success
            
        except ImportError as e:
            self.log(f"❌ Error importando módulo de automatización: {e}", level="ERROR")
            self.log("🔄 Usando método de fallback...", level="INFO")
            # Fallback: abrir Excel manualmente
            import os
            os.startfile(mtm_file_path)
            return False
        except Exception as e:
            self.log(f"❌ Error en automatización modular: {e}", level="ERROR")
            return False

    # Métodos antiguos eliminados - funcionalidad movida a:
    # automation/MtM/Paso 2/excel_automation.py (arquitectura modular)

    def start_automation(self):
        
        # Validar carpeta de descarga
        if not GestorMensajes.validar_carpeta_seleccionada(self.selected_folder.get()):
            self.log("No se ha seleccionado una carpeta de descarga.", level="ADVERTENCIA")
            return

        # Validar archivos Excel (NUEVA VALIDACIÓN)
        if not self.excel_files_valid:
            self.log("⚠️ No se puede ejecutar: faltan archivos Excel requeridos", level="ERROR")
            self.log("📋 Archivos necesarios:", level="INFO")
            self.log("   • HT. Gestión Finanzas_v*.xlsx", level="INFO")
            self.log("   • MtM_v*_Macro.xlsm", level="INFO")
            self.log("💡 Selecciona un directorio que contenga estos archivos", level="INFO")

            # Mostrar diálogo informativo
            GestorMensajes.mostrar_error(
                "Archivos Excel Requeridos",
                "Para ejecutar la Valorización MtM se necesitan los archivos Excel de macros.\n\n"
                "Archivos requeridos:\n"
                "• HT. Gestión Finanzas_v*.xlsx\n"
                "• MtM_v*_Macro.xlsm\n\n"
                "Selecciona un directorio que contenga estos archivos y presiona 'Validar Archivos'",
            )
            return

        # Si llegamos aquí, todas las validaciones han pasado
        self.log("=== INICIANDO AUTOMATIZACIÓN ===", level="INFO")
        self.log(f"Fecha seleccionada: {self.date_entry.get()}", level="INFO")
        self.log(f"Carpeta: {self.selected_folder.get()}", level="INFO")

        # Mostrar información de archivos Excel encontrados
        found_files = self.excel_validator.get_found_files_info()
        if found_files:
            self.log("📊 Archivos Excel validados:", level="EXITO")
            for file_type, filename in found_files.items():
                display_name = self.excel_validator.PATTERNS[file_type]["display_name"]
                self.log(f"   • {display_name}: {filename}", level="INFO")

        def run_automation():
            try:
                import sys
                import os
                import glob
                import traceback

                # Actualizar timeline - comenzando automatización
                if hasattr(self, 'timeline_callbacks') and self.timeline_callbacks:
                    self.timeline_callbacks['start_automation']()

                base_dir = os.path.dirname(__file__)
                if base_dir not in sys.path:
                    sys.path.insert(0, base_dir)
                    
                # Agregar también el directorio automation al path como fallback
                automation_dir = os.path.join(base_dir, "automation")
                if automation_dir not in sys.path:
                    sys.path.insert(0, automation_dir)
                    
                self.log(
                    "[DEBUG IMPORT] Intentando importar automation.web_automator", level="DEBUG"
                )
                try:
                    from automation.web_automator import WebAutomator
                except ModuleNotFoundError as e:
                    self.log(f"[DEBUG IMPORT] Error inicial: {e}", level="DEBUG")
                    auto_dir = os.path.join(base_dir, "automation")
                    existentes = [
                        os.path.basename(f) for f in glob.glob(os.path.join(auto_dir, "*"))
                    ]
                    self.log(f"[DEBUG IMPORT] Contenido automation/: {existentes}", level="DEBUG")
                    
                    # Intentar importación alternativa
                    try:
                        import importlib.util
                        spec = importlib.util.spec_from_file_location(
                            "web_automator", 
                            os.path.join(auto_dir, "web_automator.py")
                        )
                        if spec and spec.loader:
                            web_automator_module = importlib.util.module_from_spec(spec)
                            spec.loader.exec_module(web_automator_module)
                            WebAutomator = web_automator_module.WebAutomator
                            self.log("[DEBUG IMPORT] Importación alternativa exitosa", level="DEBUG")
                        else:
                            raise ImportError("No se pudo crear el spec del módulo")
                    except Exception as e2:
                        self.log(f"[DEBUG IMPORT] Importación alternativa falló: {e2}", level="ERROR")
                        raise
                
                # Iniciar automatización con timeline integrado
                automator = WebAutomator(self.log)
                carpeta = self.selected_folder.get().replace("Carpeta: ", "")
                
                # Configurar callbacks del timeline si está disponible
                if hasattr(self, 'timeline_callbacks') and self.timeline_callbacks:
                    # El automator no tiene soporte nativo para timeline callbacks
                    # Manejaremos las actualizaciones del timeline desde aquí
                    self.log("[DEBUG] Timeline callbacks configurados externamente", level="DEBUG")
                
                automator.start(download_dir=carpeta)
                self.log("Automatización finalizada con éxito.", level="EXITO")
                self.log("🎉 Archivos listos para procesamiento con macros Excel", level="EXITO")
                
                # Marcar timeline como completado
                if hasattr(self, 'timeline_callbacks') and self.timeline_callbacks:
                    self.timeline_callbacks['complete_automation']()
                    
            except Exception as e:
                import traceback

                tb = traceback.format_exc()
                self.log(f"[ERROR Thread] {e}\n{tb}", level="ERROR")
                
                # Marcar error en timeline - resetear a estado inicial
                if hasattr(self, 'timeline_callbacks') and self.timeline_callbacks:
                    # Simplemente resetear el timeline en caso de error
                    if hasattr(self, 'timeline') and self.timeline:
                        self.timeline.reset_all_phases()

        threading.Thread(target=run_automation, daemon=True).start()


class ForwardCalculatorPlaceholder(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Calculadora de Forward")
        self.geometry("480x240")
        self.resizable(False, False)
        self.configure(bg="white")
        tk.Label(
            self, text="DISEÑAR MENU NUEVO", font=("Arial", 16, "bold"), bg="white", fg="#007ACC"
        ).pack(pady=30)
        tk.Label(
            self,
            text="Esta vista es un placeholder para la futura Calculadora de Forward.",
            font=("Arial", 11),
            bg="white",
            fg="gray",
            wraplength=420,
        ).pack(pady=10)
        crear_boton_secundario(self, "Volver al menú principal", self.volver_menu_principal).pack(
            pady=20
        )

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
        tk.Label(self, text="Selecciona un módulo", font=("Arial", 18, "bold"), bg="white").pack(
            pady=25
        )
        crear_boton_primario(self, "Valorización MtM", self.abrir_mtm_downloader, width=22).pack(
            pady=10
        )
        crear_boton_ejecutar(
            self, "Calculadora de Forward", self.abrir_calculadora_forward, width=20, height=1
        ).pack()

    def abrir_mtm_downloader(self):
        print("🔧 [DEBUG] Botón 'Valorización MtM' presionado")
        print(f"🔧 [DEBUG] MACRO_VALIDATION_AVAILABLE = {MACRO_VALIDATION_AVAILABLE}")
        
        # Mostrar popup de configuración de macros ANTES de abrir Menu 1
        if MACRO_VALIDATION_AVAILABLE:
            print("🔧 [DEBUG] Intentando mostrar popup de configuración...")
            try:
                # Mostrar popup modal - el usuario debe confirmar la configuración
                user_confirmed = show_macro_config_popup(parent_window=self)
                print(f"🔧 [DEBUG] Resultado del popup: {user_confirmed}")
                
                if not user_confirmed:
                    # Usuario canceló, no abrir MtM Downloader
                    print("❌ [DEBUG] Usuario canceló, no abriendo MtM Downloader")
                    return
            except Exception as e:
                print(f"❌ [ERROR] Error mostrando popup: {e}")
                # Continuar sin popup en caso de error
        else:
            print("⚠️ [DEBUG] Validación de macros no disponible, saltando popup")
        
        # Si llegamos aquí, el usuario confirmó o no hay validación disponible
        print("✅ [DEBUG] Abriendo MtM Downloader...")
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
