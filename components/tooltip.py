import tkinter as tk


class Tooltip:
    """Clase reutilizable para crear tooltips en cualquier widget"""
    
    def __init__(self, widget, text, bg="#333", fg="white", font=("Arial", 9), delay=500):
        """
        Inicializar tooltip para un widget
        
        Args:
            widget: El widget al que se le agregará el tooltip
            text: Texto a mostrar en el tooltip
            bg: Color de fondo del tooltip
            fg: Color del texto del tooltip
            font: Fuente del texto
            delay: Retraso en milisegundos antes de mostrar el tooltip
        """
        self.widget = widget
        self.text = text
        self.bg = bg
        self.fg = fg
        self.font = font
        self.delay = delay
        
        self.tooltip_window = None
        self.timer_id = None
        
        # Bind events
        self.widget.bind("<Enter>", self.on_enter)
        self.widget.bind("<Leave>", self.on_leave)
        self.widget.bind("<Motion>", self.on_motion)
        
    def on_enter(self, event):
        """Evento al entrar al widget"""
        self.schedule_tooltip()
        
    def on_leave(self, event):
        """Evento al salir del widget"""
        self.cancel_tooltip()
        self.hide_tooltip()
        
    def on_motion(self, event):
        """Evento al mover el mouse sobre el widget"""
        self.cancel_tooltip()
        self.hide_tooltip()
        self.schedule_tooltip()
        
    def schedule_tooltip(self):
        """Programar la aparición del tooltip con retraso"""
        self.timer_id = self.widget.after(self.delay, self.show_tooltip)
        
    def cancel_tooltip(self):
        """Cancelar la aparición programada del tooltip"""
        if self.timer_id:
            self.widget.after_cancel(self.timer_id)
            self.timer_id = None
            
    def show_tooltip(self):
        """Mostrar el tooltip"""
        if self.tooltip_window:
            return
            
        # Obtener posición del cursor
        x = self.widget.winfo_rootx() + 25
        y = self.widget.winfo_rooty() + 25
        
        # Crear ventana del tooltip
        self.tooltip_window = tk.Toplevel(self.widget)
        self.tooltip_window.wm_overrideredirect(True)
        self.tooltip_window.wm_geometry(f"+{x}+{y}")
        
        # Crear label con el texto
        label = tk.Label(
            self.tooltip_window, text=self.text,
            bg=self.bg, fg=self.fg, font=self.font,
            padx=8, pady=3, relief="solid", borderwidth=1
        )
        label.pack()
        
    def hide_tooltip(self):
        """Ocultar el tooltip"""
        if self.tooltip_window:
            self.tooltip_window.destroy()
            self.tooltip_window = None
            
    def update_text(self, new_text):
        """Actualizar el texto del tooltip"""
        self.text = new_text


def agregar_tooltip(widget, text, **kwargs):
    """
    Función helper para agregar tooltip rápidamente a un widget
    
    Args:
        widget: Widget al que agregar el tooltip
        text: Texto del tooltip
        **kwargs: Argumentos adicionales para personalizar el tooltip
    
    Returns:
        Instancia de Tooltip creada
    """
    return Tooltip(widget, text, **kwargs)
