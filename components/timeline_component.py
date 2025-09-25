"""
Timeline Component para MtM Downloader
Autor: GitHub Copilot
Fecha: 24 de Septiembre, 2025

Este componente crea un timeline visual de 3 fases para mostrar el progreso
del bot de automatización MtM.
"""

import tkinter as tk
from tkinter import ttk
import os
import logging
from typing import Dict, List, Literal

# Importar PIL con fallback
try:
    from PIL import Image, ImageTk
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

# Tipos para las fases
PhaseStatus = Literal["pending", "active", "completed"]


class TimelineComponent(tk.Frame):
    """
    🎯 Componente Timeline Visual para mostrar progreso de automatización
    
    Características:
    - 3 fases configurables con iconos
    - Estados visuales: pendiente, activo, completado
    - Líneas de progreso animadas
    - Responsive y profesional
    """

    def __init__(self, parent, **kwargs):
        super().__init__(parent, bg="white", **kwargs)
        
        # Configuración de fases
        self.phases = {
            "fase1": {
                "name": "MtM Downloader",
                "icon": "chrome.webp",
                "description": "Descarga de archivos MtM",
                "status": "pending"
            },
            "fase2": {
                "name": "Procesamiento Excel", 
                "icon": "excel.webp",
                "description": "Archivos MtM procesados en Excel",
                "status": "pending"
            },
            "fase3": {
                "name": "Resultados Finales",
                "icon": "notepad.webp", 
                "description": "MtM final exportado en un bloc de notas",
                "status": "pending"
            }
        }
        
        # Variables para widgets
        self.phase_widgets: Dict[str, Dict] = {}
        self.progress_bars: List[tk.Canvas] = []
        
        # Configuración visual
        self.COLORS = {
            "pending": "#E0E0E0",      # Gris claro
            "active": "#FFA500",       # Naranja
            "completed": "#4CAF50",    # Verde
            "text_primary": "#2C3E50", # Azul oscuro
            "text_secondary": "#7F8C8D", # Gris medio
            "bg_timeline": "#F8F9FA"    # Fondo muy claro
        }
        
        self.create_timeline()

    def create_timeline(self):
        """🎨 Crear la estructura visual del timeline"""
        
        # Frame principal del timeline con padding (aumentado 15%)
        timeline_frame = tk.Frame(self, bg=self.COLORS["bg_timeline"], relief="flat", bd=1)
        timeline_frame.pack(fill="x", padx=20, pady=17)  # 15 -> 17 (15% más)
        
        # Título del timeline
        title_label = tk.Label(
            timeline_frame,
            text="📊 Progreso de Automatización",
            font=("Segoe UI", 12, "bold"),
            fg=self.COLORS["text_primary"],
            bg=self.COLORS["bg_timeline"]
        )
        title_label.pack(pady=(12, 17))  # (10, 15) -> (12, 17) (15% más)
        
        # Frame para las fases (horizontal)
        phases_frame = tk.Frame(timeline_frame, bg=self.COLORS["bg_timeline"])
        phases_frame.pack(fill="x", padx=10, pady=(0, 12))  # (0, 10) -> (0, 12) (15% más)
        
        # Crear cada fase
        phase_names = list(self.phases.keys())
        for i, phase_key in enumerate(phase_names):
            phase_data = self.phases[phase_key]
            
            # Frame individual de la fase
            phase_frame = tk.Frame(phases_frame, bg=self.COLORS["bg_timeline"])
            
            if i == 0:
                phase_frame.pack(side="left", fill="both", expand=True)
            else:
                phase_frame.pack(side="left", fill="both", expand=True, padx=(10, 0))
            
            # Crear widgets de la fase
            self._create_phase_widgets(phase_frame, phase_key, phase_data, i)
            
            # Crear línea de progreso (excepto en la última fase)
            if i < len(phase_names) - 1:
                self._create_progress_line(phases_frame, i)

    def _create_phase_widgets(self, parent, phase_key: str, phase_data: Dict, index: int):
        """🔧 Crear widgets individuales de cada fase"""
        
        # Frame contenedor de la fase
        container = tk.Frame(parent, bg=self.COLORS["bg_timeline"])
        container.pack(fill="both", expand=True)
        
        # Icono de la fase (40x40px)
        icon_frame = tk.Frame(container, bg=self.COLORS["bg_timeline"])
        icon_frame.pack(pady=(0, 8))
        
        # Cargar y mostrar icono
        icon_label = self._create_icon_widget(icon_frame, phase_data["icon"], phase_data["status"])
        
        # Nombre de la fase
        name_label = tk.Label(
            container,
            text=phase_data["name"],
            font=("Segoe UI", 10, "bold"),
            fg=self.COLORS["text_primary"],
            bg=self.COLORS["bg_timeline"]
        )
        name_label.pack()
        
        # Descripción de la fase
        desc_label = tk.Label(
            container,
            text=phase_data["description"],
            font=("Segoe UI", 8),
            fg=self.COLORS["text_secondary"],
            bg=self.COLORS["bg_timeline"],
            wraplength=120
        )
        desc_label.pack(pady=(2, 0))
        
        # Indicador de estado
        status_label = self._create_status_indicator(container, phase_data["status"])
        
        # Guardar referencias a los widgets
        self.phase_widgets[phase_key] = {
            "container": container,
            "icon": icon_label,
            "name": name_label,
            "description": desc_label,
            "status": status_label
        }

    def _create_icon_widget(self, parent, icon_filename: str, status: PhaseStatus) -> tk.Label:
        """🖼️ Crear widget de icono con estado visual"""
        
        try:
            # Path de la imagen
            icon_path = os.path.join(
                os.path.dirname(__file__), 
                "..", "..", "automation", "shared", "images", icon_filename
            )
            
            # Si PIL está disponible y la imagen existe, usar imagen real
            if PIL_AVAILABLE and os.path.exists(icon_path):
                image = Image.open(icon_path)
                image = image.resize((40, 40), Image.Resampling.LANCZOS)
                
                # Aplicar efecto según estado
                if status == "pending":
                    # Imagen más opaca para pendientes
                    image = image.convert("RGBA")
                    alpha = image.split()[3]
                    alpha = alpha.point(lambda p: int(p * 0.5))  # 50% opacity
                    image.putalpha(alpha)
                elif status == "completed":
                    # Imagen normal para completados
                    pass
                elif status == "active":
                    # Podríamos agregar un borde o efecto para activos
                    pass
                
                photo = ImageTk.PhotoImage(image)
                
                # Crear label con la imagen
                icon_label = tk.Label(parent, image=photo, bg=self.COLORS["bg_timeline"])
                # Guardar referencia para evitar garbage collection
                setattr(icon_label, '_photo_reference', photo)
                icon_label.pack()
                
                return icon_label
            else:
                # Fallback: usar emoji siempre si no hay PIL o no existe imagen
                fallback_icons = {
                    "chrome.webp": "🌐",
                    "excel.webp": "📊", 
                    "notepad.webp": "📝"
                }
                
                # Colores por estado para el fallback
                color_by_status = {
                    "pending": "#CCCCCC",
                    "active": "#007ACC", 
                    "completed": "#28A745"
                }
                
                icon_label = tk.Label(
                    parent,
                    text=fallback_icons.get(icon_filename, "❓"),
                    font=("Segoe UI", 20),
                    fg=color_by_status.get(status, "#000000"),
                    bg=self.COLORS["bg_timeline"]
                )
                icon_label.pack()
                
                return icon_label
                
        except Exception as e:
            logging.debug(f"[TIMELINE] Error loading icon {icon_filename}: {e}")
            logging.debug(f"[TIMELINE] Falling back to emoji for {icon_filename}")
            
            # Fallback simple
            icon_label = tk.Label(
                parent,
                text="⚙️",
                font=("Segoe UI", 20),
                bg=self.COLORS["bg_timeline"]
            )
            icon_label.pack()
            
            return icon_label

    def _create_status_indicator(self, parent, status: PhaseStatus) -> tk.Label:
        """📊 Crear indicador visual de estado"""
        
        status_config = {
            "pending": {"text": "⏳ Pendiente", "color": self.COLORS["pending"]},
            "active": {"text": "🔄 En progreso", "color": self.COLORS["active"]},
            "completed": {"text": "✅ Completado", "color": self.COLORS["completed"]}
        }
        
        config = status_config[status]
        
        status_label = tk.Label(
            parent,
            text=config["text"],
            font=("Segoe UI", 8, "bold"),
            fg=config["color"],
            bg=self.COLORS["bg_timeline"]
        )
        status_label.pack(pady=(5, 0))
        
        return status_label

    def _create_progress_line(self, parent, index: int):
        """📈 Crear línea de progreso entre fases"""
        
        # Canvas para la línea de progreso
        progress_canvas = tk.Canvas(
            parent,
            width=60,
            height=8,
            bg=self.COLORS["bg_timeline"],
            highlightthickness=0
        )
        progress_canvas.pack(side="left", pady=35)
        
        # Línea base (gris)
        progress_canvas.create_line(
            0, 4, 60, 4,
            fill=self.COLORS["pending"],
            width=4,
            tags="base_line"
        )
        
        # Línea de progreso (inicialmente vacía)
        progress_canvas.create_line(
            0, 4, 0, 4,  # Inicialmente sin progreso
            fill=self.COLORS["completed"],
            width=4,
            tags="progress_line"
        )
        
        self.progress_bars.append(progress_canvas)

    def update_phase_status(self, phase_key: str, new_status: PhaseStatus):
        """🔄 Actualizar estado de una fase específica"""
        
        if phase_key not in self.phases:
            logging.debug(f"[TIMELINE] Error: Phase '{phase_key}' not found in phases: {list(self.phases.keys())}")
            return
            
        # Actualizar datos
        old_status = self.phases[phase_key]["status"]
        self.phases[phase_key]["status"] = new_status
        
        # Actualizar widgets visuales
        if phase_key in self.phase_widgets:
            widgets = self.phase_widgets[phase_key]
            
            # Actualizar indicador de estado
            self._update_status_widget(widgets["status"], new_status)
            
            # Actualizar icono si es necesario
            self._update_icon_opacity(widgets["icon"], new_status)
        
        # Actualizar líneas de progreso
        self._update_progress_lines()
        
        # Strategic DEBUG logging for developer troubleshooting
        logging.debug(f"[TIMELINE] Phase '{phase_key}' status changed from '{old_status}' to '{new_status}'")

    def _update_status_widget(self, status_widget: tk.Label, new_status: PhaseStatus):
        """🔧 Actualizar widget de estado"""
        
        status_config = {
            "pending": {"text": "⏳ Pendiente", "color": self.COLORS["pending"]},
            "active": {"text": "🔄 En progreso", "color": self.COLORS["active"]},
            "completed": {"text": "✅ Completado", "color": self.COLORS["completed"]}
        }
        
        config = status_config[new_status]
        status_widget.config(text=config["text"], fg=config["color"])

    def _update_icon_opacity(self, icon_widget: tk.Label, new_status: PhaseStatus):
        """🎨 Actualizar opacidad del icono según estado"""
        # Esta funcionalidad se puede expandir más adelante
        pass

    def _update_progress_lines(self):
        """📈 Actualizar líneas de progreso basadas en estados"""
        
        phase_keys = list(self.phases.keys())
        
        for i, canvas in enumerate(self.progress_bars):
            if i < len(phase_keys):
                phase_status = self.phases[phase_keys[i]]["status"]
                
                # La línea se completa si la fase actual está completada
                if phase_status == "completed":
                    # Línea completamente llena
                    canvas.coords("progress_line", 0, 4, 60, 4)
                elif phase_status == "active":
                    # Línea medio llena
                    canvas.coords("progress_line", 0, 4, 30, 4)
                else:
                    # Sin progreso
                    canvas.coords("progress_line", 0, 4, 0, 4)

    def start_phase(self, phase_key: str):
        """🚀 Iniciar una fase (marcarla como activa)"""
        self.update_phase_status(phase_key, "active")

    def complete_phase(self, phase_key: str):
        """✅ Completar una fase"""
        self.update_phase_status(phase_key, "completed")

    def reset_timeline(self):
        """🔄 Resetear timeline a estado inicial"""
        for phase_key in self.phases.keys():
            self.update_phase_status(phase_key, "pending")

    def get_current_phase(self) -> str:
        """📍 Obtener la fase actual (activa o siguiente pendiente)"""
        
        for phase_key, phase_data in self.phases.items():
            if phase_data["status"] == "active":
                return phase_key
            elif phase_data["status"] == "pending":
                return phase_key
                
        # Si todas están completadas, devolver la última
        return list(self.phases.keys())[-1]

    def set_phase_status(self, phase_key: str, status: PhaseStatus):
        """🎯 Alias para update_phase_status - Establecer estado de una fase"""
        self.update_phase_status(phase_key, status)

    def reset_all_phases(self):
        """🔄 Alias para reset_timeline - Resetear todas las fases a estado inicial"""
        self.reset_timeline()


