"""
Custom Date Picker Component
Autor: GitHub Copilot
Fecha: 1 de Octubre, 2025

Calendario personalizado con mejor UX que tkcalendar.DateEntry
- Sin bugs de navegación entre meses
- Diseño moderno y limpio
- Validación de fecha mínima/máxima
- Integración fácil con aplicaciones tkinter
"""

import tkinter as tk
from tkinter import ttk
from datetime import datetime, timedelta
import calendar
from typing import Optional, Callable


class CustomDatePicker(tk.Frame):
    """
    Selector de fecha personalizado con calendario desplegable
    
    Características:
    - 🎨 Diseño moderno y limpio
    - 🚫 Sin bugs de navegación
    - ✅ Validación de fecha mínima/máxima
    - 📅 Navegación fluida entre meses/años
    - 🎯 Resaltado del día actual y seleccionado
    """
    
    def __init__(self, parent, 
                 initial_date: Optional[datetime] = None,
                 mindate: Optional[datetime] = None,
                 maxdate: Optional[datetime] = None,
                 callback: Optional[Callable] = None,
                 width: int = 25,
                 **kwargs):
        """
        Args:
            parent: Widget padre
            initial_date: Fecha inicial (por defecto hoy)
            mindate: Fecha mínima permitida
            maxdate: Fecha máxima permitida
            callback: Función a llamar cuando cambia la fecha
            width: Ancho del campo de texto
        """
        super().__init__(parent, bg="white", **kwargs)
        
        self.selected_date = initial_date or datetime.now()
        self.mindate = mindate
        self.maxdate = maxdate
        self.callback = callback
        self.calendar_window = None
        
        # Frame para el input
        input_frame = tk.Frame(self, bg="white")
        input_frame.pack(fill="x")
        
        # Entry para mostrar fecha seleccionada
        self.date_entry = tk.Entry(
            input_frame,
            width=width,
            font=("Arial", 11),
            justify="center",
            state="readonly",
            readonlybackground="white",
            fg="#333"
        )
        self.date_entry.pack(side="left", padx=(0, 5))
        
        # Botón para abrir calendario
        self.calendar_button = tk.Button(
            input_frame,
            text="📅",
            font=("Arial", 12),
            command=self._toggle_calendar,
            cursor="hand2",
            relief="raised",
            bg="#007ACC",
            fg="white",
            width=3,
            height=1
        )
        self.calendar_button.pack(side="left")
        
        # Actualizar display
        self._update_display()
        
        # Bind para cerrar calendario al hacer clic fuera
        self.bind_all("<Button-1>", self._check_click_outside, add="+")
    
    def _update_display(self):
        """Actualiza el texto del entry con la fecha seleccionada"""
        date_str = self.selected_date.strftime("%d-%m-%Y")
        self.date_entry.config(state="normal")
        self.date_entry.delete(0, tk.END)
        self.date_entry.insert(0, date_str)
        self.date_entry.config(state="readonly")
    
    def _toggle_calendar(self):
        """Abre o cierra el calendario desplegable"""
        if self.calendar_window and self.calendar_window.winfo_exists():
            self.calendar_window.destroy()
            self.calendar_window = None
        else:
            self._show_calendar()
    
    def _show_calendar(self):
        """Muestra el calendario desplegable"""
        # Crear ventana toplevel
        self.calendar_window = tk.Toplevel(self)
        self.calendar_window.title("Seleccionar Fecha")
        self.calendar_window.resizable(False, False)
        self.calendar_window.configure(bg="white")
        
        # Remover decoraciones de ventana y hacer que esté siempre encima
        self.calendar_window.overrideredirect(True)
        self.calendar_window.attributes('-topmost', True)
        
        # Posicionar cerca del botón
        x = self.winfo_rootx()
        y = self.winfo_rooty() + self.winfo_height()
        self.calendar_window.geometry(f"+{x}+{y}")
        
        # Variables de estado
        self.current_month = self.selected_date.month
        self.current_year = self.selected_date.year
        
        # Frame principal del calendario
        cal_frame = tk.Frame(self.calendar_window, bg="white", relief="solid", borderwidth=2)
        cal_frame.pack(padx=5, pady=5)
        
        # Header con navegación
        self._create_calendar_header(cal_frame)
        
        # Grid de días
        self.days_frame = tk.Frame(cal_frame, bg="white")
        self.days_frame.pack(padx=10, pady=10)
        
        # Renderizar calendario
        self._render_calendar()
        
        # Botones de acción
        action_frame = tk.Frame(cal_frame, bg="white")
        action_frame.pack(pady=(0, 10))
        
        tk.Button(
            action_frame,
            text="Hoy",
            command=self._select_today,
            bg="#28A745",
            fg="white",
            font=("Arial", 9, "bold"),
            cursor="hand2",
            width=8
        ).pack(side="left", padx=5)
        
        tk.Button(
            action_frame,
            text="Cancelar",
            command=self._close_calendar,
            bg="#6c757d",
            fg="white",
            font=("Arial", 9),
            cursor="hand2",
            width=8
        ).pack(side="left", padx=5)
    
    def _create_calendar_header(self, parent):
        """Crea el header con navegación de mes/año"""
        header = tk.Frame(parent, bg="#007ACC", height=40)
        header.pack(fill="x", padx=10, pady=10)
        
        # Botón año anterior
        tk.Button(
            header,
            text="<<",
            command=self._prev_year,
            bg="#005A9E",
            fg="white",
            font=("Arial", 10, "bold"),
            cursor="hand2",
            width=3,
            relief="flat"
        ).pack(side="left", padx=2)
        
        # Botón mes anterior
        tk.Button(
            header,
            text="<",
            command=self._prev_month,
            bg="#005A9E",
            fg="white",
            font=("Arial", 10, "bold"),
            cursor="hand2",
            width=3,
            relief="flat"
        ).pack(side="left", padx=2)
        
        # Label del mes/año actual
        self.month_year_label = tk.Label(
            header,
            text="",
            font=("Arial", 12, "bold"),
            bg="#007ACC",
            fg="white",
            width=15
        )
        self.month_year_label.pack(side="left", expand=True, fill="x", padx=10)
        
        # Botón mes siguiente
        tk.Button(
            header,
            text=">",
            command=self._next_month,
            bg="#005A9E",
            fg="white",
            font=("Arial", 10, "bold"),
            cursor="hand2",
            width=3,
            relief="flat"
        ).pack(side="left", padx=2)
        
        # Botón año siguiente
        tk.Button(
            header,
            text=">>",
            command=self._next_year,
            bg="#005A9E",
            fg="white",
            font=("Arial", 10, "bold"),
            cursor="hand2",
            width=3,
            relief="flat"
        ).pack(side="left", padx=2)
        
        self._update_month_year_label()
    
    def _update_month_year_label(self):
        """Actualiza el label del mes/año"""
        month_name = calendar.month_name[self.current_month]
        self.month_year_label.config(text=f"{month_name} {self.current_year}")
    
    def _render_calendar(self):
        """Renderiza el grid de días del calendario"""
        # Limpiar días anteriores
        for widget in self.days_frame.winfo_children():
            widget.destroy()
        
        # Headers de días de la semana
        day_names = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"]
        for i, day_name in enumerate(day_names):
            tk.Label(
                self.days_frame,
                text=day_name,
                font=("Arial", 9, "bold"),
                bg="#F0F0F0",
                fg="#333",
                width=4,
                height=1
            ).grid(row=0, column=i, padx=1, pady=1)
        
        # Obtener calendario del mes
        cal = calendar.monthcalendar(self.current_year, self.current_month)
        today = datetime.now()
        
        # Renderizar días
        for week_num, week in enumerate(cal, start=1):
            for day_num, day in enumerate(week):
                if day == 0:
                    # Día vacío
                    tk.Label(
                        self.days_frame,
                        text="",
                        bg="white",
                        width=4,
                        height=2
                    ).grid(row=week_num, column=day_num, padx=1, pady=1)
                else:
                    # Crear fecha para este día
                    date = datetime(self.current_year, self.current_month, day)
                    
                    # Determinar si está habilitado
                    is_enabled = self._is_date_enabled(date)
                    
                    # Determinar colores
                    is_today = (date.date() == today.date())
                    is_selected = (date.date() == self.selected_date.date())
                    
                    if is_selected:
                        bg_color = "#007ACC"
                        fg_color = "white"
                        font_weight = "bold"
                    elif is_today:
                        bg_color = "#FFC107"
                        fg_color = "black"
                        font_weight = "bold"
                    elif not is_enabled:
                        bg_color = "#E0E0E0"
                        fg_color = "#999"
                        font_weight = "normal"
                    else:
                        bg_color = "white"
                        fg_color = "#333"
                        font_weight = "normal"
                    
                    # Crear botón de día
                    day_button = tk.Button(
                        self.days_frame,
                        text=str(day),
                        font=("Arial", 10, font_weight),
                        bg=bg_color,
                        fg=fg_color,
                        width=4,
                        height=2,
                        relief="raised" if is_enabled else "flat",
                        cursor="hand2" if is_enabled else "arrow",
                        command=lambda d=date: self._select_date(d) if self._is_date_enabled(d) else None
                    )
                    day_button.grid(row=week_num, column=day_num, padx=1, pady=1)
                    
                    # Efecto hover solo si está habilitado
                    if is_enabled and not is_selected:
                        day_button.bind("<Enter>", lambda e, btn=day_button: btn.config(bg="#E3F2FD"))
                        day_button.bind("<Leave>", lambda e, btn=day_button, bg=bg_color: btn.config(bg=bg))
    
    def _is_date_enabled(self, date: datetime) -> bool:
        """Verifica si una fecha está habilitada según mindate/maxdate"""
        if self.mindate and date.date() < self.mindate.date():
            return False
        if self.maxdate and date.date() > self.maxdate.date():
            return False
        return True
    
    def _prev_month(self):
        """Navega al mes anterior"""
        self.current_month -= 1
        if self.current_month < 1:
            self.current_month = 12
            self.current_year -= 1
        self._update_month_year_label()
        self._render_calendar()
    
    def _next_month(self):
        """Navega al mes siguiente"""
        self.current_month += 1
        if self.current_month > 12:
            self.current_month = 1
            self.current_year += 1
        self._update_month_year_label()
        self._render_calendar()
    
    def _prev_year(self):
        """Navega al año anterior"""
        self.current_year -= 1
        self._update_month_year_label()
        self._render_calendar()
    
    def _next_year(self):
        """Navega al año siguiente"""
        self.current_year += 1
        self._update_month_year_label()
        self._render_calendar()
    
    def _select_date(self, date: datetime):
        """Selecciona una fecha y cierra el calendario"""
        if not self._is_date_enabled(date):
            return
        
        self.selected_date = date
        self._update_display()
        self._close_calendar()
        
        # Llamar callback si existe
        if self.callback:
            self.callback()
    
    def _select_today(self):
        """Selecciona la fecha de hoy"""
        today = datetime.now()
        if self._is_date_enabled(today):
            self._select_date(today)
    
    def _close_calendar(self):
        """Cierra el calendario"""
        if self.calendar_window:
            self.calendar_window.destroy()
            self.calendar_window = None
    
    def _check_click_outside(self, event):
        """Cierra el calendario si se hace clic fuera de él"""
        if self.calendar_window and self.calendar_window.winfo_exists():
            # Verificar si el clic fue fuera del calendario
            x, y = event.x_root, event.y_root
            cal_x1 = self.calendar_window.winfo_rootx()
            cal_y1 = self.calendar_window.winfo_rooty()
            cal_x2 = cal_x1 + self.calendar_window.winfo_width()
            cal_y2 = cal_y1 + self.calendar_window.winfo_height()
            
            # También verificar si el clic fue en el botón de calendario
            btn_x1 = self.calendar_button.winfo_rootx()
            btn_y1 = self.calendar_button.winfo_rooty()
            btn_x2 = btn_x1 + self.calendar_button.winfo_width()
            btn_y2 = btn_y1 + self.calendar_button.winfo_height()
            
            if not (cal_x1 <= x <= cal_x2 and cal_y1 <= y <= cal_y2) and \
               not (btn_x1 <= x <= btn_x2 and btn_y1 <= y <= btn_y2):
                self._close_calendar()
    
    # Métodos públicos para compatibilidad con DateEntry
    
    def get_date(self) -> datetime:
        """Obtiene la fecha seleccionada como objeto datetime"""
        return self.selected_date
    
    def set_date(self, date: datetime):
        """Establece la fecha seleccionada"""
        if self._is_date_enabled(date):
            self.selected_date = date
            self._update_display()
            if self.callback:
                self.callback()
    
    def get(self) -> str:
        """Obtiene la fecha seleccionada como string (dd-mm-yyyy)"""
        return self.selected_date.strftime("%d-%m-%Y")


if __name__ == "__main__":
    # Test del componente
    def on_date_change():
        print(f"Fecha seleccionada: {picker.get()}")
    
    root = tk.Tk()
    root.title("Test CustomDatePicker")
    root.geometry("400x200")
    root.configure(bg="white")
    
    tk.Label(root, text="Selecciona una fecha:", font=("Arial", 12), bg="white").pack(pady=20)
    
    picker = CustomDatePicker(
        root,
        mindate=datetime.now(),
        callback=on_date_change
    )
    picker.pack(pady=10)
    
    tk.Label(root, text="(Fecha mínima: hoy)", font=("Arial", 9), bg="white", fg="gray").pack()
    
    root.mainloop()
