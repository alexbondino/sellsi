"""
🧪 Script de Prueba - Sistema de Validación de Archivos Excel
==========================================================

Este script demuestra cómo funciona el sistema de validación
con diferentes escenarios de archivos.

Autor: GitHub Copilot
Fecha: 24 de Septiembre, 2025
"""

import os
import sys

# Agregar el directorio padre al path para importar módulos
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from components.excel_validator import ExcelValidator


def crear_archivos_demo():
    """Crea archivos de demostración para testing"""
    demo_dir = "demo_excel_files"

    if not os.path.exists(demo_dir):
        os.makedirs(demo_dir)
        print(f"📁 Directorio creado: {demo_dir}")

    # Crear archivos de ejemplo válidos
    archivos_demo = [
        "HT. Gestión Finanzas_v22.2.xlsx",
        "MtM_v4.1_Macro.xlsm",
        "otro_archivo.xlsx",  # Este no debería ser detectado
        "documento.pdf",  # Este tampoco
    ]

    for archivo in archivos_demo:
        filepath = os.path.join(demo_dir, archivo)
        if not os.path.exists(filepath):
            # Crear archivo vacío para demostración
            with open(filepath, "w") as f:
                f.write("Demo file for testing")
            print(f"📄 Archivo demo creado: {archivo}")

    return demo_dir


def test_validacion_completa():
    """Test con todos los archivos presentes"""
    print("\n" + "=" * 60)
    print("🧪 TEST 1: Validación con archivos completos")
    print("=" * 60)

    demo_dir = crear_archivos_demo()
    validator = ExcelValidator()

    is_valid, found_files, messages = validator.validate_directory(demo_dir)

    print(f"\n📊 Resultado: {'✅ VÁLIDO' if is_valid else '❌ INVÁLIDO'}")
    print(f"📁 Archivos encontrados: {len(found_files)}")

    for file_type, file_info in found_files.items():
        print(f"   • {file_info.filename} (v{file_info.version})")

    print("\n💬 Mensajes de validación:")
    for message in messages:
        print(f"   {message}")


def test_validacion_incompleta():
    """Test con archivos faltantes"""
    print("\n" + "=" * 60)
    print("🧪 TEST 2: Validación con archivos incompletos")
    print("=" * 60)

    # Crear directorio con solo un archivo
    incomplete_dir = "demo_incomplete"
    if not os.path.exists(incomplete_dir):
        os.makedirs(incomplete_dir)

    # Solo crear el archivo de finanzas
    with open(os.path.join(incomplete_dir, "HT. Gestión Finanzas_v23.1.xlsx"), "w") as f:
        f.write("Demo incomplete")

    validator = ExcelValidator()
    is_valid, found_files, messages = validator.validate_directory(incomplete_dir)

    print(f"\n📊 Resultado: {'✅ VÁLIDO' if is_valid else '❌ INVÁLIDO'}")
    print(f"📁 Archivos encontrados: {len(found_files)}")

    print("\n💬 Mensajes de validación:")
    for message in messages:
        print(f"   {message}")


def test_directorio_vacio():
    """Test con directorio sin archivos Excel"""
    print("\n" + "=" * 60)
    print("🧪 TEST 3: Validación con directorio vacío")
    print("=" * 60)

    empty_dir = "demo_empty"
    if not os.path.exists(empty_dir):
        os.makedirs(empty_dir)

    # Crear solo archivos no-Excel
    with open(os.path.join(empty_dir, "documento.txt"), "w") as f:
        f.write("No es Excel")

    validator = ExcelValidator()
    is_valid, found_files, messages = validator.validate_directory(empty_dir)

    print(f"\n📊 Resultado: {'✅ VÁLIDO' if is_valid else '❌ INVÁLIDO'}")
    print(f"📁 Archivos encontrados: {len(found_files)}")

    print("\n💬 Mensajes de validación:")
    for message in messages:
        print(f"   {message}")


def test_diferentes_versiones():
    """Test con diferentes versiones de archivos"""
    print("\n" + "=" * 60)
    print("🧪 TEST 4: Validación con diferentes versiones")
    print("=" * 60)

    versions_dir = "demo_versions"
    if not os.path.exists(versions_dir):
        os.makedirs(versions_dir)

    # Crear archivos con versiones diferentes
    archivos_versiones = [
        "HT. Gestión Finanzas_v25.3.xlsx",
        "MtM_v5.0_Macro.xlsm",
        "HT. Gestión Finanzas_v24.1.xlsx",  # Versión duplicada (debería detectar la primera)
    ]

    for archivo in archivos_versiones:
        filepath = os.path.join(versions_dir, archivo)
        with open(filepath, "w") as f:
            f.write(f"Demo version file: {archivo}")

    validator = ExcelValidator()
    is_valid, found_files, messages = validator.validate_directory(versions_dir)

    print(f"\n📊 Resultado: {'✅ VÁLIDO' if is_valid else '❌ INVÁLIDO'}")
    print(f"📁 Archivos encontrados: {len(found_files)}")

    for file_type, file_info in found_files.items():
        config = validator.PATTERNS[file_type]
        print(f"   • {config['display_name']}: {file_info.filename} (v{file_info.version})")

    print("\n💬 Mensajes de validación:")
    for message in messages:
        print(f"   {message}")


def test_quick_validation():
    """Test de la función de validación rápida"""
    print("\n" + "=" * 60)
    print("🧪 TEST 5: Validación rápida (quick_validate)")
    print("=" * 60)

    # Test con directorio completo
    demo_dir = crear_archivos_demo()
    result_complete = ExcelValidator.quick_validate(demo_dir)

    # Test con directorio inexistente
    result_missing = ExcelValidator.quick_validate("directorio_inexistente")

    print(f"📁 Directorio completo: {'✅ VÁLIDO' if result_complete else '❌ INVÁLIDO'}")
    print(f"📁 Directorio inexistente: {'✅ VÁLIDO' if result_missing else '❌ INVÁLIDO'}")


def cleanup_demo_files():
    """Limpia archivos de demostración"""
    import shutil

    demo_dirs = ["demo_excel_files", "demo_incomplete", "demo_empty", "demo_versions"]

    for dirname in demo_dirs:
        if os.path.exists(dirname):
            shutil.rmtree(dirname)
            print(f"🗑️ Eliminado: {dirname}")


def main():
    """Función principal de testing"""
    print("🚀 INICIANDO TESTS DEL SISTEMA DE VALIDACIÓN")
    print("=" * 60)

    try:
        test_validacion_completa()
        test_validacion_incompleta()
        test_directorio_vacio()
        test_diferentes_versiones()
        test_quick_validation()

        print("\n" + "=" * 60)
        print("✅ TODOS LOS TESTS COMPLETADOS")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ ERROR DURANTE TESTING: {e}")
        import traceback

        traceback.print_exc()

    finally:
        print("\n🧹 Limpiando archivos de demostración...")
        cleanup_demo_files()
        print("✅ Limpieza completada")


if __name__ == "__main__":
    main()
