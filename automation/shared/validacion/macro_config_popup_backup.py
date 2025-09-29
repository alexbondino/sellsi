"""
Popup de Configuración de Macros para MtM Automation
Autor: GitHub Copilot
Fecha: 25 de Septiembre, 2025

Popup modal que muestra instrucciones detalladas para configurar Excel
para permitir macros antes de proceder con la valorización MtM.
"""

import tkinter as tk
from tkinter import ttk
import os
from PIL import Image, ImageTk
import threading
import time
from typing import Optional


class MacroConfigPopup:
    """
    Popup modal que muestra instrucciones para configurar macros en Excel
    
    Características:
    - Muestra imagen instructions.png a la izquierda
    - Texto instructivo detallado a la derecha (8.4:1 aspect ratio)
    - Botón "Confirmo que esto ya lo hice" deshabilitado por 3 segundos
    - Modal (bloquea la aplicación principal hasta confirmar)
    """
    
    def __init__(self, parent_window: Optional[tk.Tk] = None):
        """
        Args:
            parent_window: Ventana padre para centrar el popup
        """
        self.parent_window = parent_window
        self.popup: Optional[tk.Toplevel] = None
        self.confirmed = False
        self.confirm_button: Optional[tk.Button] = None
        self.instructions_image = None  # Para mantener referencia de la imagen
        
    def show_popup(self) -> bool:
        """
        Muestra el popup modal y espera confirmación del usuario
        
        Returns:
            bool: True si el usuario confirmó, False si canceló
        """
        self._create_popup()
        self._setup_layout()
        self._start_countdown()
        
        # Hacer modal
        if self.popup is not None:
            self.popup.transient(self.parent_window)
            self.popup.grab_set()
        
        # Centrar en pantalla
        self._center_popup()
        
        # Esperar hasta que se cierre
        if self.popup is not None:
            self.popup.wait_window()
        
        return self.confirmed
    
    def _create_popup(self):
        """Crea la ventana popup principal"""
        self.popup = tk.Toplevel()
        self.popup.title("🔧 Configuración de Macros - IMPORTANTE")
        self.popup.geometry("1400x1100")  # Mucho más grande para imagen 950x950 + texto + botones
        self.popup.resizable(False, False)
        
        # Configurar cierre
        self.popup.protocol("WM_DELETE_WINDOW", self._on_cancel)
        
        # Estilo
        self.popup.configure(bg="#f8f9fa")
        
    def _setup_layout(self):
        """Configura el layout principal del popup"""
        # Frame principal con scroll si fuera necesario
        main_frame = tk.Frame(self.popup, bg="#f8f9fa", padx=30, pady=20)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Título principal
        title_label = tk.Label(
            main_frame,
            text="🚨 CONFIGURACIÓN REQUERIDA DE MACROS",
            font=("Arial", 18, "bold"),
            fg="#dc3545",
            bg="#f8f9fa"
        )
        title_label.pack(pady=(0, 15))
        
        # Subtítulo
        subtitle_label = tk.Label(
            main_frame,
            text="Para que la Valorización MtM funcione correctamente, necesitas habilitar las macros en Excel.",
            font=("Arial", 12),
            fg="#6c757d",
            bg="#f8f9fa",
            wraplength=1300
        )
        subtitle_label.pack(pady=(0, 20))
        
        # Frame del contenido - CAMBIAR A VERTICAL en lugar de horizontal
        content_frame = tk.Frame(main_frame, bg="#f8f9fa")
        content_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 20))
        
        # Cargar y mostrar imagen ARRIBA
        self._setup_image(content_frame)
        
        # Setup texto de instrucciones ABAJO de la imagen
        self._setup_instructions(content_frame)
        
        # Frame de botones al final
        button_frame = tk.Frame(main_frame, bg="#f8f9fa")
        button_frame.pack(fill=tk.X, pady=(15, 0))
        
        self._setup_buttons(button_frame)
    
    def _setup_image(self, parent):
        """Configura y muestra la imagen de instrucciones"""
        image_frame = tk.Frame(parent, bg="#f8f9fa")
        image_frame.pack(pady=(0, 20))  # CENTRADO arriba, no a la izquierda
        
        try:
            # Buscar imagen en automation/shared/images/
            base_path = os.path.dirname(os.path.dirname(__file__))  # Subir dos niveles desde validacion
            image_path = os.path.join(base_path, "images", "instrucciones.png")
            
            if os.path.exists(image_path):
                # Cargar imagen en su tamaño original (950x950)
                pil_image = Image.open(image_path)
                
                # Convertir a RGB si es necesario
                if pil_image.mode != 'RGB':
                    pil_image = pil_image.convert('RGB')
                
                # NO redimensionar - usar tamaño original 950x950
                original_width, original_height = pil_image.size
                print(f"🖼️  Cargando imagen: {original_width}x{original_height}")
                
                # Crear PhotoImage y mantener referencia
                self.instructions_image = ImageTk.PhotoImage(pil_image)
                
                image_label = tk.Label(
                    image_frame,
                    image=self.instructions_image,
                    bg="#f8f9fa",
                    relief=tk.RAISED,
                    bd=2
                )
                image_label.pack()
                
                # También mantener referencia en el label
                image_label.image = self.instructions_image  # Prevenir garbage collection
                
            else:
                # Crear un placeholder que sea más grande
                placeholder_label = tk.Label(
                    image_frame,
                    text="📊\n[instrucciones.png]\nNO ENCONTRADA\n\nImagen de\nInstrucciones\nExcel\n\nVerifica la ruta:\nautomation/shared/images/",
                    font=("Arial", 11),
                    fg="#dc3545",
                    bg="#ffe6e6",
                    width=50,
                    height=30,
                    justify=tk.CENTER,
                    relief=tk.RAISED,
                    bd=2
                )
                placeholder_label.pack()
                
        except ImportError as ie:
            # Error de importación PIL
            error_label = tk.Label(
                image_frame,
                text=f"❌\nError PIL/Pillow\nno disponible\n\nInstalar:\npip install Pillow",
                font=("Arial", 9),
                fg="#dc3545",
                bg="#f8f9fa",
                width=25,
                height=20,
                justify=tk.CENTER,
                relief=tk.RAISED,
                bd=1
            )
            error_label.pack()
        except Exception as e:
            # Fallback en caso de error
            error_label = tk.Label(
                image_frame,
                text=f"❌\nError cargando\ninstrucciones\n\n{type(e).__name__}\n{str(e)[:20]}...",
                font=("Arial", 9),
                fg="#dc3545",
                bg="#ffe6e6",
                width=30,
                height=20,
                justify=tk.CENTER,
                relief=tk.RAISED,
                bd=1
            )
            error_label.pack()
            error_label.pack()
    
    def _setup_instructions(self, parent):
        """Configura el panel de instrucciones detalladas"""
        # Frame de texto centrado debajo de la imagen
        text_frame = tk.Frame(parent, bg="#ffffff", relief=tk.RAISED, bd=2)
        text_frame.pack(fill=tk.X, pady=(10, 20))  # Layout horizontal, no vertical
        
        # Text widget más compacto para el nuevo layout
        self.instructions_text = tk.Text(
            text_frame,
            wrap=tk.WORD,
            width=120,  # Más ancho para acomodar el layout horizontal
            height=8,   # Más bajo para dejar espacio a los botones
            font=("Arial", 11),
            bg="#ffffff",
            fg="#212529",
            relief=tk.FLAT,
            bd=0,
            padx=15,
            pady=10
        )
        self.instructions_text.pack(fill=tk.X, padx=10, pady=10)
        
        # Texto de instrucciones más conciso
        instructions_text = """💡 INSTRUCCIONES RÁPIDAS:

Las macros son necesarias para que Excel pueda ejecutar la valorización MtM automáticamente.

🔧 CONFIGURACIÓN (Solo una vez por computadora):
• La imagen de arriba muestra todos los pasos detallados
• Debes seguir cada paso numerado exactamente como aparece
• Es crítico CERRAR Excel completamente después de configurar

⚠️ IMPORTANTE: Si Excel está abierto cuando ejecutes el bot, la valorización FALLARÁ.

        
        self.instructions_text.insert(tk.END, instructions_text)
        self.instructions_text.config(state=tk.DISABLED)  # Solo lectura
    
    def _setup_buttons(self, parent):"""
        
        self.instructions_text.insert(tk.END, instructions_text)
        self.instructions_text.config(state=tk.DISABLED)  # Solo lectura
            font=("Arial", 10),
            bg="#ffffff",
            fg="#212529",
            padx=15,
            pady=15,
            yscrollcommand=scrollbar.set,
            relief=tk.FLAT,
            state=tk.DISABLED
        )
        self.instructions_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.config(command=self.instructions_text.yview)
        
        # Insertar el texto de instrucciones
        self._insert_instructions()
    
    def _insert_instructions(self):
        """Inserta el texto detallado de instrucciones"""
        instructions = """🔧 CÓMO HABILITAR MACROS EN EXCEL - GUÍA PASO A PASO

Para que la Valorización MtM funcione correctamente, Excel debe estar configurado para permitir la ejecución de macros. Este es un cambio de seguridad que debes hacer UNA SOLA VEZ.

⚠️  IMPORTANTE: Realiza estos pasos ANTES de continuar con la valorización.

📋 PASOS DETALLADOS:

1️⃣ ABRIR CUALQUIER ARCHIVO EXCEL
   • Abre Microsoft Excel (puede ser un archivo en blanco o cualquier archivo .xlsx/.xlsm)
   • No importa qué archivo abras, la configuración se aplica a todo Excel

2️⃣ ACCEDER AL MENÚ ARCHIVO
   • En la esquina superior izquierda, haz clic en "Archivo" (File)
   • Se abrirá el menú principal de opciones de Excel

3️⃣ IR A OPCIONES
   • En el menú lateral izquierdo, busca y haz clic en "Opciones" (Options)
   • Está usualmente al final de la lista, cerca de "Salir de Excel"

4️⃣ ABRIR CENTRO DE CONFIANZA
   • En la ventana de Opciones de Excel, busca en el panel izquierdo
   • Haz clic en "Centro de confianza" (Trust Center)
   • Es una de las últimas opciones en la lista

5️⃣ CONFIGURACIÓN DEL CENTRO DE CONFIANZA
   • Dentro de la sección Centro de confianza
   • Haz clic en el botón "Configuración del Centro de confianza..." 
   • Se abrirá una nueva ventana con opciones de seguridad

6️⃣ CONFIGURACIÓN DE MACROS
   • En la nueva ventana, busca en el panel izquierdo
   • Haz clic en "Configuración de macros" (Macro Settings)
   • Aquí verás las opciones de seguridad para macros

7️⃣ HABILITAR TODAS LAS MACROS
   • Selecciona la opción "Habilitar todas las macros" 
   • ⚠️  Esta opción permite que Excel ejecute automáticamente las macros
   • Es necesaria para que nuestro sistema MtM funcione correctamente

8️⃣ GUARDAR CAMBIOS
   • Haz clic en "Aceptar" en la ventana de Centro de confianza
   • Luego haz clic en "Aceptar" en la ventana de Opciones de Excel
   • Los cambios se guardan automáticamente

9️⃣ CERRAR EXCEL (SÚPER IMPORTANTE)
   • ⚠️  DEBES cerrar completamente Excel después de hacer este cambio
   • Cierra todas las ventanas de Excel que tengas abiertas
   • Esto asegura que la nueva configuración se aplique correctamente

✅ VERIFICACIÓN
Una vez completados estos pasos:
• La próxima vez que abras un archivo Excel con macros
• No aparecerá la barra amarilla de advertencia
• Las macros se ejecutarán automáticamente
• El sistema MtM funcionará sin interrupciones

🔒 NOTA DE SEGURIDAD
Esta configuración permite que Excel ejecute macros automáticamente. Solo ejecuta archivos Excel de fuentes confiables. El sistema MtM utiliza macros seguras y necesarias para su funcionamiento.

💡 ¿PROBLEMAS?
Si después de seguir estos pasos sigues viendo advertencias de macros:
• Verifica que hayas cerrado completamente Excel después del cambio
• Reinicia tu computadora si es necesario
• Contacta al administrador del sistema si trabajas en un entorno corporativo

¡Una vez configurado, no necesitarás repetir estos pasos!"""

        # Insertar texto
        self.instructions_text.config(state=tk.NORMAL)
        self.instructions_text.insert("1.0", instructions)
        self.instructions_text.config(state=tk.DISABLED)
    
    def _setup_buttons(self, parent):
        """Configura los botones del popup"""
        # Botón cancelar
        cancel_button = tk.Button(
            parent,
            text="❌ Cancelar",
            command=self._on_cancel,
            bg="#6c757d",
            fg="white",
            font=("Arial", 10),
            padx=20,
            pady=8,
            relief=tk.FLAT,
            cursor="hand2"
        )
        cancel_button.pack(side=tk.LEFT)
        
        # Espacio
        spacer = tk.Label(parent, bg="#f8f9fa")
        spacer.pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        # Botón confirmar (inicialmente deshabilitado)
        self.confirm_button = tk.Button(
            parent,
            text="⏳ Confirmo que esto ya lo hice (3s)",
            command=self._on_confirm,
            bg="#ccc",
            fg="#666",
            font=("Arial", 10, "bold"),
            padx=20,
            pady=8,
            relief=tk.FLAT,
            state=tk.DISABLED,
            cursor="arrow"
        )
        self.confirm_button.pack(side=tk.RIGHT)
    
    def _start_countdown(self):
        """Inicia el countdown de 3 segundos para habilitar el botón"""
        thread = threading.Thread(target=self._countdown_worker, daemon=True)
        thread.start()
    
    def _countdown_worker(self):
        """Worker thread para el countdown"""
        for i in range(3, 0, -1):
            if self.popup is None:  # Si se cerró el popup
                return
                
            # Actualizar botón en el hilo principal
            self.popup.after(0, lambda i=i: self._update_countdown(i))
            time.sleep(1)
        
        # Habilitar botón
        if self.popup is not None:
            self.popup.after(0, self._enable_confirm_button)
    
    def _update_countdown(self, seconds):
        """Actualiza el texto del botón con countdown"""
        if self.confirm_button:
            self.confirm_button.config(
                text=f"⏳ Confirmo que esto ya lo hice ({seconds}s)"
            )
    
    def _enable_confirm_button(self):
        """Habilita el botón de confirmación"""
        if self.confirm_button:
            self.confirm_button.config(
                text="✅ Confirmo que esto ya lo hice",
                bg="#28a745",
                fg="white",
                state=tk.NORMAL,
                cursor="hand2"
            )
    
    def _center_popup(self):
        """Centra el popup en la pantalla"""
        if self.popup is None:
            return
            
        self.popup.update_idletasks()
        width = self.popup.winfo_width()
        height = self.popup.winfo_height()
        
        if self.parent_window:
            # Centrar respecto a la ventana padre
            x = self.parent_window.winfo_x() + (self.parent_window.winfo_width() // 2) - (width // 2)
            y = self.parent_window.winfo_y() + (self.parent_window.winfo_height() // 2) - (height // 2)
        else:
            # Centrar en pantalla
            x = (self.popup.winfo_screenwidth() // 2) - (width // 2)
            y = (self.popup.winfo_screenheight() // 2) - (height // 2)
        
        self.popup.geometry(f"{width}x{height}+{x}+{y}")
    
    def _on_confirm(self):
        """Maneja la confirmación del usuario"""
        self.confirmed = True
        if self.popup is not None:
            self.popup.destroy()
    
    def _on_cancel(self):
        """Maneja la cancelación del usuario"""
        self.confirmed = False
        if self.popup is not None:
            self.popup.destroy()


def show_macro_config_popup(parent_window=None) -> bool:
    """
    Función de conveniencia para mostrar el popup de configuración de macros
    
    Args:
        parent_window: Ventana padre opcional
        
    Returns:
        bool: True si el usuario confirmó, False si canceló
    """
    popup = MacroConfigPopup(parent_window)
    return popup.show_popup()


if __name__ == "__main__":
    # Test del popup
    import tkinter as tk
    
    root = tk.Tk()
    root.withdraw()  # Ocultar ventana principal
    
    result = show_macro_config_popup()
    print(f"Usuario {'confirmó' if result else 'canceló'} la configuración")
    
    root.quit()