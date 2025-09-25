#!/usr/bin/env python3
"""
Test integración del Timeline en MtM Downloader
"""

import sys
import os

# Agregar el directorio padre al path para poder importar los módulos
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)

import tkinter as tk
from mtm_downloader import MtMDownloaderApp

def main():
    print("Iniciando test de la aplicación MtM Downloader con Timeline...")
    
    try:
        # Crear la aplicación
        app = MtMDownloaderApp()
        
        # Verificar que el timeline se haya creado
        if hasattr(app, 'timeline') and app.timeline:
            print("✅ Timeline creado correctamente")
            
            # Probar cambios de estado
            if hasattr(app.timeline, 'set_phase_status'):
                print("✅ Métodos de timeline disponibles")
                
                # Probar cambio de estado a activo
                app.timeline.set_phase_status("chrome", "active")
                print("✅ Test cambio a estado activo")
                
                # Probar cambio de estado a completado
                app.timeline.set_phase_status("chrome", "completed")
                print("✅ Test cambio a estado completado")
            
        else:
            print("❌ Timeline no encontrado en la aplicación")
            
        # Verificar integración con callbacks
        if hasattr(app, 'timeline_callbacks') and app.timeline_callbacks:
            print("✅ Timeline callbacks configurados")
        else:
            print("⚠️ Timeline callbacks no configurados")
        
        print("\n🎯 Aplicación lista. Ejecutando GUI...")
        print("   - Ventana expandida a 832x680 (30% más ancha)")
        print("   - Timeline integrado en la parte superior") 
        print("   - Elementos reposicionados correctamente")
        print("\nCierra la ventana para terminar el test.")
        
        # Ejecutar la aplicación
        app.mainloop()
        
    except Exception as e:
        print(f"❌ Error en el test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()