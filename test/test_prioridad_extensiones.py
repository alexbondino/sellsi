"""
🎯 Test Prioridad Extensiones - XLSM > XLSX
==========================================

Test específico para verificar que HT. Gestión Finanzas
da prioridad ABSOLUTA a archivos .xlsm sobre .xlsx

Autor: GitHub Copilot
Fecha: 24 de Septiembre, 2025
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from components.excel_validator import ExcelValidator


def test_prioridad_xlsm_xlsx():
    """Test de prioridad XLSM > XLSX para HT. Gestión Finanzas"""

    print("🎯 TEST PRIORIDAD: XLSM > XLSX para HT. Gestión Finanzas")
    print("=" * 60)

    # Crear directorio de prueba
    test_dir = "test_prioridad_extension"
    if not os.path.exists(test_dir):
        os.makedirs(test_dir)

    # Crear AMBOS archivos: XLSM y XLSX de la misma versión
    archivos_test = [
        # AMBAS versiones del mismo archivo
        "HT. Gestión Finanzas_v22.2.xlsx",  # Extensión secundaria
        "HT. Gestión Finanzas_v22.2.xlsm",  # Extensión PRIORITARIA
        "MtM_v4.1_Macro.xlsm",  # Archivo macro normal
    ]

    print("📁 Creando archivos de prueba:")
    for archivo in archivos_test:
        filepath = os.path.join(test_dir, archivo)
        with open(filepath, "w") as f:
            f.write("Test content")

        # Marcar cuál es prioritario
        prioridad = (
            "🏆 PRIORITARIO" if archivo.endswith(".xlsm") and "Finanzas" in archivo else "📄"
        )
        print(f"   {prioridad} {archivo}")

    # Ejecutar validación
    print("\n🔍 Ejecutando validación...")
    validator = ExcelValidator()
    is_valid, found_files, messages = validator.validate_directory(test_dir)

    # Verificar resultado
    print(f"\n📊 RESULTADO: {'✅ VÁLIDO' if is_valid else '❌ INVÁLIDO'}")
    print(f"📁 Archivos detectados: {len(found_files)}")

    # Verificar específicamente qué archivo de Finanzas se seleccionó
    finanzas_file = found_files.get("finanzas")

    print("\n🎯 VERIFICACIÓN DE PRIORIDAD:")
    if finanzas_file:
        extension = os.path.splitext(finanzas_file.filename)[1].lower()
        print(f"   📄 Archivo seleccionado: {finanzas_file.filename}")
        print(f"   📎 Extensión: {extension}")

        if extension == ".xlsm":
            print("   ✅ CORRECTO: Se seleccionó .xlsm (prioridad)")
            print("   🏆 La prioridad XLSM > XLSX funciona perfectamente")
        elif extension == ".xlsx":
            print("   ⚠️ ADVERTENCIA: Se seleccionó .xlsx")
            print("   ❓ Puede indicar que no había .xlsm disponible")
        else:
            print("   ❌ ERROR: Extensión inesperada")
    else:
        print("   ❌ No se encontró archivo de Finanzas")

    # Mostrar todos los archivos detectados
    print("\n📋 DETALLES DE ARCHIVOS DETECTADOS:")
    for file_type, file_info in found_files.items():
        config = validator.PATTERNS[file_type]
        extension = os.path.splitext(file_info.filename)[1]
        print(f"   🎯 {config['display_name']}:")
        print(f"      📄 Archivo: {file_info.filename}")
        print(f"      📎 Extensión: {extension}")
        print(f"      🔢 Versión: {file_info.version}")

    # Mostrar mensajes de validación
    print("\n💬 MENSAJES DE VALIDACIÓN:")
    for message in messages:
        print(f"   {message}")

    # Limpieza
    import shutil

    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)
        print(f"\n🗑️ Limpiado: {test_dir}")

    return finanzas_file and finanzas_file.filename.endswith(".xlsm")


def test_solo_xlsx():
    """Test cuando solo hay .xlsx disponible (sin .xlsm)"""

    print("\n" + "=" * 60)
    print("🧪 TEST FALLBACK: Solo .xlsx disponible")
    print("=" * 60)

    # Crear directorio de prueba
    test_dir = "test_solo_xlsx"
    if not os.path.exists(test_dir):
        os.makedirs(test_dir)

    # Crear solo archivo .xlsx (sin .xlsm)
    archivos_test = [
        "HT. Gestión Finanzas_v22.2.xlsx",  # Solo xlsx
        "MtM_v4.1_Macro.xlsm",  # Archivo macro normal
    ]

    print("📁 Creando solo archivo .xlsx:")
    for archivo in archivos_test:
        filepath = os.path.join(test_dir, archivo)
        with open(filepath, "w") as f:
            f.write("Test content")
        print(f"   📄 {archivo}")

    # Validar
    validator = ExcelValidator()
    is_valid, found_files, messages = validator.validate_directory(test_dir)

    finanzas_file = found_files.get("finanzas")

    print(f"\n📊 RESULTADO: {'✅ VÁLIDO' if is_valid else '❌ INVÁLIDO'}")

    if finanzas_file:
        print(f"📄 Archivo seleccionado: {finanzas_file.filename}")
        extension = os.path.splitext(finanzas_file.filename)[1].lower()
        if extension == ".xlsx":
            print("✅ CORRECTO: Fallback a .xlsx cuando no hay .xlsm")
        else:
            print("❌ ERROR: Extensión inesperada")

    # Limpieza
    import shutil

    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)
        print(f"\n🗑️ Limpiado: {test_dir}")

    return is_valid


def test_multiple_versions_with_priority():
    """Test con múltiples versiones y extensiones mixtas"""

    print("\n" + "=" * 60)
    print("🧪 TEST COMPLEJO: Múltiples versiones + extensiones mixtas")
    print("=" * 60)

    test_dir = "test_mixto"
    if not os.path.exists(test_dir):
        os.makedirs(test_dir)

    # Crear múltiples archivos con versiones y extensiones mixtas
    archivos_test = [
        "HT. Gestión Finanzas_v21.1.xlsx",  # Versión vieja xlsx
        "HT. Gestión Finanzas_v22.2.xlsm",  # Versión nueva xlsm ← DEBERÍA GANAR
        "HT. Gestión Finanzas_v23.0.xlsx",  # Versión más nueva xlsx
        "MtM_v4.1_Macro.xlsm",
    ]

    print("📁 Creando archivos mixtos:")
    for archivo in archivos_test:
        filepath = os.path.join(test_dir, archivo)
        with open(filepath, "w") as f:
            f.write("Test content")

        if "Finanzas" in archivo and archivo.endswith(".xlsm"):
            print(f"   🏆 {archivo} ← DEBERÍA SER SELECCIONADO (.xlsm)")
        else:
            print(f"   📄 {archivo}")

    # Validar
    validator = ExcelValidator()
    is_valid, found_files, messages = validator.validate_directory(test_dir)

    finanzas_file = found_files.get("finanzas")

    print(f"\n📊 RESULTADO: {'✅ VÁLIDO' if is_valid else '❌ INVÁLIDO'}")

    if finanzas_file:
        print(f"🎯 ARCHIVO SELECCIONADO: {finanzas_file.filename}")
        extension = os.path.splitext(finanzas_file.filename)[1].lower()

        if extension == ".xlsm":
            print("✅ EXCELENTE: Se seleccionó .xlsm a pesar de haber .xlsx más nuevos")
            print("🏆 La prioridad XLSM > XLSX está funcionando perfectamente")
        else:
            print(f"⚠️ Se seleccionó .xlsx: {finanzas_file.filename}")

    # Limpieza
    import shutil

    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)
        print(f"\n🗑️ Limpiado: {test_dir}")

    return finanzas_file and finanzas_file.filename.endswith(".xlsm")


if __name__ == "__main__":
    print("🚀 INICIANDO TESTS DE PRIORIDAD DE EXTENSIONES")
    print("=" * 60)

    try:
        # Test principal de prioridad
        resultado1 = test_prioridad_xlsm_xlsx()

        # Test de fallback
        resultado2 = test_solo_xlsx()

        # Test complejo
        resultado3 = test_multiple_versions_with_priority()

        # Resumen final
        print("\n" + "=" * 60)
        print("📊 RESUMEN DE TESTS:")
        print(f"   🎯 Prioridad XLSM > XLSX: {'✅' if resultado1 else '❌'}")
        print(f"   🔄 Fallback a XLSX: {'✅' if resultado2 else '❌'}")
        print(f"   🧪 Caso complejo: {'✅' if resultado3 else '❌'}")

        if resultado1 and resultado2 and resultado3:
            print("\n🎊 ¡TODOS LOS TESTS EXITOSOS!")
            print("🏆 La prioridad XLSM > XLSX funciona perfectamente")
        else:
            print("\n⚠️ Algunos tests fallaron")

        print("=" * 60)

    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback

        traceback.print_exc()
