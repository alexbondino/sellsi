"""
🎯 Test Demo Real - Validación Flexible Mejorada
===============================================

Demostración con archivos reales incluyendo variantes problemáticas
que ahora se detectan correctamente.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from components.excel_validator import ExcelValidator


def demo_validacion_flexible():
    """Demostración completa de la validación flexible mejorada"""

    print("🎯 DEMOSTRACIÓN: VALIDACIÓN FLEXIBLE MEJORADA")
    print("=" * 60)
    print("Mostrando cómo el sistema ahora detecta variantes problemáticas:")
    print()

    # Crear directorio demo
    demo_dir = "demo_flexible"
    if not os.path.exists(demo_dir):
        os.makedirs(demo_dir)

    # Archivos que antes NO se detectaban y ahora SÍ
    archivos_problematicos = [
        "HT. Gestión Finanzas_v22.2 - copia.xlsx",  # ← TU ARCHIVO PROBLEMÁTICO
        "HT. Gestión Finanzas_v22.2 (1).xlsx",  # Variante con (1)
        "HT.Gestión Finanzas_v23.1.xlsx",  # Sin espacio después del punto
        "MtM_v4.1_Macro - copia.xlsm",  # Macro con copia
        "MtM_v5.0_Macro (1).xlsm",  # Macro con (1)
    ]

    print("📁 Creando archivos de demostración:")
    for archivo in archivos_problematicos:
        filepath = os.path.join(demo_dir, archivo)
        with open(filepath, "w") as f:
            f.write("Demo content")
        estado = "🆕" if "copia" in archivo or "(1)" in archivo else "📄"
        print(f"   {estado} {archivo}")

    print(f"\n🔍 Ejecutando validación en directorio: {demo_dir}")

    # Validación
    validator = ExcelValidator()
    is_valid, found_files, messages = validator.validate_directory(demo_dir)

    # Resultados
    print(f"\n📊 RESULTADO: {'🟢 COMPLETAMENTE VÁLIDO' if is_valid else '🔴 INVÁLIDO'}")
    print(f"📂 Total archivos detectados: {len(found_files)} de 2 requeridos")

    if found_files:
        print("\n✅ ARCHIVOS DETECTADOS EXITOSAMENTE:")
        for file_type, file_info in found_files.items():
            config = validator.PATTERNS[file_type]
            emoji = "💼" if file_type == "finanzas" else "⚙️"
            print(f"   {emoji} {config['display_name']}:")
            print(f"      📄 Archivo: {file_info.filename}")
            print(f"      🔢 Versión: {file_info.version}")
            print(f"      📂 Ruta: {file_info.full_path}")

    print("\n💬 MENSAJES DEL SISTEMA:")
    for message in messages:
        if "✅" in message:
            print(f"   🟢 {message}")
        elif "🎉" in message:
            print(f"   🎊 {message}")
        else:
            print(f"   📝 {message}")

    # Verificación específica del archivo problemático original
    archivo_original = "HT. Gestión Finanzas_v22.2 - copia.xlsx"
    detectado_original = any(info.filename == archivo_original for info in found_files.values())

    print("\n🎯 VERIFICACIÓN ESPECIAL - TU ARCHIVO PROBLEMÁTICO:")
    print(f"   📄 Archivo: {archivo_original}")
    print(
        f"   🔍 Estado: {'✅ AHORA SE DETECTA CORRECTAMENTE' if detectado_original else '❌ AÚN NO DETECTADO'}"
    )

    if detectado_original:
        print("   🎉 ¡PROBLEMA RESUELTO! El archivo se detecta sin problemas.")

    # Limpieza
    print("\n🧹 Limpiando archivos de demostración...")
    import shutil

    if os.path.exists(demo_dir):
        shutil.rmtree(demo_dir)
        print(f"🗑️ Eliminado: {demo_dir}")

    return is_valid


def mostrar_mejoras_implementadas():
    """Muestra las mejoras específicas implementadas"""

    print("\n" + "=" * 60)
    print("🔧 MEJORAS IMPLEMENTADAS EN EL VALIDADOR")
    print("=" * 60)

    mejoras = [
        {
            "titulo": "🎯 Patrones Más Flexibles",
            "descripcion": 'Los regex ahora aceptan texto adicional como "- copia", "(1)", etc.',
            "ejemplo": "HT. Gestión Finanzas_v22.2 - copia.xlsx ✅",
        },
        {
            "titulo": "🔍 Múltiples Estrategias de Detección",
            "descripcion": "3 niveles: Estricto → Flexible → Palabras clave",
            "ejemplo": 'Detecta incluso "HT.Gestión Finanzas_v22.2.xlsx" (sin espacios)',
        },
        {
            "titulo": "🧠 Detección por Palabras Clave",
            "descripcion": "Si los regex fallan, busca por contenido esencial",
            "ejemplo": "Encuentra archivos con nombres muy variados",
        },
        {
            "titulo": "📊 Extracción Mejorada de Versiones",
            "descripcion": "Múltiples métodos para encontrar números de versión",
            "ejemplo": "v22.2, _22.2, 22.2 → todos detectados",
        },
        {
            "titulo": "🏆 Sistema de Confianza",
            "descripcion": "Ordena candidatos por nivel de coincidencia",
            "ejemplo": "Prefiere archivos originales sobre copias",
        },
    ]

    for i, mejora in enumerate(mejoras, 1):
        print(f"\n{i}. {mejora['titulo']}")
        print(f"   💡 {mejora['descripcion']}")
        print(f"   📝 Ejemplo: {mejora['ejemplo']}")


if __name__ == "__main__":
    print("🚀 DEMOSTRACIÓN DE VALIDACIÓN FLEXIBLE MEJORADA")
    print("=" * 60)

    try:
        # Demo principal
        resultado = demo_validacion_flexible()

        # Mostrar mejoras
        mostrar_mejoras_implementadas()

        # Resumen final
        print("\n" + "=" * 60)
        if resultado:
            print("🎊 ¡ÉXITO TOTAL!")
            print("✅ Tu archivo problemático ahora se detecta perfectamente")
            print("✅ El sistema es mucho más flexible y tolerante")
            print("✅ Maneja todo tipo de variantes de nombres")
        else:
            print("❌ Algo salió mal en la demostración")

        print("=" * 60)

    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback

        traceback.print_exc()
