"""
Test simple del popup de macros
"""
import tkinter as tk
import sys
import os

# Agregar el directorio raíz del proyecto al path
current_dir = os.path.dirname(__file__)
sys.path.insert(0, current_dir)

# Importar desde la ruta correcta
from automation.shared.validacion.macro_config_popup import MacroConfigPopup, show_macro_config_popup

def test_popup_class():
    """Prueba usando la clase directamente"""
    root = tk.Tk()
    root.withdraw()  # Ocultar ventana principal
    
    popup = MacroConfigPopup(root)
    result = popup.show_popup()
    
    print(f"Resultado (clase): {'Confirmó' if result else 'Canceló'}")
    
    # NO llamar quit() ni destroy() inmediatamente - dejar que el popup termine

def test_popup_function():
    """Prueba usando la función wrapper"""
    root = tk.Tk()
    root.withdraw()  # Ocultar ventana principal
    
    result = show_macro_config_popup(root)
    
    print(f"Resultado (función): {'Confirmó' if result else 'Canceló'}")
    
    # NO llamar quit() ni destroy() inmediatamente - dejar que el popup termine

if __name__ == "__main__":
    print("🔧 Probando popup de configuración de macros...")
    print("1. Prueba con función show_macro_config_popup")
    test_popup_function()
    print("✅ Prueba completada")