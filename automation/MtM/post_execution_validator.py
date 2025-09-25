"""
🔍 Sistema de Validación Post-Ejecución y Recovery Inteligente
===============================================================

Módulo crítico que se ejecuta al finalizar el proceso de descarga
para validar los 13 archivos esperados y ejecutar estrategias de recovery
si es necesario.

Fecha: 24 de Septiembre, 2025
Autor: MtM Downloader Bot System
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from automation.MtM.download_tracker import DownloadSession, DownloadTracker


@dataclass
class ValidationReport:
    """Reporte completo de validación post-descarga"""

    total_expected: int
    total_downloaded: int
    missing_count: int
    excel_principal_found: bool
    contratos_found: int
    failed_sessions: List[DownloadSession] = field(default_factory=list)
    successful_sessions: List[DownloadSession] = field(default_factory=list)
    missing_details: List[Dict[str, str]] = field(default_factory=list)
    can_proceed_to_stage2: bool = False
    recommendation: str = ""

    @property
    def is_complete(self) -> bool:
        """¿Se descargaron todos los archivos esperados?"""
        return self.missing_count == 0

    @property
    def is_critical_failure(self) -> bool:
        """¿Falta el archivo Excel principal?"""
        return not self.excel_principal_found

    @property
    def success_rate(self) -> float:
        """Porcentaje de éxito en las descargas"""
        if self.total_expected == 0:
            return 100.0
        return (self.total_downloaded / self.total_expected) * 100


@dataclass
class RecoveryPlan:
    """Plan de recuperación para archivos faltantes"""

    strategy_name: str
    description: str
    estimated_time_minutes: int
    actions: List[str] = field(default_factory=list)
    user_intervention_required: bool = False
    can_proceed_partial: bool = False


class PostExecutionValidator:
    """
    🔍 Sistema de validación post-ejecución

    Se ejecuta AL FINAL del proceso de descarga para:
    1. Contar archivos descargados vs esperados
    2. Identificar archivos faltantes específicos
    3. Determinar si se puede proceder a la 2da etapa
    4. Recomendar estrategia de recovery si es necesario
    """

    def __init__(self, log_func):
        self.log = log_func

        # Archivos esperados en el proceso MtM
        self.EXPECTED_FILES = {
            "excel_principal": {
                "count": 1,
                "patterns": [
                    r".*ContratoSwapTasas.*\.xlsx$",
                    r".*portfolio.*forward.*\.xlsx$",
                    r".*excel.*\.xlsx$",
                ],
                "critical": True,
                "description": "Archivo Excel principal con datos de swaps",
            },
            "contratos": {
                "count_min": 8,  # Mínimo aceptable
                "count_max": 15,  # Máximo posible (variable según data)
                "count_expected": 12,  # Lo más común
                "patterns": [r".*\.pdf$", r".*contrato.*\.xlsx$", r".*contract.*\.pdf$"],
                "critical": False,
                "description": "Archivos individuales de contratos (PDF o Excel)",
            },
        }

    def validate_complete_download(
        self, download_tracker: Optional[DownloadTracker], download_dir: Optional[Path] = None
    ) -> ValidationReport:
        """
        📊 Validación completa del proceso de descarga

        Args:
            download_tracker: Tracker con todas las sesiones
            download_dir: Directorio de descarga para validación adicional

        Returns:
            ValidationReport con análisis completo y recomendaciones
        """

        self.log("[Validación] 🔍 Iniciando validación post-ejecución...", level="INFO")

        # Obtener todas las sesiones completadas
        completed_sessions = []
        if download_tracker:
            completed_sessions = download_tracker.get_completed_sessions()
        else:
            self.log(
                "[Validación] ⚠️ No hay tracker disponible - solo validación por filesystem",
                level="ADVERTENCIA",
            )

        # Separar sesiones exitosas y fallidas
        successful_sessions = [s for s in completed_sessions if s.status == "success"]
        failed_sessions = [s for s in completed_sessions if s.status in ["failed", "invalid"]]

        self.log(f"[Validación] Total de sesiones: {len(completed_sessions)}", level="DEBUG")
        self.log(f"[Validación] Sesiones exitosas: {len(successful_sessions)}", level="INFO")
        self.log(f"[Validación] Sesiones fallidas: {len(failed_sessions)}", level="INFO")

        # Análisis específico de archivos
        excel_principal_found, contratos_count = self._analyze_downloaded_files(successful_sessions)

        # Validación adicional por sistema de archivos si se proporciona directorio
        if download_dir:
            excel_fs_found, contratos_fs_count = self._analyze_filesystem(download_dir)
            # Tomar el máximo entre tracker y filesystem (por si tracker perdió alguno)
            excel_principal_found = excel_principal_found or excel_fs_found
            contratos_count = max(contratos_count, contratos_fs_count)

        # Calcular totales
        total_downloaded = (1 if excel_principal_found else 0) + contratos_count
        expected_total = (
            1 + self.EXPECTED_FILES["contratos"]["count_expected"]
        )  # 1 Excel + 12 contratos = 13
        missing_count = max(0, expected_total - total_downloaded)

        # Generar detalles de archivos faltantes
        missing_details = self._generate_missing_details(
            failed_sessions, excel_principal_found, contratos_count
        )

        # Determinar si se puede proceder a etapa 2
        can_proceed = self._can_proceed_to_stage2(excel_principal_found, contratos_count)

        # Generar recomendación
        recommendation = self._generate_recommendation(
            excel_principal_found, contratos_count, missing_count
        )

        # Crear reporte
        report = ValidationReport(
            total_expected=expected_total,
            total_downloaded=total_downloaded,
            missing_count=missing_count,
            excel_principal_found=excel_principal_found,
            contratos_found=contratos_count,
            failed_sessions=failed_sessions,
            successful_sessions=successful_sessions,
            missing_details=missing_details,
            can_proceed_to_stage2=can_proceed,
            recommendation=recommendation,
        )

        # Log del resumen
        self._log_validation_summary(report)

        return report

    def _analyze_downloaded_files(
        self, successful_sessions: List[DownloadSession]
    ) -> Tuple[bool, int]:
        """Analiza las sesiones exitosas para identificar tipos de archivos"""

        excel_found = False
        contratos_count = 0

        for session in successful_sessions:
            if not session.result or not session.result.file_info:
                continue

            file_path = session.result.file_info.path
            file_name = file_path.name.lower()

            # Verificar si es Excel principal
            if session.download_type == "excel" or any(
                pattern_match in file_name
                for pattern_match in ["contratoswap", "portfolio", "forward"]
            ):
                excel_found = True
                self.log(f"[Validación] ✅ Excel principal encontrado: {file_name}", level="EXITO")

            # Verificar si es contrato
            elif session.download_type == "contract" or file_name.endswith(
                (".pdf", ".xlsx", ".xls")
            ):
                contratos_count += 1
                contract_name = session.metadata.get("contract_name", "desconocido")
                self.log(
                    f"[Validación] ✅ Contrato encontrado: {contract_name} ({file_name})",
                    level="DEBUG",
                )

        return excel_found, contratos_count

    def _analyze_filesystem(self, download_dir: Path) -> Tuple[bool, int]:
        """Validación adicional revisando el sistema de archivos directamente"""

        if not download_dir.exists():
            return False, 0

        excel_found = False
        contratos_count = 0

        for file_path in download_dir.glob("**/*"):
            if not file_path.is_file():
                continue

            file_name = file_path.name.lower()

            # Buscar Excel principal
            if any(
                pattern in file_name for pattern in ["contratoswap", "portfolio", "forward"]
            ) and file_name.endswith(".xlsx"):
                excel_found = True
                self.log(
                    f"[Validación] ✅ Excel principal detectado en FS: {file_name}", level="DEBUG"
                )

            # Buscar contratos (PDFs y Excels que no sean el principal)
            elif file_name.endswith((".pdf", ".xlsx", ".xls")) and not any(
                pattern in file_name for pattern in ["contratoswap", "portfolio", "forward"]
            ):
                contratos_count += 1
                self.log(f"[Validación] ✅ Contrato detectado en FS: {file_name}", level="DEBUG")

        return excel_found, contratos_count

    def _generate_missing_details(
        self, failed_sessions: List[DownloadSession], excel_found: bool, contratos_count: int
    ) -> List[Dict[str, str]]:
        """Genera detalles específicos de archivos faltantes"""

        missing_details = []

        # Excel principal faltante
        if not excel_found:
            excel_failure = next((s for s in failed_sessions if s.download_type == "excel"), None)
            missing_details.append(
                {
                    "type": "excel_principal",
                    "name": "ContratoSwapTasas.xlsx",
                    "reason": (
                        excel_failure.metadata.get("failure_reason", "unknown")
                        if excel_failure
                        else "not_attempted"
                    ),
                    "critical": "true",
                    "description": "Archivo principal con datos de valorización MtM",
                }
            )

        # Contratos faltantes
        contract_failures = [s for s in failed_sessions if s.download_type == "contract"]
        expected_contratos = self.EXPECTED_FILES["contratos"]["count_expected"]
        missing_contratos = max(0, expected_contratos - contratos_count)

        if missing_contratos > 0:
            if contract_failures:
                # Listar fallos específicos conocidos
                for failure in contract_failures:
                    missing_details.append(
                        {
                            "type": "contrato",
                            "name": failure.metadata.get("contract_name", "Contrato desconocido"),
                            "reason": failure.metadata.get("failure_reason", "unknown"),
                            "critical": "false",
                            "page": failure.metadata.get("page", "?"),
                            "row": failure.metadata.get("row", "?"),
                            "description": (
                                f"Contrato individual en página {failure.metadata.get('page', '?')}"
                            ),
                        }
                    )
            else:
                # Fallos genéricos (no se intentaron o perdidos)
                for i in range(missing_contratos):
                    missing_details.append(
                        {
                            "type": "contrato",
                            "name": f"Contrato faltante #{i+1}",
                            "reason": "not_attempted_or_lost",
                            "critical": "false",
                            "description": (
                                "Contrato que no se pudo descargar por razones desconocidas"
                            ),
                        }
                    )

        return missing_details

    def _can_proceed_to_stage2(self, excel_found: bool, contratos_count: int) -> bool:
        """Determina si se puede proceder a la etapa 2 del proceso MtM"""

        # REGLA CRÍTICA: Sin Excel principal NO se puede proceder
        if not excel_found:
            return False

        # Con Excel principal, evaluar contratos
        min_contratos = self.EXPECTED_FILES["contratos"]["count_min"]  # 8 contratos mínimo

        if contratos_count >= min_contratos:
            return True  # Suficientes contratos para análisis básico
        else:
            return False  # Muy pocos contratos, análisis incompleto

    def _generate_recommendation(
        self, excel_found: bool, contratos_count: int, missing_count: int
    ) -> str:
        """Genera recomendación basada en el análisis"""

        if missing_count == 0:
            return "🎉 PERFECTO: Todos los archivos descargados. Proceder a etapa 2."

        if not excel_found:
            return "🚨 CRÍTICO: Excel principal faltante. Recovery obligatorio antes de continuar."

        expected_contratos = self.EXPECTED_FILES["contratos"]["count_expected"]
        min_contratos = self.EXPECTED_FILES["contratos"]["count_min"]

        if contratos_count >= min_contratos:
            return f"⚠️ PARCIAL: Excel OK + {contratos_count}/{expected_contratos} contratos. Puede proceder con análisis reducido."
        else:
            return f"❌ INSUFICIENTE: Solo {contratos_count}/{expected_contratos} contratos. Recovery recomendado."

    def _log_validation_summary(self, report: ValidationReport):
        """Log del resumen de validación"""

        self.log("=" * 60, level="INFO")
        self.log("📊 RESUMEN DE VALIDACIÓN POST-EJECUCIÓN", level="INFO")
        self.log("=" * 60, level="INFO")

        # Stats generales
        self.log(
            f"📈 Archivos descargados: {report.total_downloaded}/{report.total_expected}",
            level="INFO",
        )
        self.log(f"📈 Tasa de éxito: {report.success_rate:.1f}%", level="INFO")

        # Excel principal
        excel_status = "✅ ENCONTRADO" if report.excel_principal_found else "❌ FALTANTE"
        self.log(
            f"📊 Excel principal: {excel_status}",
            level="EXITO" if report.excel_principal_found else "ERROR",
        )

        # Contratos
        self.log(f"📋 Contratos descargados: {report.contratos_found}", level="INFO")

        # Archivos faltantes
        if report.missing_count > 0:
            self.log(f"❌ Archivos faltantes: {report.missing_count}", level="ADVERTENCIA")
            for detail in report.missing_details:
                critical_mark = "🚨" if detail.get("critical") == "true" else "⚠️"
                self.log(
                    f"   {critical_mark} {detail['name']} - {detail['reason']}", level="ADVERTENCIA"
                )

        # Etapa 2
        stage2_status = (
            "✅ PUEDE PROCEDER" if report.can_proceed_to_stage2 else "❌ NO PUEDE PROCEDER"
        )
        stage2_level = "EXITO" if report.can_proceed_to_stage2 else "ERROR"
        self.log(f"🎯 Etapa 2: {stage2_status}", level=stage2_level)

        # Recomendación
        self.log(f"💡 Recomendación: {report.recommendation}", level="INFO")

        self.log("=" * 60, level="INFO")


class RecoveryDecisionEngine:
    """
    🧠 Motor de decisiones para estrategias de recovery

    Analiza el reporte de validación y decide cuál es la mejor
    estrategia de recuperación según la situación específica.
    """

    def __init__(self, log_func):
        self.log = log_func

    def decide_recovery_strategy(self, validation_report: ValidationReport) -> RecoveryPlan:
        """Decide la mejor estrategia de recovery basada en el reporte"""

        if validation_report.is_complete:
            return RecoveryPlan(
                strategy_name="none",
                description="Todos los archivos descargados correctamente",
                estimated_time_minutes=0,
                actions=["Proceder a etapa 2"],
                can_proceed_partial=True,
            )

        if validation_report.is_critical_failure:
            # Sin Excel principal = emergencia
            return self._create_critical_recovery_plan(validation_report)

        if validation_report.missing_count <= 3:
            # Pocos archivos faltantes = reintento selectivo
            return self._create_selective_retry_plan(validation_report)

        if validation_report.can_proceed_to_stage2:
            # Puede proceder parcialmente
            return self._create_partial_continuation_plan(validation_report)

        # Muchos archivos faltantes = recovery completo
        return self._create_full_recovery_plan(validation_report)

    def _create_critical_recovery_plan(self, report: ValidationReport) -> RecoveryPlan:
        """Plan para cuando falta el Excel principal (CRÍTICO)"""

        return RecoveryPlan(
            strategy_name="critical_excel_recovery",
            description="Recovery crítico: Excel principal faltante",
            estimated_time_minutes=5,
            actions=[
                "Reintentar descarga automática del Excel principal",
                "Usar fallback requests con headers actualizados",
                "Si falla: solicitar descarga manual asistida",
                "Validar archivo antes de continuar",
            ],
            user_intervention_required=True,
            can_proceed_partial=False,
        )

    def _create_selective_retry_plan(self, report: ValidationReport) -> RecoveryPlan:
        """Plan para pocos archivos faltantes (reintento preciso)"""

        failed_contracts = [d for d in report.missing_details if d["type"] == "contrato"]

        actions = ["Reintentar descargas fallidas en posiciones exactas:"]
        for contract in failed_contracts[:3]:  # Mostrar máximo 3
            page = contract.get("page", "?")
            row = contract.get("row", "?")
            actions.append(f"  - {contract['name']} (Página {page}, Fila {row})")

        return RecoveryPlan(
            strategy_name="selective_retry",
            description=f"Reintento selectivo de {len(failed_contracts)} archivos específicos",
            estimated_time_minutes=3,
            actions=actions,
            user_intervention_required=False,
            can_proceed_partial=True,
        )

    def _create_partial_continuation_plan(self, report: ValidationReport) -> RecoveryPlan:
        """Plan para continuación con archivos parciales"""

        return RecoveryPlan(
            strategy_name="partial_continuation",
            description=f"Continuar con {report.total_downloaded}/{report.total_expected} archivos disponibles",
            estimated_time_minutes=1,
            actions=[
                "Excel principal: ✓ Disponible",
                f"Contratos: {report.contratos_found} de {report.total_expected-1}",
                "Proceder a etapa 2 con análisis parcial",
                "Opción de descargar faltantes después",
            ],
            user_intervention_required=False,
            can_proceed_partial=True,
        )

    def _create_full_recovery_plan(self, report: ValidationReport) -> RecoveryPlan:
        """Plan para recovery completo (muchos archivos faltantes)"""

        return RecoveryPlan(
            strategy_name="full_recovery",
            description="Recovery completo: múltiples archivos faltantes",
            estimated_time_minutes=8,
            actions=[
                "Reiniciar proceso de descarga completo",
                "Aumentar timeouts y waits",
                "Usar técnicas de click alternativas",
                "Monitoreo estrecho de cada descarga",
            ],
            user_intervention_required=True,
            can_proceed_partial=False,
        )


__all__ = ["ValidationReport", "RecoveryPlan", "PostExecutionValidator", "RecoveryDecisionEngine"]
