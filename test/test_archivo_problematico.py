"""
🧪 Test Específico - Archivo "HT. Gestión Finanzas_v22.2 - copia.xlsx"
================================================================

Test dirigido para verificar la detección del archivo específico
que reportó el usuario como problemático.
"""

import os
import sys

# Agregar el directorio padre al path para importar módulos
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from components.excel_validator import ExcelValidator


def test_archivo_problematico():
    """Test específico para el archivo que no se detectaba"""

    print("=" * 70)
    print("🔍 TEST ESPECÍFICO: HT. Gestión Finanzas_v22.2 - copia.xlsx")
    print("=" * 70)

    # Crear directorio de prueba
    test_dir = "test_archivo_problematico"
    if not os.path.exists(test_dir):
        os.makedirs(test_dir)

    # Crear archivos de prueba incluyendo el problemático
    archivos_test = [
        "HT. Gestión Finanzas_v22.2 - copia.xlsx",  # ← ARCHIVO PROBLEMÁTICO
        "MtM_v4.1_Macro.xlsm",
        "HT. Gestión Finanzas_v22.2.xlsx",  # Archivo original
        "HT.Gestión Finanzas_v23.1 (1).xlsx",  # Variante con (1)
        "MtM_v5.0_Macro - copia.xlsm",  # Macro con copia
    ]

    print("📁 Creando archivos de prueba:")
    for archivo in archivos_test:
        filepath = os.path.join(test_dir, archivo)
        with open(filepath, "w") as f:
            f.write("Test file content")
        print(f"   ✅ {archivo}")

    # Ejecutar validación
    print("\n🔍 Ejecutando validación...")
    validator = ExcelValidator()
    is_valid, found_files, messages = validator.validate_directory(test_dir)

    # Mostrar resultados
    print(f"\n📊 RESULTADO GENERAL: {'✅ VÁLIDO' if is_valid else '❌ INVÁLIDO'}")
    print(f"📁 Archivos detectados: {len(found_files)}")

    # Detalles de archivos encontrados
    print("\n📋 ARCHIVOS DETECTADOS:")
    for file_type, file_info in found_files.items():
        config = validator.PATTERNS[file_type]
        print(f"   🎯 {config['display_name']}:")
        print(f"      📄 Archivo: {file_info.filename}")
        print(f"      📊 Versión: {file_info.version}")

    # Verificación específica del archivo problemático
    archivo_problematico = "HT. Gestión Finanzas_v22.2 - copia.xlsx"
    detectado = any(info.filename == archivo_problematico for info in found_files.values())

    print("\n🎯 VERIFICACIÓN ESPECÍFICA:")
    print(f"   Archivo buscado: {archivo_problematico}")
    print(f"   Estado: {'✅ DETECTADO' if detectado else '❌ NO DETECTADO'}")

    # Mostrar todos los mensajes
    print("\n💬 MENSAJES DE VALIDACIÓN:")
    for message in messages:
        print(f"   {message}")

    # Test de patrones individuales
    print("\n🔬 ANÁLISIS DE PATRONES:")
    test_individual_patterns(archivo_problematico, validator)

    # Limpieza
    import shutil

    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)
        print(f"\n🗑️ Directorio de prueba eliminado: {test_dir}")


def test_individual_patterns(filename, validator):
    """Prueba los diferentes patrones individualmente"""

    import re

    config_finanzas = validator.PATTERNS["finanzas"]

    # Test patrón original
    pattern_original = r"^HT\.\s*Gestión\s+Finanzas_v[\d.]+\.xlsx$"
    match_original = bool(re.match(pattern_original, filename, re.IGNORECASE))
    print(f"   📋 Patrón Original: {'✅' if match_original else '❌'} {pattern_original}")

    # Test patrón nuevo
    pattern_nuevo = config_finanzas["pattern"]
    match_nuevo = bool(re.match(pattern_nuevo, filename, re.IGNORECASE))
    print(f"   📋 Patrón Nuevo: {'✅' if match_nuevo else '❌'} {pattern_nuevo}")

    # Test patrón flexible
    pattern_flexible = config_finanzas["flexible_pattern"]
    match_flexible = bool(re.search(pattern_flexible, filename, re.IGNORECASE))
    print(f"   📋 Patrón Flexible: {'✅' if match_flexible else '❌'} {pattern_flexible}")

    # Test palabras clave
    keywords_match = validator._contains_finance_keywords(filename)
    print(
        f"   📋 Palabras Clave: {'✅' if keywords_match else '❌'} (HT + Gestión + Finanzas + versión)"
    )

    # Análisis detallado
    print(f"\n🔍 ANÁLISIS DETALLADO DEL ARCHIVO: {filename}")
    print(f"   • Comienza con HT.: {'✅' if filename.startswith('HT.') else '❌'}")
    print(f"   • Contiene 'Gestión': {'✅' if 'Gestión' in filename else '❌'}")
    print(f"   • Contiene 'Finanzas': {'✅' if 'Finanzas' in filename else '❌'}")
    print(f"   • Contiene versión (v*): {'✅' if re.search(r'v[\d.]+', filename) else '❌'}")
    print(f"   • Termina en .xlsx: {'✅' if filename.endswith('.xlsx') else '❌'}")
    print(f"   • Texto adicional: {'✅ - copia' if '- copia' in filename else '❌'}")


def test_multiples_variantes():
    """Test con múltiples variantes problemáticas"""

    print("\n" + "=" * 70)
    print("🔍 TEST MÚLTIPLES VARIANTES PROBLEMÁTICAS")
    print("=" * 70)

    variantes = [
        "HT. Gestión Finanzas_v22.2 - copia.xlsx",
        "HT. Gestión Finanzas_v22.2 (1).xlsx",
        "HT.Gestión Finanzas_v22.2.xlsx",  # Sin espacio después del punto
        "HT. Gestion Finanzas_v22.2.xlsx",  # Sin tilde
        "MtM_v4.1_Macro - copia.xlsm",
        "MtM_v4.1_Macro (1).xlsm",
        "MtM v4.1 Macro.xlsm",  # Sin guiones bajos
    ]

    test_dir = "test_variantes"
    if not os.path.exists(test_dir):
        os.makedirs(test_dir)

    # Crear todos los archivos variantes
    for variante in variantes:
        filepath = os.path.join(test_dir, variante)
        with open(filepath, "w") as f:
            f.write("Test variant")
        print(f"📄 Creado: {variante}")

    # Validar
    validator = ExcelValidator()
    is_valid, found_files, messages = validator.validate_directory(test_dir)

    print(f"\n📊 RESULTADO: {'✅ VÁLIDO' if is_valid else '❌ INVÁLIDO'}")
    print(f"📁 Archivos detectados: {len(found_files)} de 2 requeridos")

    for file_type, file_info in found_files.items():
        config = validator.PATTERNS[file_type]
        print(f"   • {config['display_name']}: {file_info.filename}")

    # Limpieza
    import shutil

    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)
        print(f"\n🗑️ Limpiado: {test_dir}")


if __name__ == "__main__":
    print("🚀 INICIANDO TESTS ESPECÍFICOS PARA ARCHIVOS PROBLEMÁTICOS")
    print("=" * 70)

    try:
        test_archivo_problematico()
        test_multiples_variantes()

        print("\n" + "=" * 70)
        print("✅ TESTS ESPECÍFICOS COMPLETADOS")
        print("=" * 70)

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback

        traceback.print_exc()
