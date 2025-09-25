import tkinter as tk
from tkinter.scrolledtext import ScrolledText
import time


class ConsolaWidget(tk.Frame):
    """Widget modular para consola de logs con funcionalidad de copiar al portapapeles y filtrado por nivel"""

    def __init__(
        self, parent, width=70, height=15, font=("Consolas", 9), bg="#f8f8f8", debug_mode=False
    ):
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
        self.title_label = tk.Label(self, text="Consola de eventos", font=("Arial", 13), bg="white")
        self.title_label.pack(anchor="w", pady=(0, 5))

        # Frame contenedor para consola y botón
        console_frame = tk.Frame(self, bg="white")
        console_frame.pack(fill="both", expand=True)

        # Consola de texto
        self.log_text = ScrolledText(
            console_frame, width=self.width, height=self.height, font=self.font, bg=self.bg
        )
        self.log_text.pack(side="left", fill="both", expand=True)

        # Botón copiar (icono)
        copy_icon = "\u2398"  # Unicode para icono de portapapeles
        self.copy_btn = tk.Button(
            console_frame,
            text=copy_icon,
            font=("Arial", 16),
            bg="#f8f8f8",
            fg="#007ACC",
            borderwidth=0,
            cursor="hand2",
            command=self.copiar_al_portapapeles,
            activebackground="#e0f7fa",
            width=2,
            height=1,
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
            self._tooltip,
            text="Copiar toda la consola al portapapeles",
            bg="#333",
            fg="white",
            font=("Arial", 9),
            padx=8,
            pady=3,
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
                filter_frame,
                text=nivel,
                value=nivel,
                variable=self.nivel_activo,
                indicatoron=False,
                width=int(10 * 1.15),
                font=("Arial", 9),
                command=self.filtrar_logs,
                bg="#e0e0e0",
                selectcolor="#b3e5fc",
            )
            btn.pack(side="left", padx=2)

    def agregar_log(self, message, level="INFO"):
        """Agregar un mensaje a la consola con timestamp y nivel"""
        # Limpiar mensaje de caracteres problemáticos
        if not message or not isinstance(message, str):
            return

        # Filtrar caracteres problemáticos que causan los corchetes repetidos
        message_limpio = message.strip()

        # Evitar mensajes que solo contengan caracteres repetidos
        if len(set(message_limpio)) == 1 and message_limpio:
            return

        # Evitar mensajes que sean solo brackets o caracteres especiales
        if message_limpio and all(c in "[]{}()" for c in message_limpio):
            return

        timestamp = time.strftime("%H:%M:%S")
        level = level.upper()
        color_map = {
            "INFO": "#222",
            "DEBUG": "#888",
            "ERROR": "#B71C1C",
            "EXITO": "#388E3C",
            "ADVERTENCIA": "#F9A825",
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
            "ADVERTENCIA": "[ADVERTENCIA]",
        }
        prefix = prefix_map.get(level, f"[{level}]")
        formatted_message = f"[{timestamp}] {prefix} {message_limpio}\n"

        try:
            self.log_text.insert(tk.END, formatted_message)
            self.log_text.tag_add(level, f"end-{len(formatted_message)}c", "end-1c")
            self.log_text.tag_config(level, foreground=color)
            self.log_text.see(tk.END)
            self.update_idletasks()
            self.filtrar_logs()
        except Exception as e:
            # Si hay error al insertar, insertar un mensaje de error limpio
            error_msg = f"[{timestamp}] [ERROR] Error al mostrar mensaje: {str(e)}\n"
            self.log_text.insert(tk.END, error_msg)

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
        self.agregar_log(
            "Consola copiada al portapapeles (solo nivel: {}).".format(nivel), level=nivel
        )

    def obtener_contenido_filtrado(self, nivel):
        """Obtener solo los mensajes del nivel seleccionado, evitando líneas corruptas"""
        contenido = self.log_text.get("1.0", tk.END)
        lineas = contenido.splitlines()
        resultado = []
        prefix_map = {
            "INFO": "[INFO]",
            "DEBUG": "[DEBUG]",
            "ERROR": "[ERROR]",
            "EXITO": "[ÉXITO]",
            "ADVERTENCIA": "[ADVERTENCIA]",
        }
        prefix = prefix_map.get(nivel, f"[{nivel}]")

        for linea in lineas:
            # Limpiar la línea de caracteres extraños
            linea_limpia = linea.strip()

            # Filtrar líneas que solo contengan caracteres repetidos como [[[[[
            if len(set(linea_limpia)) == 1 and linea_limpia:
                continue  # Saltar líneas con solo un carácter repetido

            # Filtrar líneas que sean solo corchetes o caracteres especiales repetidos
            if linea_limpia and all(c in "[]{}()" for c in linea_limpia):
                continue  # Saltar líneas que solo tengan brackets

            # Solo incluir líneas que contengan el prefijo válido y tengan contenido real
            if prefix in linea_limpia and len(linea_limpia) > len(prefix) + 10:
                # Verificar que la línea tenga el formato esperado [HH:MM:SS] [NIVEL] mensaje
                if "]" in linea_limpia and linea_limpia.count("[") >= 2:
                    resultado.append(linea_limpia)

        return "\n".join(resultado)

    def limpiar_consola(self):
        """Limpiar todo el contenido de la consola"""
        self.log_text.delete("1.0", tk.END)

    def limpiar_mensajes_corruptos(self):
        """Limpiar mensajes corruptos de la consola (líneas con caracteres repetidos)"""
        contenido = self.log_text.get("1.0", tk.END)
        lineas = contenido.splitlines()
        lineas_limpias = []

        for linea in lineas:
            linea_limpia = linea.strip()

            # Filtrar líneas corruptas
            if len(set(linea_limpia)) == 1 and linea_limpia:
                continue  # Saltar líneas con solo un carácter repetido

            if linea_limpia and all(c in "[]{}()" for c in linea_limpia):
                continue  # Saltar líneas que solo tengan brackets

            # Solo mantener líneas que parezcan logs válidos
            if "[" in linea_limpia and "]" in linea_limpia and linea_limpia.count("[") >= 2:
                lineas_limpias.append(linea)
            elif not linea_limpia:  # Mantener líneas vacías para formato
                lineas_limpias.append(linea)

        # Reemplazar contenido con versión limpia
        self.log_text.delete("1.0", tk.END)
        if lineas_limpias:
            contenido_limpio = "\n".join(lineas_limpias)
            self.log_text.insert("1.0", contenido_limpio)

    def obtener_contenido(self):
        """Obtener todo el contenido actual de la consola"""
        return self.log_text.get("1.0", tk.END)