# Funciones de utilidad para integrar con la aplicación principal

def create_timeline_widget(parent) -> TimelineComponent:
    """🏭 Factory function para crear timeline component"""
    return TimelineComponent(parent)


def integrate_timeline_with_automation(timeline: TimelineComponent):
    """🔗 Integrar timeline con proceso de automatización"""
    
    def on_automation_start():
        """Callback cuando inicia la automatización"""
        timeline.reset_timeline()
        timeline.start_phase("fase1")
    
    def on_phase1_complete():
        """Callback cuando fase 1 termina"""
        timeline.complete_phase("fase1")
        # Fase 2 y 3 quedan pendientes por ahora
    
    def on_phase2_start():
        """Callback para futuro desarrollo de fase 2"""
        timeline.start_phase("fase2")
    
    def on_phase2_complete():
        """Callback para futuro desarrollo de fase 2"""
        timeline.complete_phase("fase2")
    
    def on_phase3_start():
        """Callback para futuro desarrollo de fase 3"""
        timeline.start_phase("fase3")
        
    def on_phase3_complete():
        """Callback para futuro desarrollo de fase 3"""
        timeline.complete_phase("fase3")
    
    return {
        "start_automation": on_automation_start,
        "complete_phase1": on_phase1_complete,
        "start_phase2": on_phase2_start,
        "complete_phase2": on_phase2_complete,
        "start_phase3": on_phase3_start,
        "complete_phase3": on_phase3_complete
    }