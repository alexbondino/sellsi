"""
🔧 Test Arreglo Consola - Problema de Corchetes [[[[[[[[
=======================================================

Test para demostrar que se solucionó el problema de los caracteres
corruptos que aparecían como [[[[[[[[[[[[[[[[[[[[[[[[

Fecha: 24 de Septiembre, 2025
"""

import os
import sys
import tkinter as tk

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from components.consola_widget import ConsolaWidget


def test_consola_sin_corrupcion():
    """Test para verificar que la consola filtra mensajes corruptos"""

    print("🔧 TEST: CONSOLA SIN MENSAJES CORRUPTOS")
    print("=" * 50)

    # Crear ventana de test
    root = tk.Tk()
    root.title("Test Consola Limpia")
    root.geometry("600x400")

    # Crear widget de consola
    consola = ConsolaWidget(root, width=70, height=15)
    consola.pack(padx=10, pady=10)

    # Agregar mensajes normales (estos SÍ deben aparecer)
    mensajes_normales = [
        ("Iniciando aplicación", "INFO"),
        ("Validación de archivos completada", "EXITO"),
        ("Advertencia: archivo no encontrado", "ADVERTENCIA"),
        ("Error al procesar archivo", "ERROR"),
        ("Debug: variable x = 123", "DEBUG"),
    ]

    print("✅ Agregando mensajes NORMALES (deben aparecer):")
    for mensaje, nivel in mensajes_normales:
        consola.agregar_log(mensaje, nivel)
        print(f"   [{nivel}] {mensaje}")

    # Intentar agregar mensajes CORRUPTOS (estos NO deben aparecer)
    mensajes_corruptos = [
        ("[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[", "INFO"),
        ("]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]", "ERROR"),
        ("{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{", "ADVERTENCIA"),
        ("}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}", "EXITO"),
        ("((((((((((((((((((((((((((((((", "DEBUG"),
        ("))))))))))))))))))))))))))))))))", "INFO"),
        ("", "INFO"),  # Mensaje vacío
        ("   ", "ERROR"),  # Solo espacios
    ]

    print("\n❌ Intentando agregar mensajes CORRUPTOS (NO deben aparecer):")
    for mensaje, nivel in mensajes_corruptos:
        print(f"   Intentando: [{nivel}] '{mensaje}'")
        consola.agregar_log(mensaje, nivel)  # Estos deberían ser filtrados

    # Verificar contenido final
    contenido_final = consola.obtener_contenido()
    lineas_finales = contenido_final.strip().split("\n")

    print("\n📊 RESULTADO DEL FILTRADO:")
    print(f"   Mensajes normales enviados: {len(mensajes_normales)}")
    print(f"   Mensajes corruptos enviados: {len(mensajes_corruptos)}")
    print(f"   Líneas finales en consola: {len([line for line in lineas_finales if line.strip()])}")

    # Verificar que no hay líneas corruptas
    lineas_corruptas = []
    for linea in lineas_finales:
        if linea.strip():
            # Verificar si la línea tiene caracteres repetidos sospechosos
            linea_limpia = linea.strip()
            if len(set(linea_limpia)) == 1 and len(linea_limpia) > 5:
                lineas_corruptas.append(linea)
            elif any(char * 10 in linea_limpia for char in "[]{}()"):
                lineas_corruptas.append(linea)

    print("\n🔍 VERIFICACIÓN DE CORRUPCIÓN:")
    if lineas_corruptas:
        print(f"   ❌ Se encontraron {len(lineas_corruptas)} líneas corruptas:")
        for linea in lineas_corruptas:
            print(f"      '{linea[:50]}...'")
        exito = False
    else:
        print("   ✅ No se encontraron líneas corruptas")
        print("   ✅ Todos los filtros funcionan correctamente")
        exito = True

    # Mostrar contenido final limpio
    print("\n📝 CONTENIDO FINAL DE LA CONSOLA:")
    print("-" * 40)
    for linea in lineas_finales:
        if linea.strip():
            print(f"   {linea}")
    print("-" * 40)

    # Botón para cerrar
    btn_cerrar = tk.Button(root, text="Cerrar Test", command=root.quit)
    btn_cerrar.pack(pady=10)

    # Mostrar ventana por unos segundos para inspección visual
    root.after(5000, root.quit)  # Auto-cerrar después de 5 segundos
    root.mainloop()
    root.destroy()

    return exito


