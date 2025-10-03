"""
Forward Calculator UI Module
Autor: GitHub Copilot
Fecha: 1 de Octubre, 2025

Interfaz de usuario para la Calculadora de Forward con validaciones avanzadas de fechas.
"""

import tkinter as tk
from tkinter import ttk
from datetime import datetime, timedelta
from typing import Optional, Callable
import calendar
import sys
import os

# Importar CustomDatePicker
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from components.custom_date_picker import CustomDatePicker
from components.botones import crear_boton_ejecutar


class ForwardCalculatorUI(tk.Tk):
    """
    Interfaz principal de la Calculadora de Forward
    
    Validaciones implementadas:
    - Fecha Inicio: >= día actual
    - Mes Vencimiento: >= mes de Fecha Inicio
    - Si Fecha Inicio es último día del mes actual → Mes Vencimiento >= mes siguiente
    """
    
    def __init__(self, log_callback: Optional[Callable] = None):
        super().__init__()
        
        self.log = log_callback if log_callback else self._default_log
        
        # Variables de estado
        self.fecha_inicio_var = tk.StringVar()
        self.mes_vencimiento_var = tk.StringVar()
        
        # Variables de validación
        self.selected_directory = None
        self.inputs_validated = False
        
        # Variables de Modo Turbo y Progress Bar
        self.modo_turbo = tk.BooleanVar(value=False)
        self.progress_var = tk.DoubleVar(value=0.0)
        
        # Configuración de ventana
        self.title("Calculadora de Forward")
        self.geometry("700x900")  # Altura aumentada para mostrar TODOS los elementos cómodamente
        self.resizable(False, False)
        self.configure(bg="white")
        
        # UI setup
        self.setup_ui()
        
        # Configurar mes vencimiento inicial
        self._update_mes_vencimiento_options()
        
    def _default_log(self, message: str, level: str = "INFO"):
        """Log por defecto si no se proporciona callback"""
        print(f"[{level}] {message}")
    
    def setup_ui(self):
        """Configura los elementos de la interfaz"""
        
        # === HEADER ===
        tk.Label(
            self, 
            text="Calculadora de Forward", 
            font=("Arial", 20, "bold"), 
            bg="white",
            fg="#007ACC"
        ).pack(pady=15)
        
        tk.Label(
            self,
            text="Cálculo de tasas forward para instrumentos financieros",
            font=("Arial", 11),
            bg="white",
            fg="gray"
        ).pack(pady=(0, 20))
        
        # === FRAME PRINCIPAL ===
        main_frame = tk.Frame(self, bg="white")
        main_frame.pack(pady=10, padx=40, fill="both", expand=True)
        
        # === FECHA INICIO ===
        fecha_inicio_frame = tk.Frame(main_frame, bg="white")
        fecha_inicio_frame.pack(fill="x", pady=8)
        
        tk.Label(
            fecha_inicio_frame,
            text="Fecha Inicio:",
            font=("Arial", 12, "bold"),
            bg="white",
            fg="#333"
        ).pack(anchor="w")
        
        tk.Label(
            fecha_inicio_frame,
            text="Selecciona la fecha de inicio (puede ser cualquier fecha hasta hoy)",
            font=("Arial", 9),
            bg="white",
            fg="gray"
        ).pack(anchor="w", pady=(2, 5))
        
        # CustomDatePicker para fecha inicio (sin restricción de mindate)
        self.date_entry = CustomDatePicker(
            fecha_inicio_frame,
            callback=self._on_fecha_inicio_changed,
            width=20
        )
        self.date_entry.pack(anchor="w")
        
        # === MES VENCIMIENTO ===
        mes_vencimiento_frame = tk.Frame(main_frame, bg="white")
        mes_vencimiento_frame.pack(fill="x", pady=12)
        
        tk.Label(
            mes_vencimiento_frame,
            text="Mes Vencimiento:",
            font=("Arial", 12, "bold"),
            bg="white",
            fg="#333"
        ).pack(anchor="w")
        
        self.validation_label = tk.Label(
            mes_vencimiento_frame,
            text="",
            font=("Arial", 9),
            bg="white",
            fg="gray"
        )
        self.validation_label.pack(anchor="w", pady=(2, 5))
        
        # Combobox para mes vencimiento
        self.mes_combo = ttk.Combobox(
            mes_vencimiento_frame,
            textvariable=self.mes_vencimiento_var,
            state="readonly",
            width=25,
            font=("Arial", 11)
        )
        self.mes_combo.pack(anchor="w")
        # Binding para validación en tiempo real
        self.mes_combo.bind('<<ComboboxSelected>>', self._on_mes_vencimiento_changed)
        
        # === SELECCIONAR DIRECTORIO ===
        directorio_frame = tk.Frame(main_frame, bg="white")
        directorio_frame.pack(fill="x", pady=12)
        
        tk.Label(
            directorio_frame,
            text="Directorio de Salida:",
            font=("Arial", 12, "bold"),
            bg="white",
            fg="#333"
        ).pack(anchor="w")
        
        tk.Label(
            directorio_frame,
            text="Selecciona el directorio donde se guardarán los resultados",
            font=("Arial", 9),
            bg="white",
            fg="gray"
        ).pack(anchor="w", pady=(2, 5))
        
        # Frame para botón y label de directorio
        dir_control_frame = tk.Frame(directorio_frame, bg="white")
        dir_control_frame.pack(fill="x", anchor="w")
        
        # Botón para seleccionar directorio
        tk.Button(
            dir_control_frame,
            text="Seleccionar Directorio",
            command=self._select_directory,
            bg="#007ACC",
            fg="white",
            font=("Arial", 10, "bold"),
            cursor="hand2",
            width=20,
            relief="raised"
        ).pack(side="left", padx=(0, 10))
        
        # Label para mostrar directorio seleccionado
        self.directory_label = tk.Label(
            dir_control_frame,
            text="Ningún directorio seleccionado",
            font=("Arial", 9),
            bg="white",
            fg="gray",
            wraplength=300,
            justify="left"
        )
        self.directory_label.pack(side="left")
        
        # === MODO TURBO ===
        turbo_frame = tk.Frame(main_frame, bg="white")
        turbo_frame.pack(pady=(8, 0))
        
        turbo_check = tk.Checkbutton(
            turbo_frame,
            text="⚡ Modo Turbo (navegación rápida)",
            variable=self.modo_turbo,
            font=("Arial", 11, "bold"),
            bg="white",
            fg="#FF6B00",
            activebackground="white",
            activeforeground="#FF8C00",
            selectcolor="white",
            cursor="hand2"
        )
        turbo_check.pack()
        
        tk.Label(
            turbo_frame,
            text="Reduce tiempos de espera al 25% - Procesamiento ultra rápido",
            font=("Arial", 9),
            bg="white",
            fg="gray"
        ).pack()
        
        # === PROGRESS BAR ===
        progress_frame = tk.Frame(main_frame, bg="white")
        progress_frame.pack(pady=(10, 0), fill="x", padx=20)
        
        tk.Label(
            progress_frame,
            text="Progreso de Automatización:",
            font=("Arial", 10, "bold"),
            bg="white"
        ).pack(anchor="w")
        
        self.progress_bar = ttk.Progressbar(
            progress_frame,
            variable=self.progress_var,
            maximum=100,
            length=400,
            mode='determinate'
        )
        self.progress_bar.pack(pady=5, fill="x")
        
        self.progress_label = tk.Label(
            progress_frame,
            text="0%",
            font=("Arial", 9),
            bg="white",
            fg="gray"
        )
        self.progress_label.pack()
        
        # === BOTONES (EJECUTAR Y VOLVER) ===
        button_frame = tk.Frame(main_frame, bg="white")
        button_frame.pack(pady=20)
        
        # Usar la misma factory que el menú MtM para consistencia visual
        self.ejecutar_button = crear_boton_ejecutar(
            button_frame,
            "▶️ EJECUTAR CÁLCULO",
            self.ejecutar_calculo,
            width=28,
            height=2  # 2 líneas de texto para mejor visibilidad (igual que MtM)
        )
        self.ejecutar_button.pack()
        
        # Inicializar botón como deshabilitado hasta que se validen inputs
        self.ejecutar_button.configure(state="disabled", bg="#CCCCCC", fg="#666666")
        
        # === BOTÓN VOLVER ===
        volver_button = tk.Button(
            button_frame,
            text="⬅️ Volver al menú principal",
            font=("Arial", 12, "bold"),
            bg="#6c757d",
            fg="white",
            command=self.volver_menu,
            width=28,
            height=2,
            cursor="hand2",
            relief="raised",
            borderwidth=2
        )
        volver_button.pack(pady=(20, 10))
        
    def _on_fecha_inicio_changed(self, event=None):
        """Callback cuando cambia la fecha de inicio"""
        self._update_mes_vencimiento_options()
        # Validar inputs después de cambiar fecha
        self._update_ejecutar_button_state()
        
    def _update_mes_vencimiento_options(self):
        """
        Actualiza las opciones del selector de mes vencimiento basado en:
        1. Fecha Inicio seleccionada
        2. Si es último día del mes actual
        """
        try:
            # Obtener fecha seleccionada
            fecha_inicio = self.date_entry.get_date()
            hoy = datetime.now()
            
            # Determinar mes mínimo de vencimiento
            mes_minimo = fecha_inicio.month
            año_minimo = fecha_inicio.year
            
            # Validación especial: Si es último día del mes actual
            ultimo_dia_mes_actual = calendar.monthrange(hoy.year, hoy.month)[1]
            es_ultimo_dia_mes = (
                fecha_inicio.day == ultimo_dia_mes_actual and 
                fecha_inicio.month == hoy.month and 
                fecha_inicio.year == hoy.year
            )
            
            if es_ultimo_dia_mes:
                # Si es último día del mes actual, mes vencimiento debe ser >= mes siguiente
                mes_minimo += 1
                if mes_minimo > 12:
                    mes_minimo = 1
                    año_minimo += 1
                
                self.validation_label.config(
                    text="⚠️ Último día del mes actual: mes vencimiento debe ser al menos el siguiente",
                    fg="#FF6B35"
                )
            else:
                self.validation_label.config(
                    text="Selecciona el mes de vencimiento (igual o posterior a la fecha inicio)",
                    fg="gray"
                )
            
            # Generar lista de meses disponibles
            meses_disponibles = []
            mes_actual = mes_minimo
            año_actual = año_minimo
            
            # Generar meses hasta diciembre 2028
            fecha_limite = datetime(2028, 12, 31)
            while año_actual < 2029:  # Hasta fines de 2028
                mes_nombre = self._get_mes_nombre(mes_actual)
                meses_disponibles.append(f"{mes_nombre} {año_actual}")
                
                mes_actual += 1
                if mes_actual > 12:
                    mes_actual = 1
                    año_actual += 1
            
            # Actualizar combobox
            self.mes_combo['values'] = meses_disponibles
            
            # Seleccionar primer mes por defecto si no hay selección
            if not self.mes_vencimiento_var.get() or self.mes_vencimiento_var.get() not in meses_disponibles:
                self.mes_combo.current(0)
                
        except Exception as e:
            self.log(f"❌ Error actualizando mes vencimiento: {e}", level="ERROR")
    
    def _on_mes_vencimiento_changed(self, event=None):
        """Callback cuando cambia el mes de vencimiento"""
        self._update_ejecutar_button_state()
    
    def _validate_all_inputs(self) -> bool:
        """Valida que todos los inputs estén completos y correctos"""
        try:
            # 1. Validar fecha inicio (debe ser <= hoy, no puede ser futura)
            fecha_inicio = self.date_entry.get_date()
            hoy = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            fecha_valida = fecha_inicio <= hoy
            
            # 2. Validar mes vencimiento (debe estar seleccionado)
            mes_valido = bool(self.mes_vencimiento_var.get())
            
            # 3. Validar directorio (debe estar seleccionado)
            directorio_valido = bool(self.selected_directory)
            
            return fecha_valida and mes_valido and directorio_valido
        except Exception as e:
            self.log(f"[DEBUG] Error en validación: {e}", level="DEBUG")
            return False
    
    def _update_ejecutar_button_state(self):
        """Actualiza estado visual del botón EJECUTAR según validación"""
        if self._validate_all_inputs():
            # Inputs válidos → Botón activo (cyan)
            self.ejecutar_button.configure(state="normal", bg="#06EFFF", fg="black")
            self.inputs_validated = True
            if not hasattr(self, '_validation_logged') or not self._validation_logged:
                self.log("✅ Todos los inputs validados - Botón EJECUTAR activo", level="EXITO")
                self._validation_logged = True
        else:
            # Inputs inválidos → Botón deshabilitado (gris)
            self.ejecutar_button.configure(state="disabled", bg="#CCCCCC", fg="#666666")
            self.inputs_validated = False
            self._validation_logged = False
    
    def _get_mes_nombre(self, mes_numero: int) -> str:
        """Convierte número de mes a nombre en español"""
        meses = {
            1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
            5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
            9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
        }
        return meses.get(mes_numero, "")
    
    def _select_directory(self):
        """Abre diálogo para seleccionar directorio de salida"""
        from tkinter import filedialog
        
        directory = filedialog.askdirectory(
            title="Seleccionar directorio de salida"
        )
        
        if directory:
            self.selected_directory = directory
            self.directory_label.config(
                text=f"📁 {directory}",
                fg="#28A745"  # Verde para indicar éxito
            )
            self.log(f"✅ Directorio seleccionado: {directory}", level="INFO")
            # Validar inputs después de seleccionar directorio
            self._update_ejecutar_button_state()
        else:
            self.log("⚠️ Selección de directorio cancelada", level="ADVERTENCIA")
    
    def ejecutar_calculo(self):
        """Ejecuta el cálculo de forward con los parámetros seleccionados"""
        try:
            # Obtener valores
            fecha_inicio = self.date_entry.get_date()
            mes_vencimiento_str = self.mes_vencimiento_var.get()
            
            # Validar que se haya seleccionado mes vencimiento
            if not mes_vencimiento_str:
                self.log("⚠️ Selecciona un mes de vencimiento", level="ADVERTENCIA")
                return
            
            # Validar que se haya seleccionado directorio
            if not self.selected_directory:
                self.log("⚠️ Selecciona un directorio de salida", level="ADVERTENCIA")
                import tkinter.messagebox as messagebox
                messagebox.showwarning(
                    "Directorio Requerido",
                    "Por favor selecciona un directorio donde guardar los resultados."
                )
                return
            
            # Log de parámetros
            self.log("=== INICIANDO AUTOMATIZACIÓN FORWARD ===", level="INFO")
            self.log(f"📅 Fecha Inicio: {fecha_inicio.strftime('%d-%m-%Y')}", level="INFO")
            self.log(f"📆 Mes Vencimiento: {mes_vencimiento_str}", level="INFO")
            self.log(f"📁 Directorio de Salida: {self.selected_directory}", level="INFO")
            
            # NUEVO: Cerrar instancias previas de Chrome/ChromeDriver para evitar bugs
            self.log("🔍 Verificando instancias previas de Selenium...", level="INFO")
            self._close_previous_selenium_instances()
            
            # Deshabilitar botón durante ejecución
            self.ejecutar_button.configure(state="disabled", bg="#FFA500", fg="white")
            self.ejecutar_button.configure(text="⏳ EJECUTANDO...")
            self.update_idletasks()
            
            # Importar y ejecutar ForwardAutomationEngine
            try:
                from automation.Forward.forward_automation_engine import ForwardAutomationEngine
                
                self.log("🔧 Iniciando motor de automatización...", level="INFO")
                
                # Paridades fijas: siempre se procesan estas 3
                paridades_seleccionadas = ["USD/CLP", "EUR/CLP", "UF"]
                self.log(f"📊 Paridades a procesar: {', '.join(paridades_seleccionadas)}", level="INFO")
                
                # Crear instancia del engine con Modo Turbo y Progress callback
                modo_turbo_activo = self.modo_turbo.get()
                self.log(f"⚡ Modo Turbo: {'ACTIVADO' if modo_turbo_activo else 'DESACTIVADO'}", level="INFO")
                
                engine = ForwardAutomationEngine(
                    fecha_inicio=fecha_inicio,
                    mes_vencimiento=mes_vencimiento_str,
                    paridades=paridades_seleccionadas,
                    directorio_salida=self.selected_directory,
                    log_callback=self.log,
                    progress_callback=self.update_progress,
                    modo_turbo=modo_turbo_activo
                )
                
                # Ejecutar automatización en thread separado para no bloquear UI
                import threading
                
                def run_automation():
                    try:
                        success = engine.start()
                        
                        # Restaurar botón después de ejecución
                        self.after(0, lambda: self.ejecutar_button.configure(
                            text="▶️ EJECUTAR CÁLCULO",
                            state="normal",
                            bg="#06EFFF",
                            fg="black"
                        ))
                        
                        if success:
                            self.after(0, lambda: self.log("✅ Automatización completada exitosamente", level="EXITO"))
                            # Mostrar popup de éxito
                            self.after(0, lambda: self._show_success_popup())
                        else:
                            self.after(0, lambda: self.log("⚠️ Automatización completada con advertencias", level="ADVERTENCIA"))
                            
                    except Exception as e:
                        self.after(0, lambda: self.log(f"❌ Error en automatización: {e}", level="ERROR"))
                        self.after(0, lambda: self.ejecutar_button.configure(
                            text="EJECUTAR",
                            state="normal",
                            bg="#06EFFF",
                            fg="black"
                        ))
                
                automation_thread = threading.Thread(target=run_automation, daemon=True)
                automation_thread.start()
                
                self.log("✅ Automatización iniciada en segundo plano", level="EXITO")
                self.log("💡 Revisa los logs para seguir el progreso", level="INFO")
                
            except ImportError as e:
                self.log(f"❌ Error importando ForwardAutomationEngine: {e}", level="ERROR")
                self.ejecutar_button.configure(text="EJECUTAR", state="normal", bg="#06EFFF", fg="black")
                return
            
        except Exception as e:
            self.log(f"❌ Error ejecutando cálculo: {e}", level="ERROR")
            # Restaurar botón en caso de error
            try:
                self.ejecutar_button.configure(text="EJECUTAR", state="normal", bg="#06EFFF", fg="black")
            except Exception:
                pass
    
    def volver_menu(self):
        """Vuelve al menú principal"""
        self.destroy()
        # Importar y lanzar menú principal
        try:
            import sys
            import os
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            if base_dir not in sys.path:
                sys.path.insert(0, base_dir)
            
            from mtm_downloader import launch_start_menu
            launch_start_menu()
        except Exception as e:
            self.log(f"❌ Error volviendo al menú: {e}", level="ERROR")
            self.destroy()
    
    def update_progress(self, porcentaje: float, mensaje: str = ""):
        """
        Actualiza la barra de progreso
        
        Args:
            porcentaje: Porcentaje completado (0-100)
            mensaje: Mensaje descriptivo del paso actual
        """
        try:
            self.progress_var.set(porcentaje)
            self.progress_label.configure(text=f"{int(porcentaje)}% - {mensaje}")
            self.update_idletasks()
        except Exception as e:
            self.log(f"⚠️ Error actualizando progreso: {e}", level="DEBUG")
    
    def _show_success_popup(self):
        """Muestra popup de éxito cuando la automatización termina"""
        try:
            import tkinter.messagebox as messagebox
            messagebox.showinfo(
                "✅ Proceso Completado",
                "\n✨ Proceso terminado con éxito \u2728\n\n"
                f"📁 Los resultados se guardaron en:\n{self.selected_directory}\n\n"
                "✅ Puedes revisar el archivo Excel generado."
            )
        except Exception as e:
            self.log(f"⚠️ Error mostrando popup: {e}", level="DEBUG")
    
    def _close_previous_selenium_instances(self):
        """Cierra SOLO instancias de ChromeDriver (Selenium), NO cierra Chrome normal del usuario"""
        try:
            import psutil
            import os
            
            procesos_cerrados = 0
            chrome_selenium_cerrados = 0
            
            # Buscar y cerrar SOLO ChromeDriver
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                try:
                    name = proc.info['name'].lower()
                    cmdline = proc.info.get('cmdline', [])
                    
                    # 1. SIEMPRE cerrar chromedriver.exe (es solo de Selenium)
                    if 'chromedriver' in name:
                        proc.kill()
                        procesos_cerrados += 1
                        self.log(f"🔪 ChromeDriver cerrado: PID {proc.info['pid']}", level="INFO")
                    
                    # 2. Cerrar Chrome SOLO si fue lanzado por ChromeDriver (tiene --test-type en cmdline)
                    elif 'chrome.exe' in name and cmdline:
                        # Chrome de Selenium tiene parámetros específicos
                        cmdline_str = ' '.join(cmdline).lower()
                        if '--test-type' in cmdline_str or '--enable-automation' in cmdline_str:
                            proc.kill()
                            chrome_selenium_cerrados += 1
                            self.log(f"🔪 Chrome de Selenium cerrado: PID {proc.info['pid']}", level="INFO")
                        # Si NO tiene esos parámetros, es Chrome normal del usuario → NO CERRAR
                        
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    pass
            
            total_cerrados = procesos_cerrados + chrome_selenium_cerrados
            
            if total_cerrados > 0:
                self.log(
                    f"✅ Cerrados: {procesos_cerrados} ChromeDriver + {chrome_selenium_cerrados} Chrome de Selenium",
                    level="EXITO"
                )
                self.log("💡 Chrome normal del usuario NO fue afectado", level="INFO")
            else:
                self.log("✅ No se encontraron instancias previas de Selenium", level="INFO")
                
        except ImportError:
            self.log("⚠️ psutil no disponible, omitiendo verificación de procesos", level="ADVERTENCIA")
        except Exception as e:
            self.log(f"⚠️ Error cerrando instancias previas: {e}", level="ADVERTENCIA")


def launch_forward_calculator(log_callback: Optional[Callable] = None):
    """
    Función principal para lanzar la Calculadora de Forward
    
    Args:
        log_callback: Función de logging (opcional)
    """
    app = ForwardCalculatorUI(log_callback)
    app.mainloop()


if __name__ == "__main__":
    # Test standalone
    print("🧪 Calculadora de Forward - Modo Test")
    launch_forward_calculator()
