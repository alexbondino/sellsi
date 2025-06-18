import tkinter as tk
from tkinter.scrolledtext import ScrolledText
import time


class ConsolaWidget(tk.Frame):
    """Widget modular para consola de logs con funcionalidad de copiar al portapapeles y filtrado por nivel"""
    
    def __init__(self, parent, width=70, height=15, font=("Consolas", 9), bg="#f8f8f8", debug_mode=False):
        # Aumentar el ancho un 10% respecto al valor por defecto si no se pasa otro
        if width == 70:
            width = int(width * 1.1)
        super().__init__(parent, bg="white")
        
        # Configuración
        self.debug_mode = debug_mode
        self.niveles = ["INFO", "DEBUG", "ERROR", "EXITO", "ADVERTENCIA"]
        self.nivel_activo = tk.StringVar(value="INFO")
        self.width = width
        self.height = height
        self.font = font
        self.bg = bg
        
        # Componentes
        self.setup_filter_buttons()
        self.setup_components()
        
    def setup_components(self):
        """Configurar los componentes de la consola"""
        # Label de título
        self.title_label = tk.Label(
            self, text="Consola de eventos", 
            font=("Arial", 13), bg="white"
        )
        self.title_label.pack(anchor="w", pady=(0, 5))
        
        # Frame contenedor para consola y botón
        console_frame = tk.Frame(self, bg="white")
        console_frame.pack(fill="both", expand=True)
        
        # Consola de texto
        self.log_text = ScrolledText(
            console_frame, width=self.width, height=self.height,
            font=self.font, bg=self.bg
        )
        self.log_text.pack(side="left", fill="both", expand=True)
        
        # Botón copiar (icono)
        copy_icon = "\u2398"  # Unicode para icono de portapapeles
        self.copy_btn = tk.Button(
            console_frame, text=copy_icon, font=("Arial", 16), 
            bg="#f8f8f8", fg="#007ACC", borderwidth=0,
            cursor="hand2", command=self.copiar_al_portapapeles, 
            activebackground="#e0f7fa", width=2, height=1
        )
        self.copy_btn.pack(side="right", padx=(5, 0), anchor="n")
        
        # Tooltip para el botón
        self.setup_tooltip()
        
    def setup_tooltip(self):
        """Configurar tooltip para el botón de copiar"""
        self.copy_btn.bind("<Enter>", self.mostrar_tooltip)
        self.copy_btn.bind("<Leave>", self.ocultar_tooltip)
        self._tooltip = None
        
    def mostrar_tooltip(self, event):
        """Mostrar tooltip al hacer hover"""
        if self._tooltip:
            self._tooltip.destroy()
            
        x = self.copy_btn.winfo_rootx() + 40
        y = self.copy_btn.winfo_rooty() + 10
        
        self._tooltip = tk.Toplevel(self)
        self._tooltip.wm_overrideredirect(True)
        self._tooltip.wm_geometry(f"+{x}+{y}")
        
        label = tk.Label(
            self._tooltip, text="Copiar toda la consola al portapapeles",
            bg="#333", fg="white", font=("Arial", 9), padx=8, pady=3
        )
        label.pack()
        
    def ocultar_tooltip(self, event):
        """Ocultar tooltip"""
        if self._tooltip:
            self._tooltip.destroy()
            self._tooltip = None
            
    def setup_filter_buttons(self):
        """Agregar botones para filtrar por nivel de log"""
        filter_frame = tk.Frame(self, bg="white")
        filter_frame.pack(anchor="w", pady=(0, 5))
        for nivel in self.niveles:
            btn = tk.Radiobutton(
                filter_frame, text=nivel, value=nivel, variable=self.nivel_activo,
                indicatoron=0, width=int(10*1.15), font=("Arial", 9),
                command=self.filtrar_logs, bg="#e0e0e0", selectcolor="#b3e5fc"
            )
            btn.pack(side="left", padx=2)

    def agregar_log(self, message, level="INFO"):
        """Agregar un mensaje a la consola con timestamp y nivel"""
        timestamp = time.strftime("%H:%M:%S")
        level = level.upper()
        color_map = {
            "INFO": "#222",
            "DEBUG": "#888",
            "ERROR": "#B71C1C",
            "EXITO": "#388E3C",
            "ADVERTENCIA": "#F9A825"
        }
        color = color_map.get(level, "#222")
        # Mostrar DEBUG solo si debug_mode
        if level == "DEBUG" and not self.debug_mode:
            return
        # Prefijo visual
        prefix_map = {
            "INFO": "[INFO]",
            "DEBUG": "[DEBUG]",
            "ERROR": "[ERROR]",
            "EXITO": "[ÉXITO]",
            "ADVERTENCIA": "[ADVERTENCIA]"
        }
        prefix = prefix_map.get(level, f"[{level}]")
        formatted_message = f"[{timestamp}] {prefix} {message}\n"
        
        self.log_text.insert(tk.END, formatted_message)
        self.log_text.tag_add(level, f"end-{len(formatted_message)}c", "end-1c")
        self.log_text.tag_config(level, foreground=color)
        self.log_text.see(tk.END)
        self.update_idletasks()
        self.filtrar_logs()

    def filtrar_logs(self):
        """Mostrar solo los logs del nivel seleccionado"""
        nivel = self.nivel_activo.get()
        self.log_text.tag_remove("hidden", "1.0", tk.END)
        for n in self.niveles:
            if n != nivel:
                self.log_text.tag_config(n, elide=True)
            else:
                self.log_text.tag_config(n, elide=False)

    def copiar_al_portapapeles(self):
        """Copiar solo los mensajes visibles según el filtro activo"""
        nivel = self.nivel_activo.get()
        contenido = self.obtener_contenido_filtrado(nivel)
        self.clipboard_clear()
        self.clipboard_append(contenido)
        self.agregar_log("Consola copiada al portapapeles (solo nivel: {}).".format(nivel), level=nivel)

    def obtener_contenido_filtrado(self, nivel):
        """Obtener solo los mensajes del nivel seleccionado, evitando líneas vacías o con solo corchetes"""
        contenido = self.log_text.get("1.0", tk.END)
        lineas = contenido.splitlines()
        resultado = []
        prefix_map = {
            "INFO": "[INFO]",
            "DEBUG": "[DEBUG]",
            "ERROR": "[ERROR]",
            "EXITO": "[ÉXITO]",
            "ADVERTENCIA": "[ADVERTENCIA]"
        }
        prefix = prefix_map.get(nivel, f"[{nivel}]")
        for linea in lineas:
            # Solo incluir líneas que contengan el prefijo y tengan texto útil
            if prefix in linea and len(linea.strip()) > len(prefix) + 5:
                resultado.append(linea)
        return "\n".join(resultado)

    def limpiar_consola(self):
        """Limpiar todo el contenido de la consola"""
        self.log_text.delete("1.0", tk.END)
        
    def obtener_contenido(self):
        """Obtener todo el contenido actual de la consola"""
        return self.log_text.get("1.0", tk.END)
