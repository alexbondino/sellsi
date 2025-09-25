"""
🎯 Test Final - Solo Tu Archivo Problemático
===========================================

Test específico con ÚNICAMENTE el archivo que reportaste como problemático
para demostrar que ahora se detecta perfectamente.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from components.excel_validator import ExcelValidator


def test_solo_archivo_problematico():
    """Test con solo el archivo problemático específico"""

    print("🎯 TEST FINAL: SOLO TU ARCHIVO PROBLEMÁTICO")
    print("=" * 50)

    # Crear directorio de test
    test_dir = "test_solo_problematico"
    if not os.path.exists(test_dir):
        os.makedirs(test_dir)

    # SOLO crear los archivos específicos problemáticos
    archivos = [
        "HT. Gestión Finanzas_v22.2 - copia.xlsx",  # ← TU ARCHIVO
        "MtM_v4.1_Macro.xlsm",  # Archivo macro estándar
    ]

    print("📄 Creando SOLO archivos específicos:")
    for archivo in archivos:
        filepath = os.path.join(test_dir, archivo)
        with open(filepath, "w") as f:
            f.write("Test content")
        print(f"   {'🆕' if 'copia' in archivo else '📄'} {archivo}")

    # Ejecutar validación
    print("\n🔍 Validando directorio con SOLO estos archivos...")
    validator = ExcelValidator()
    is_valid, found_files, messages = validator.validate_directory(test_dir)

    # Mostrar resultados
    print(f"\n📊 RESULTADO: {'🟢 VÁLIDO' if is_valid else '🔴 INVÁLIDO'}")
    print(f"📁 Archivos detectados: {len(found_files)}")

    # Verificar específicamente tu archivo
    archivo_problematico = "HT. Gestión Finanzas_v22.2 - copia.xlsx"
    archivo_detectado = None

    for file_type, file_info in found_files.items():
        if file_info.filename == archivo_problematico:
            archivo_detectado = file_info
            break

    print("\n🎯 VERIFICACIÓN ESPECÍFICA:")
    print(f"   Archivo buscado: {archivo_problematico}")

    if archivo_detectado:
        print("   ✅ ESTADO: DETECTADO EXITOSAMENTE")
        print(f"   📂 Ruta completa: {archivo_detectado.full_path}")
        print(f"   🔢 Versión extraída: {archivo_detectado.version}")
        print(f"   📄 Tipo: {archivo_detectado.file_type}")
    else:
        print("   ❌ ESTADO: NO DETECTADO")

    # Mostrar todos los mensajes
    print("\n💬 MENSAJES DE VALIDACIÓN:")
    for message in messages:
        print(f"   {message}")

    # Limpieza
    import shutil

    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)
        print(f"\n🗑️ Limpiado: {test_dir}")

    return archivo_detectado is not None


def test_comparacion_antes_despues():
    """Muestra la diferencia entre patrones antiguos y nuevos"""

    print("\n" + "=" * 50)
    print("🔍 COMPARACIÓN: ANTES vs DESPUÉS")
    print("=" * 50)

    archivo_test = "HT. Gestión Finanzas_v22.2 - copia.xlsx"

    # Patrón ANTIGUO (estricto)
    import re

    patron_antiguo = r"^HT\.\s*Gestión\s+Finanzas_v[\d.]+\.xlsx$"
    match_antiguo = bool(re.match(patron_antiguo, archivo_test, re.IGNORECASE))

    # Patrón NUEVO (flexible)
    validator = ExcelValidator()
    patron_nuevo = validator.PATTERNS["finanzas"]["pattern"]
    match_nuevo = bool(re.match(patron_nuevo, archivo_test, re.IGNORECASE))

    print(f"📄 Archivo de prueba: {archivo_test}")
    print("\n🔴 PATRÓN ANTIGUO:")
    print(f"   Regex: {patron_antiguo}")
    print(f"   Resultado: {'✅ DETECTA' if match_antiguo else '❌ NO DETECTA'}")

    print("\n🟢 PATRÓN NUEVO:")
    print(f"   Regex: {patron_nuevo}")
    print(f"   Resultado: {'✅ DETECTA' if match_nuevo else '❌ NO DETECTA'}")

    # Test de palabras clave también
    keywords_match = validator._contains_finance_keywords(archivo_test)
    print("\n🧠 PALABRAS CLAVE:")
    print("   Método: Buscar HT + Gestión + Finanzas + versión")
    print(f"   Resultado: {'✅ DETECTA' if keywords_match else '❌ NO DETECTA'}")

    print("\n🎯 CONCLUSIÓN:")
    if match_nuevo or keywords_match:
        print("   ✅ ¡PROBLEMA RESUELTO! Tu archivo ahora se detecta.")
    else:
        print("   ❌ Aún hay problemas. Necesitamos más ajustes.")


if __name__ == "__main__":
    print("🚀 TEST FINAL - ARCHIVO PROBLEMÁTICO ESPECÍFICO")
    print("=" * 50)

    try:
        # Test principal
        detectado = test_solo_archivo_problematico()

        # Comparación
        test_comparacion_antes_despues()

        # Resultado final
        print("\n" + "=" * 50)
        if detectado:
            print("🎊 ¡ÉXITO COMPLETO!")
            print("✅ Tu archivo 'HT. Gestión Finanzas_v22.2 - copia.xlsx'")
            print("   ahora se detecta PERFECTAMENTE")
            print("✅ El sistema de validación está funcionando")
        else:
            print("❌ El archivo específico no se detectó")
            print("   Necesitamos más investigación")

        print("=" * 50)

    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback

        traceback.print_exc()