def test_limpieza_manual():
    """Test de la función de limpieza manual de mensajes corruptos"""

    print("\n🧹 TEST: LIMPIEZA MANUAL DE MENSAJES CORRUPTOS")
    print("=" * 50)

    # Crear ventana de test
    root = tk.Tk()
    root.title("Test Limpieza Manual")
    root.geometry("600x400")

    consola = ConsolaWidget(root, width=70, height=15)
    consola.pack(padx=10, pady=10)

    # Simular que ya había mensajes corruptos (insertándolos directamente)
    print("📝 Simulando consola con mensajes corruptos existentes...")

    # Insertar contenido corrupto directamente (simulando el problema original)
    contenido_corrupto = """[12:34:56] [INFO] Mensaje normal
[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[
[12:34:57] [EXITO] Otro mensaje normal
]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]
[12:34:58] [ERROR] Mensaje de error normal
{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{"""

    consola.log_text.insert(tk.END, contenido_corrupto)

    print("❌ Estado ANTES de limpieza:")
    contenido_antes = consola.obtener_contenido()
    lineas_antes = contenido_antes.strip().split("\n")
    corruptas_antes = sum(
        1 for linea in lineas_antes if len(set(linea.strip())) == 1 and len(linea.strip()) > 5
    )
    print(f"   Total de líneas: {len(lineas_antes)}")
    print(f"   Líneas corruptas: {corruptas_antes}")

    # Aplicar limpieza
    print("\n🧹 Aplicando limpieza de mensajes corruptos...")
    consola.limpiar_mensajes_corruptos()

    print("✅ Estado DESPUÉS de limpieza:")
    contenido_despues = consola.obtener_contenido()
    lineas_despues = contenido_despues.strip().split("\n")
    corruptas_despues = sum(
        1 for linea in lineas_despues if len(set(linea.strip())) == 1 and len(linea.strip()) > 5
    )
    print(f"   Total de líneas: {len(lineas_despues)}")
    print(f"   Líneas corruptas: {corruptas_despues}")

    exito = corruptas_despues == 0 and corruptas_antes > 0

    print("\n🎯 RESULTADO DE LIMPIEZA:")
    if exito:
        print(f"   ✅ Limpieza exitosa: {corruptas_antes} → {corruptas_despues} líneas corruptas")
    else:
        print(f"   ❌ Limpieza falló: aún hay {corruptas_despues} líneas corruptas")

    # Auto-cerrar
    root.after(3000, root.quit)
    root.mainloop()
    root.destroy()

    return exito


def mostrar_solucion_implementada():
    """Muestra la solución implementada para el problema"""

    print("\n🎯 SOLUCIÓN IMPLEMENTADA PARA [[[[[[[[[[[[")
    print("=" * 50)

    print("🔍 PROBLEMA IDENTIFICADO:")
    print("   • Aparecían líneas corruptas con caracteres repetidos: [[[[[[[[[[[[")
    print("   • Posible causa: errores de encoding o procesamiento de texto")
    print("   • Afectaba legibilidad de la consola")

    print("\n🛠️ MEJORAS IMPLEMENTADAS:")

    print("\n1. 🚫 FILTRO EN ORIGEN (método agregar_log):")
    print("   • Validación de mensajes antes de insertarlos")
    print("   • Filtrado de caracteres repetidos sospechosos")
    print("   • Prevención de mensajes vacíos o solo espacios")
    print("   • Try-catch para errores de inserción")

    print("\n2. 🧹 LIMPIEZA AUTOMÁTICA (método obtener_contenido_filtrado):")
    print("   • Filtro de líneas con caracteres repetidos")
    print("   • Eliminación de líneas que solo contengan brackets")
    print("   • Validación de formato de log esperado")

    print("\n3. 🔧 HERRAMIENTA MANUAL (método limpiar_mensajes_corruptos):")
    print("   • Botón 'Limpiar' en la aplicación")
    print("   • Limpieza bajo demanda de mensajes corruptos")
    print("   • Preserva mensajes válidos")

    print("\n4. 🛡️ VALIDACIONES ROBUSTAS:")
    print("   • Verificación de tipo de mensaje")
    print("   • Análisis de patrones sospechosos")
    print("   • Manejo de excepciones mejorado")

    print("\n✅ RESULTADO:")
    print("   • No más líneas [[[[[[[[[[[[[[[[")
    print("   • Consola limpia y legible")
    print("   • Herramientas de limpieza disponibles")
    print("   • Prevención proactiva de corrupción")


if __name__ == "__main__":
    print("🚀 INICIANDO TESTS DE ARREGLO DE CONSOLA")
    print("=" * 50)

    try:
        # Test de filtrado preventivo
        resultado1 = test_consola_sin_corrupcion()

        # Test de limpieza manual
        resultado2 = test_limpieza_manual()

        # Mostrar solución
        mostrar_solucion_implementada()

        # Resumen
        print("\n" + "=" * 50)
        print("📋 RESUMEN DE TESTS:")
        print(f"   🚫 Filtrado preventivo: {'✅' if resultado1 else '❌'}")
        print(f"   🧹 Limpieza manual: {'✅' if resultado2 else '❌'}")

        if resultado1 and resultado2:
            print("\n🎊 ¡PROBLEMA DE CORCHETES SOLUCIONADO!")
            print("✅ No más líneas [[[[[[[[[[[[[[[[[[[[")
            print("✅ Consola limpia y funcional")
            print("✅ Herramientas de limpieza disponibles")
        else:
            print("\n⚠️ Algunos tests fallaron")
            print("   Revisa los filtros implementados")

        print("=" * 50)

    except Exception as e:
        print(f"❌ ERROR DURANTE TESTS: {e}")
        import traceback

        traceback.print_exc()
