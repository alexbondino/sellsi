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
    - Muestra imagen de instrucciones de 950x950 píxeles
    - Texto instructivo debajo de la imagen
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
        print("🔧 [DEBUG] Iniciando popup de configuración de macros...")
        
        self._create_popup()
        if self.popup is None:
            print("❌ [ERROR] No se pudo crear el popup")
            return False
            
        self._setup_layout()
        self._start_countdown()
        
        # Centrar en pantalla o respecto al padre
        self._center_popup()
        
        # Hacer modal - solo si popup no es None
        if self.popup is not None:
            if self.parent_window:
                self.popup.transient(self.parent_window)
            self.popup.grab_set()
            self.popup.focus_set()
            
            print("✅ [DEBUG] Popup configurado y mostrado")
        
        # Esperar hasta que se cierre
        if self.popup is not None:
            self.popup.wait_window()
        
        print(f"🔧 [DEBUG] Popup cerrado. Usuario confirmó: {self.confirmed}")
        return self.confirmed
    
    def _create_popup(self):
        """Crea la ventana popup principal"""
        self.popup = tk.Toplevel()
        self.popup.title("🔧 Configuración de Macros - IMPORTANTE")
        self.popup.geometry("1320x824")  # Incrementado 10% en ancho y alto
        self.popup.resizable(True, True)  # PERMITIR redimensionar y mover
        
        # Configurar cierre
        self.popup.protocol("WM_DELETE_WINDOW", self._on_cancel)
        
        # Estilo
        self.popup.configure(bg="#f8f9fa")
        
        # Hacer que aparezca en primer plano pero permitir mover
        self.popup.attributes('-topmost', True)
        
        # Permitir que se mueva libremente
        self.popup.focus_force()  # Forzar foco
        
        print("🔧 [DEBUG] Popup creado con tamaño 1320x824 (layout ampliado +10%)")
        
    def _setup_layout(self):
        """Configura el layout principal del popup"""
        # Frame principal SIN expand=True para controlar mejor el espacio
        main_frame = tk.Frame(self.popup, bg="#f8f9fa", padx=30, pady=20)
        main_frame.pack(fill=tk.X)  # Solo fill X, no BOTH, y NO expand
        
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
        
        # Frame del contenido - ALTURA FIJA para evitar que se expanda
        content_frame = tk.Frame(main_frame, bg="#f8f9fa", height=605)  # Altura incrementada 10%
        content_frame.pack(fill=tk.X, pady=(0, 20))  # Solo fill X
        content_frame.pack_propagate(False)  # CRÍTICO: evitar que se redimensione automáticamente
        
        # Cargar y mostrar imagen a la IZQUIERDA
        self._setup_image(content_frame)
        
        # Setup texto de instrucciones a la DERECHA de la imagen
        self._setup_instructions(content_frame)
        
        # Frame de botones al final - SIEMPRE VISIBLE
        button_frame = tk.Frame(main_frame, bg="#f8f9fa")
        button_frame.pack(fill=tk.X, pady=(15, 0))
        
        self._setup_buttons(button_frame)

    def _setup_image(self, parent):
        """Configura y muestra la imagen de instrucciones"""
        image_frame = tk.Frame(parent, bg="#f8f9fa")
        image_frame.pack(side=tk.LEFT, padx=(0, 15))  # Reducido margen: era 20, ahora 15
        
        try:
            # Buscar imagen en automation/shared/images/
            base_path = os.path.dirname(os.path.dirname(__file__))  # Subir dos niveles desde validacion
            image_path = os.path.join(base_path, "images", "instrucciones.png")
            
            if os.path.exists(image_path):
                # Cargar imagen y redimensionar si es necesario
                pil_image = Image.open(image_path)
                
                # Convertir a RGB si es necesario
                if pil_image.mode != 'RGB':
                    pil_image = pil_image.convert('RGB')
                
                original_width, original_height = pil_image.size
                print(f"🖼️  Imagen original: {original_width}x{original_height}")
                
                # Redimensionar para que quepa bien en el layout horizontal
                max_size = 600  # Aumentado 15%: era 500, ahora 575 (500 * 1.15)
                if original_width > max_size or original_height > max_size:
                    ratio = min(max_size / original_width, max_size / original_height)
                    new_width = int(original_width * ratio)
                    new_height = int(original_height * ratio)
                    pil_image = pil_image.resize((new_width, new_height), Image.Resampling.LANCZOS)
                    print(f"🖼️  Imagen redimensionada a: {new_width}x{new_height}")
                
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
                
            else:
                # Crear un placeholder visual
                placeholder_label = tk.Label(
                    image_frame,
                    text=f"📊\\n[instrucciones.png]\\nNO ENCONTRADA\\n\\nImagen de\\nInstrucciones\\nExcel\\n\\nVerifica: {image_path}",
                    font=("Arial", 11),
                    fg="#dc3545",
                    bg="#ffe6e6",
                    width=80,
                    height=30,
                    justify=tk.CENTER,
                    relief=tk.RAISED,
                    bd=2
                )
                placeholder_label.pack()
                
        except ImportError:
            # Fallback si PIL no está disponible
            error_label = tk.Label(
                image_frame,
                text="⚠️\\nPIL no disponible\\n\\nInstala Pillow:\\npip install Pillow\\n\\nImagen:\\ninstrucciones.png",
                font=("Arial", 11),
                fg="#dc3545",
                bg="#f8f9fa",
                width=60,
                height=25,
                justify=tk.CENTER,
                relief=tk.RAISED,
                bd=1
            )
            error_label.pack()
        except Exception as e:
            # Fallback en caso de error
            error_label = tk.Label(
                image_frame,
                text=f"❌\\nError cargando\\ninstrucciones\\n\\n{type(e).__name__}\\n{str(e)[:30]}...",
                font=("Arial", 11),
                fg="#dc3545",
                bg="#ffe6e6",
                width=60,
                height=25,
                justify=tk.CENTER,
                relief=tk.RAISED,
                bd=1
            )
            error_label.pack()
    
    def _setup_instructions(self, parent):
        """Configura el panel de instrucciones detalladas"""
        # Frame de texto a la DERECHA de la imagen
        text_frame = tk.Frame(parent, bg="#ffffff", relief=tk.RAISED, bd=2)
        text_frame.pack(side=tk.RIGHT, fill=tk.BOTH, padx=(10, 0))  # Vuelve a fill BOTH
        
        # Scrollbar para el texto
        scrollbar = tk.Scrollbar(text_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Text widget con scroll para instrucciones detalladas
        self.instructions_text = tk.Text(
            text_frame,
            wrap=tk.WORD,
            width=50,   # RESTAURADO: vuelve a ser 50 caracteres (era 42)
            height=22,  # Mantengo 22 para dejar espacio a botones
            font=("Arial", 10),
            bg="#ffffff",
            fg="#212529",
            relief=tk.FLAT,
            bd=0,
            padx=15,
            pady=15,
            yscrollcommand=scrollbar.set
        )
        self.instructions_text.pack(side=tk.LEFT, fill=tk.BOTH)
        scrollbar.config(command=self.instructions_text.yview)
        
        # Texto de instrucciones más detallado
        instructions_text = """� CÓMO HABILITAR MACROS EN EXCEL - GUÍA PASO A PASO

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

6️⃣ SELECCIONAR CONFIGURACIÓN DE MACROS
   • En la nueva ventana, busca "Configuración de macros" en el panel izquierdo
   • Haz clic en esta opción para ver las opciones de macros

7️⃣ HABILITAR TODAS LAS MACROS
   • Selecciona la opción "Habilitar todas las macros (no recomendado; puede ejecutarse código potencialmente peligroso)"
   • Esta es la única opción que permite que funcione la valorización MtM

8️⃣ APLICAR CAMBIOS
   • Haz clic en "Aceptar" en la ventana del Centro de confianza
   • Haz clic en "Aceptar" nuevamente en la ventana de Opciones de Excel

9️⃣ CERRAR EXCEL COMPLETAMENTE
   • CRÍTICO: Cierra Excel completamente después de hacer estos cambios
   • Si Excel está abierto cuando ejecutes el bot, la valorización FALLARÁ

💡 NOTAS ADICIONALES:

✅ Esta configuración es permanente - solo necesitas hacerla UNA VEZ por computadora.

✅ Después de configurar, puedes usar la valorización MtM normalmente.

⚠️ NUNCA ejecutes el bot si Excel está abierto - siempre ciérralo primero.

🔒 Esta configuración es específica de tu instalación de Excel y no afecta otros programas.

📧 Si tienes problemas, contacta con Klaus."""
        
        self.instructions_text.insert(tk.END, instructions_text)
        self.instructions_text.config(state=tk.DISABLED)  # Solo lectura

    def _setup_buttons(self, parent):
        """Configura los botones del popup"""
        # Botón cancelar (izquierda)
        cancel_button = tk.Button(
            parent,
            text="❌ Cancelar",
            command=self._on_cancel,
            font=("Arial", 12, "bold"),
            bg="#dc3545",
            fg="white",
            width=20,
            height=2,
            relief=tk.RAISED,
            bd=2
        )
        cancel_button.pack(side=tk.LEFT, padx=(0, 20))
        
        # Botón confirmar (derecha) - Deshabilitado inicialmente con countdown profesional
        self.confirm_button = tk.Button(
            parent,
            text="Confirmo que ya configuré las macros (disponible en 5s)",
            command=self._on_confirm,
            font=("Arial", 12, "bold"),
            bg="#e9ecef",  # Gris muy claro para mayor contraste con el texto
            fg="#495057",  # Texto gris oscuro para mejor legibilidad
            width=50,
            height=2,
            state=tk.DISABLED,
            relief=tk.RAISED,
            bd=2
        )
        self.confirm_button.pack(side=tk.RIGHT)
        
    def _start_countdown(self):
        """Inicia el countdown de 3 segundos en un hilo separado"""
        countdown_thread = threading.Thread(target=self._countdown_worker, daemon=True)
        countdown_thread.start()
        
    def _countdown_worker(self):
        """Trabajador del countdown en hilo separado - 5 segundos"""
        for i in range(5, 0, -1):
            if self.popup is None:  # Si se cerró el popup, salir
                return
                
            # Actualizar texto del botón en el hilo principal
            self.popup.after(0, lambda count=i: self._update_button_text(count))
            time.sleep(1)
        
        # Habilitar botón al final
        if self.popup is not None:
            self.popup.after(0, self._enable_button)
    
    def _update_button_text(self, count):
        """Actualiza el texto del botón con el contador profesional"""
        if self.confirm_button is not None:
            if count >= 2:
                self.confirm_button.config(
                    text=f"Confirmo que ya configuré las macros (disponible en {count}s)",
                    bg="#f8f9fa",  # Gris muy claro para máximo contraste
                    fg="#343a40"   # Texto gris oscuro para excelente legibilidad
                )
            elif count == 1:
                self.confirm_button.config(
                    text="Confirmo que ya configuré las macros (disponible en 1s)",
                    bg="#dee2e6",  # Gris claro - transición suave
                    fg="#495057"   # Texto más oscuro para contraste
                )
    
    def _enable_button(self):
        """Habilita el botón de confirmación con estilo profesional"""
        if self.confirm_button is not None:
            self.confirm_button.config(
                text="✓ Confirmo que ya configuré las macros",
                state=tk.NORMAL,
                bg="#06EFFF",  # Cyan calipso igual que el botón EJECUTAR
                fg="black"
            )
    
    def _center_popup(self):
        """Centra el popup en la pantalla principal (no entre múltiples pantallas)"""
        if self.popup is None:
            return
            
        self.popup.update_idletasks()
        
        if self.parent_window:
            try:
                # Intentar centrar respecto a la ventana padre
                parent_x = self.parent_window.winfo_x()
                parent_y = self.parent_window.winfo_y()
                parent_width = self.parent_window.winfo_width()
                parent_height = self.parent_window.winfo_height()
                
                x = parent_x + (parent_width - 1320) // 2
                y = parent_y + (parent_height - 824) // 2
                
                # Asegurar que esté dentro de límites razonables
                x = max(0, x)
                y = max(0, y)
                
                print(f"🔧 [DEBUG] Centrando en ventana padre: {x},{y}")
                
            except:
                # Si falla, usar pantalla principal
                x = 100  # Esquina superior izquierda de la pantalla principal
                y = 50
                print(f"🔧 [DEBUG] Fallback: posición fija {x},{y}")
        else:
            # Posicionar en la pantalla principal, no centrar entre múltiples
            x = 200  # Un poco hacia la derecha de la esquina
            y = 100  # Un poco hacia abajo
            print(f"🔧 [DEBUG] Sin ventana padre: posición fija {x},{y}")
        
        self.popup.geometry(f"1320x824+{x}+{y}")
        
        # Después de posicionar, quitar topmost para permitir movimiento
        if self.popup is not None:
            self.popup.after(100, lambda: self.popup.attributes('-topmost', False) if self.popup else None)
    
    def _on_confirm(self):
        """Maneja la confirmación del usuario"""
        self.confirmed = True
        if self.popup:
            self.popup.destroy()
            self.popup = None
    
    def _on_cancel(self):
        """Maneja la cancelación del usuario"""
        self.confirmed = False
        if self.popup:
            self.popup.destroy()
            self.popup = None


def show_macro_config_popup(parent_window=None):
    """
    Función wrapper para mostrar el popup de configuración de macros
    
    Args:
        parent_window: Ventana padre (opcional)
        
    Returns:
        bool: True si el usuario confirmó, False si canceló
    """
    popup = MacroConfigPopup(parent_window)
    return popup.show_popup()


def test_popup():
    """Función de prueba para el popup"""
    root = tk.Tk()
    root.withdraw()  # Ocultar ventana principal
    
    popup = MacroConfigPopup(root)
    result = popup.show_popup()
    
    print(f"Usuario confirmó: {result}")
    root.quit()


if __name__ == "__main__":
    test_popup()