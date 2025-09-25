"""
🔍 Validador de Archivos Excel para MtM
======================================

Módulo que maneja la validación inteligente de archivos Excel requeridos
para la segunda etapa de Valorización MtM.

Detecta patrones flexibles como:
- HT. Gestión Finanzas_v*.xlsx (cualquier versión)
- MtM_v*_Macro.xlsm (cualquier versión)

Autor: GitHub Copilot
Fecha: 24 de Septiembre, 2025
"""

import os
import re
import logging
from typing import List, Tuple, Dict, Optional
from dataclasses import dataclass


@dataclass
class ExcelFileInfo:
    """Información detallada de un archivo Excel encontrado"""

    filename: str
    full_path: str
    version: Optional[str]
    file_type: str  # 'finanzas' o 'macro'
    is_valid: bool


class ExcelValidator:
    """
    🎯 Validador inteligente de archivos Excel para MtM

    Funcionalidades:
    ✅ Detección de patrones con versiones flexibles
    ✅ Validación de existencia de ambos archivos requeridos
    ✅ Extracción automática de versiones
    ✅ Feedback detallado para el usuario
    ✅ Sugerencias cuando faltan archivos
    """

    # Patrones de búsqueda SUPER flexibles - Mejorados para máxima compatibilidad
    PATTERNS = {
        "finanzas": {
            # Patrón más flexible que acepta:
            # - Espacios variables
            # - Texto adicional como "- copia", "(1)", etc.
            # - Versiones con diferentes formatos
            # - AMBAS extensiones: .xlsm (prioridad) y .xlsx (fallback)
            "pattern": r"^HT\.\s*Gestión\s+Finanzas.*v[\d.]+.*\.xlsm?$",
            "flexible_pattern": r"HT.*Gestión.*Finanzas.*v[\d.]+.*\.xlsm?",
            "display_name": "HT. Gestión Finanzas",
            "example": "HT. Gestión Finanzas_v22.2.xlsm o .xlsx",
            "extensions": [".xlsm", ".xlsx"],  # Orden = Prioridad (XLSM primero)
            "priority_extension": ".xlsm",
        },
        "macro": {
            # Patrón más flexible que acepta:
            # - Texto adicional en cualquier parte
            # - Versiones variables
            # - Espacios y caracteres adicionales
            "pattern": r"^MtM.*v[\d.]+.*Macro.*\.xlsm$",
            "flexible_pattern": r"MtM.*v[\d.]+.*Macro.*\.xlsm",
            "display_name": "MtM Macro",
            "example": "MtM_v4.1_Macro.xlsm",
            "extensions": [".xlsm"],
            "priority_extension": ".xlsm",
        },
    }

    def __init__(self):
        self.found_files: Dict[str, ExcelFileInfo] = {}
        self.validation_messages: List[str] = []

    def validate_directory(
        self, directory: str
    ) -> Tuple[bool, Dict[str, ExcelFileInfo], List[str]]:
        """
        Valida un directorio completo buscando los archivos Excel requeridos

        Args:
            directory: Ruta del directorio a validar

        Returns:
            Tuple con (is_valid, found_files_dict, messages_list)
        """
        self.found_files.clear()
        self.validation_messages.clear()
        
        logging.debug(f"[EXCEL_VALIDATOR] Starting directory validation for: {directory}")

        if not os.path.exists(directory):
            logging.debug(f"[EXCEL_VALIDATOR] Directory does not exist: {directory}")
            self.validation_messages.append("❌ El directorio especificado no existe")
            return False, {}, self.validation_messages

        if not os.path.isdir(directory):
            logging.debug(f"[EXCEL_VALIDATOR] Path is not a directory: {directory}")
            self.validation_messages.append("❌ La ruta especificada no es un directorio")
            return False, {}, self.validation_messages

        # Buscar archivos en el directorio
        all_files = os.listdir(directory)
        excel_files = [f for f in all_files if f.endswith((".xlsx", ".xlsm"))]
        
        logging.debug(f"[EXCEL_VALIDATOR] Found {len(excel_files)} Excel files in directory: {excel_files}")

        if not excel_files:
            logging.debug(f"[EXCEL_VALIDATOR] No Excel files found in directory")
            self.validation_messages.append("❌ No se encontraron archivos Excel en el directorio")
            self._add_suggestions()
            return False, {}, self.validation_messages

        # Validar cada patrón
        for file_type, config in self.PATTERNS.items():
            logging.debug(f"[EXCEL_VALIDATOR] Searching for pattern: {file_type}")
            found = self._find_matching_file(directory, excel_files, file_type, config)
            if found:
                logging.debug(f"[EXCEL_VALIDATOR] Found matching file for {file_type}: {found.filename}")
                self.found_files[file_type] = found
            else:
                logging.debug(f"[EXCEL_VALIDATOR] No matching file found for pattern: {file_type}")

        # Generar mensajes de validación
        is_complete = self._generate_validation_messages()
        logging.debug(f"[EXCEL_VALIDATOR] Validation complete. Success: {is_complete}, Found files: {len(self.found_files)}")

        return is_complete, self.found_files, self.validation_messages

    def _find_matching_file(
        self, directory: str, files: List[str], file_type: str, config: dict
    ) -> Optional[ExcelFileInfo]:
        """
        Busca un archivo que coincida con el patrón específico usando múltiples estrategias
        CON SISTEMA DE PRIORIDAD DE EXTENSIONES

        Para HT. Gestión Finanzas: .xlsm > .xlsx (prioridad absoluta)

        Estrategias de búsqueda (en orden de prioridad):
        1. Patrón estricto con extensión prioritaria
        2. Patrón flexible con extensión prioritaria
        3. Palabras clave con extensión prioritaria
        4. Fallback a extensiones secundarias
        """
        primary_pattern = config["pattern"]
        flexible_pattern = config.get("flexible_pattern", primary_pattern)
        extensions = config.get("extensions", [".xlsm", ".xlsx"])
        priority_extension = config.get(
            "priority_extension", extensions[0] if extensions else ".xlsx"
        )

        # Lista de archivos candidatos con sus métodos de detección Y prioridad de extensión
        candidates = []

        for filename in files:
            match_method = None
            confidence = 0
            extension_priority = 0

            # Determinar prioridad de extensión
            file_extension = os.path.splitext(filename.lower())[1]
            if file_extension == priority_extension.lower():
                extension_priority = 100  # Máxima prioridad para extensión preferida
            elif file_extension in [ext.lower() for ext in extensions]:
                extension_priority = 50  # Prioridad media para extensiones permitidas
            else:
                continue  # Saltar archivos con extensiones no válidas

            # ESTRATEGIA 1: Patrón primario (máxima confianza)
            if re.match(primary_pattern, filename, re.IGNORECASE):
                match_method = "strict"
                confidence = 100
            # ESTRATEGIA 2: Patrón flexible (alta confianza)
            elif re.search(flexible_pattern, filename, re.IGNORECASE):
                match_method = "flexible"
                confidence = 90
            # ESTRATEGIA 3: Palabras clave esenciales (confianza media)
            else:
                if file_type == "finanzas":
                    if self._contains_finance_keywords(filename):
                        match_method = "keywords"
                        confidence = 70
                elif file_type == "macro":
                    if self._contains_macro_keywords(filename):
                        match_method = "keywords"
                        confidence = 70

            if match_method:
                # Extraer versión con método mejorado
                version = self._extract_version(filename)

                # Calcular puntuación total: confianza + prioridad de extensión
                total_score = confidence + extension_priority

                candidates.append(
                    {
                        "filename": filename,
                        "method": match_method,
                        "confidence": confidence,
                        "version": version,
                        "extension": file_extension,
                        "extension_priority": extension_priority,
                        "total_score": total_score,
                    }
                )

        # Ordenar candidatos por puntuación total (mayor a menor)
        # Esto garantiza que .xlsm siempre tenga prioridad sobre .xlsx
        candidates.sort(key=lambda x: x["total_score"], reverse=True)

        if candidates:
            best_match = candidates[0]
            return ExcelFileInfo(
                filename=best_match["filename"],
                full_path=os.path.join(directory, best_match["filename"]),
                version=best_match["version"],
                file_type=file_type,
                is_valid=True,
            )

        return None

    def _contains_finance_keywords(self, filename: str) -> bool:
        """Verifica si el archivo contiene palabras clave de finanzas"""
        filename_lower = filename.lower()
        keywords = ["ht", "gestion", "finanzas", "gestión"]

        # Debe contener al menos 3 de las 4 palabras clave y tener versión
        keyword_count = sum(1 for kw in keywords if kw in filename_lower)
        has_version = bool(re.search(r"v[\d.]+", filename, re.IGNORECASE))
        # Ahora acepta tanto .xlsx como .xlsm
        has_excel_ext = filename_lower.endswith(".xlsx") or filename_lower.endswith(".xlsm")

        return keyword_count >= 3 and has_version and has_excel_ext

    def _contains_macro_keywords(self, filename: str) -> bool:
        """Verifica si el archivo contiene palabras clave de macro"""
        filename_lower = filename.lower()

        # Debe contener ambas palabras clave, versión y extensión correcta
        has_mtm = "mtm" in filename_lower
        has_macro = "macro" in filename_lower
        has_version = bool(re.search(r"v[\d.]+", filename, re.IGNORECASE))
        has_xlsm_ext = filename_lower.endswith(".xlsm")

        return has_mtm and has_macro and has_version and has_xlsm_ext

    def _extract_version(self, filename: str) -> str:
        """Extrae la versión del nombre de archivo con múltiples estrategias"""
        # Estrategia 1: Patrón standard v1.2.3
        version_match = re.search(r"v([\d.]+)", filename, re.IGNORECASE)
        if version_match:
            return version_match.group(1)

        # Estrategia 2: Números después de guión bajo
        underscore_match = re.search(r"_(\d+\.\d+)", filename)
        if underscore_match:
            return underscore_match.group(1)

        # Estrategia 3: Cualquier secuencia de números con puntos
        number_match = re.search(r"(\d+\.\d+)", filename)
        if number_match:
            return number_match.group(1)

        return "desconocida"

    def _generate_validation_messages(self) -> bool:
        """Genera mensajes informativos sobre la validación"""
        required_types = set(self.PATTERNS.keys())
        found_types = set(self.found_files.keys())

        # Archivos encontrados
        for file_type, file_info in self.found_files.items():
            config = self.PATTERNS[file_type]
            self.validation_messages.append(
                f"✅ {config['display_name']} encontrado: {file_info.filename} (v{file_info.version})"
            )

        # Archivos faltantes
        missing_types = required_types - found_types
        for file_type in missing_types:
            config = self.PATTERNS[file_type]
            self.validation_messages.append(f"❌ {config['display_name']} NO encontrado")
            self.validation_messages.append(f"   📝 Busca archivos como: {config['example']}")

        # Estado general
        is_complete = len(missing_types) == 0
        if is_complete:
            self.validation_messages.append(
                "🎉 Todos los archivos Excel requeridos están presentes"
            )
            self.validation_messages.append("✅ El bot puede ejecutarse correctamente")
        else:
            self.validation_messages.append(
                f"⚠️ Faltan {len(missing_types)} archivo(s) para completar la validación"
            )

        return is_complete

    def _add_suggestions(self):
        """Agrega sugerencias cuando no se encuentran archivos"""
        self.validation_messages.extend(
            [
                "",
                "💡 Sugerencias:",
                "• Verifica que el directorio contenga los archivos Excel de macros",
                "• Los archivos deben seguir estos patrones:",
                f"  - {self.PATTERNS['finanzas']['example']}",
                f"  - {self.PATTERNS['macro']['example']}",
                "• Asegúrate de que las extensiones sean .xlsx y .xlsm respectivamente",
            ]
        )

    def get_validation_summary(self) -> str:
        """Retorna un resumen textual de la validación"""
        if not self.validation_messages:
            return "No se ha ejecutado ninguna validación"

        return "\n".join(self.validation_messages)

    def get_found_files_info(self) -> Dict[str, str]:
        """Retorna información simplificada de archivos encontrados"""
        return {file_type: file_info.filename for file_type, file_info in self.found_files.items()}

    @staticmethod
    def quick_validate(directory: str) -> bool:
        """Validación rápida que retorna solo True/False"""
        validator = ExcelValidator()
        is_valid, _, _ = validator.validate_directory(directory)
        return is_valid


# Función de conveniencia para uso directo
def validate_excel_files(directory: str) -> Tuple[bool, List[str]]:
    """
    Función de conveniencia para validar archivos Excel

    Args:
        directory: Directorio a validar

    Returns:
        Tuple con (is_valid, messages_list)
    """
    validator = ExcelValidator()
    is_valid, found_files, messages = validator.validate_directory(directory)
    return is_valid, messages
