"""
🧪 Test del Sistema de Validación y Recovery Post-Ejecución
===========================================================

Test completo que simula diferentes escenarios de descarga
y demuestra cómo el nuevo sistema de validación y recovery
maneja cada situación.

Fecha: 24 de Septiembre, 2025
"""

import time
from pathlib import Path
from typing import Dict, Optional
from automation.MtM.download_tracker import (
    DownloadTracker,
    DownloadSession,
    DownloadResult,
    FileInfo,
    ValidationResult,
)
from automation.MtM.post_execution_validator import PostExecutionValidator, RecoveryDecisionEngine


def create_mock_log_func():
    """Crea función de log mock para testing"""

    def log_func(message: str, level: str = "INFO"):
        timestamp = time.strftime("%H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")

    return log_func


def create_test_download_dir() -> Path:
    """Crea directorio temporal para testing"""
    test_dir = Path("./test_downloads")
    test_dir.mkdir(exist_ok=True)
    return test_dir


def create_mock_excel_file(test_dir: Path, name: str = "ContratoSwapTasas.xlsx") -> Path:
    """Crea archivo Excel mock para testing"""
    file_path = test_dir / name
    # Crear archivo con magic bytes de Excel (ZIP header)
    with open(file_path, "wb") as f:
        f.write(b"PK\x03\x04")  # ZIP magic bytes
        f.write(b"0" * 2000)  # Contenido mock (2KB)
    return file_path


def create_mock_contract_file(test_dir: Path, name: str) -> Path:
    """Crea archivo de contrato mock para testing"""
    file_path = test_dir / f"{name}.pdf"
    # Crear archivo con magic bytes de PDF
    with open(file_path, "wb") as f:
        f.write(b"%PDF-1.4")  # PDF magic bytes
        f.write(b"0" * 1500)  # Contenido mock (1.5KB)
    return file_path


def create_mock_successful_session(
    session_id: str, download_type: str, file_path: Path, metadata: Optional[Dict] = None
) -> DownloadSession:
    """Crea sesión exitosa mock"""
    session = DownloadSession(
        session_id=session_id,
        download_type=download_type,
        metadata=metadata or {},
        started_at=time.time(),
        pre_snapshot={},
    )

    # Simular resultado exitoso
    file_info = FileInfo(
        path=file_path, size=file_path.stat().st_size, mtime=file_path.stat().st_mtime
    )
    validation = ValidationResult(passed=True)
    session.result = DownloadResult(file_info=file_info, validation=validation)
    session.status = "success"

    return session


def create_mock_failed_session(
    session_id: str, download_type: str, metadata: Optional[Dict] = None, reason: str = "timeout"
) -> DownloadSession:
    """Crea sesión fallida mock"""
    session = DownloadSession(
        session_id=session_id,
        download_type=download_type,
        metadata=metadata or {},
        started_at=time.time(),
        pre_snapshot={},
    )

    session.status = "failed"
    session.metadata["failure_reason"] = reason

    return session


def test_scenario_perfect_download():
    """🎉 Escenario 1: Descarga perfecta (13/13 archivos)"""
    print("\n" + "=" * 60)
    print("🎉 TEST 1: DESCARGA PERFECTA (13/13 archivos)")
    print("=" * 60)

    log_func = create_mock_log_func()
    test_dir = create_test_download_dir()

    # Crear archivos mock
    excel_file = create_mock_excel_file(test_dir)
    contract_files = [create_mock_contract_file(test_dir, f"Contrato_{i}") for i in range(1, 13)]

    # Crear sesiones exitosas
    sessions = [create_mock_successful_session("excel_001", "excel", excel_file)]
    sessions.extend(
        [
            create_mock_successful_session(
                f"contract_{i:03d}",
                "contract",
                contract_files[i - 1],
                {"contract_name": f"Banco N°{i}", "page": "1", "row": str(i)},
            )
            for i in range(1, 13)
        ]
    )

    # Crear tracker mock
    tracker = DownloadTracker(test_dir, log_func)
    tracker.completed_sessions = sessions

    # Validar
    validator = PostExecutionValidator(log_func)
    report = validator.validate_complete_download(tracker, test_dir)

    # Verificar resultado
    print("\n📊 RESULTADO:")
    print(f"   Total descargados: {report.total_downloaded}/13")
    print(f"   Excel principal: {'✅' if report.excel_principal_found else '❌'}")
    print(f"   Contratos: {report.contratos_found}/12")
    print(f"   ¿Puede proceder?: {'✅' if report.can_proceed_to_stage2 else '❌'}")
    print(f"   Recomendación: {report.recommendation}")

    return report.is_complete


def test_scenario_missing_excel():
    """🚨 Escenario 2: Excel principal faltante (CRÍTICO)"""
    print("\n" + "=" * 60)
    print("🚨 TEST 2: EXCEL PRINCIPAL FALTANTE (CRÍTICO)")
    print("=" * 60)

    log_func = create_mock_log_func()
    test_dir = create_test_download_dir()

    # Solo crear contratos, NO Excel
    contract_files = [create_mock_contract_file(test_dir, f"Contrato_{i}") for i in range(1, 13)]

    # Crear sesiones - Excel fallida, contratos exitosos
    sessions = [create_mock_failed_session("excel_001", "excel", {}, "timeout")]
    sessions.extend(
        [
            create_mock_successful_session(
                f"contract_{i:03d}",
                "contract",
                contract_files[i - 1],
                {"contract_name": f"Banco N°{i}", "page": "1", "row": str(i)},
            )
            for i in range(1, 13)
        ]
    )

    tracker = DownloadTracker(test_dir, log_func)
    tracker.completed_sessions = sessions

    # Validar y decidir recovery
    validator = PostExecutionValidator(log_func)
    report = validator.validate_complete_download(tracker, test_dir)

    decision_engine = RecoveryDecisionEngine(log_func)
    recovery_plan = decision_engine.decide_recovery_strategy(report)

    print("\n📊 RESULTADO:")
    print(f"   Excel principal: {'✅' if report.excel_principal_found else '❌'}")
    print(f"   Es fallo crítico: {'✅' if report.is_critical_failure else '❌'}")
    print(f"   Estrategia de recovery: {recovery_plan.strategy_name}")
    print(f"   Descripción: {recovery_plan.description}")
    print(f"   Tiempo estimado: {recovery_plan.estimated_time_minutes} min")

    return recovery_plan.strategy_name == "critical_excel_recovery"


def test_scenario_few_contracts_missing():
    """⚠️ Escenario 3: Pocos contratos faltantes (reintento selectivo)"""
    print("\n" + "=" * 60)
    print("⚠️ TEST 3: POCOS CONTRATOS FALTANTES (3/12)")
    print("=" * 60)

    log_func = create_mock_log_func()
    test_dir = create_test_download_dir()

    # Excel + 9 contratos exitosos, 3 fallidos
    excel_file = create_mock_excel_file(test_dir)
    contract_files = [create_mock_contract_file(test_dir, f"Contrato_{i}") for i in range(1, 10)]

    sessions = [create_mock_successful_session("excel_001", "excel", excel_file)]

    # 9 contratos exitosos
    sessions.extend(
        [
            create_mock_successful_session(
                f"contract_{i:03d}",
                "contract",
                contract_files[i - 1],
                {"contract_name": f"Banco Exitoso N°{i}", "page": "1", "row": str(i)},
            )
            for i in range(1, 10)
        ]
    )

    # 3 contratos fallidos
    sessions.extend(
        [
            create_mock_failed_session(
                f"contract_fail_{i:03d}",
                "contract",
                {"contract_name": f"Banco Fallido N°{i}", "page": "2", "row": str(i)},
                "click_failed",
            )
            for i in range(10, 13)
        ]
    )

    tracker = DownloadTracker(test_dir, log_func)
    tracker.completed_sessions = sessions

    validator = PostExecutionValidator(log_func)
    report = validator.validate_complete_download(tracker, test_dir)

    decision_engine = RecoveryDecisionEngine(log_func)
    recovery_plan = decision_engine.decide_recovery_strategy(report)

    print("\n📊 RESULTADO:")
    print(f"   Total descargados: {report.total_downloaded}/13")
    print(f"   Archivos faltantes: {report.missing_count}")
    print(f"   ¿Puede proceder?: {'✅' if report.can_proceed_to_stage2 else '❌'}")
    print(f"   Estrategia: {recovery_plan.strategy_name}")
    print(f"   Descripción: {recovery_plan.description}")

    print("\n📋 ARCHIVOS FALTANTES ESPECÍFICOS:")
    for detail in report.missing_details:
        if detail["type"] == "contrato":
            page = detail.get("page", "?")
            row = detail.get("row", "?")
            print(f"   - {detail['name']} (Página {page}, Fila {row}) - {detail['reason']}")

    return recovery_plan.strategy_name == "selective_retry" and report.can_proceed_to_stage2


def test_scenario_partial_continuation():
    """⚠️ Escenario 4: Continuación parcial (Excel + 8 contratos)"""
    print("\n" + "=" * 60)
    print("⚠️ TEST 4: CONTINUACIÓN PARCIAL (Excel + 8/12 contratos)")
    print("=" * 60)

    log_func = create_mock_log_func()
    test_dir = create_test_download_dir()

    # Excel + solo 8 contratos
    excel_file = create_mock_excel_file(test_dir)
    contract_files = [create_mock_contract_file(test_dir, f"Contrato_{i}") for i in range(1, 9)]

    sessions = [create_mock_successful_session("excel_001", "excel", excel_file)]
    sessions.extend(
        [
            create_mock_successful_session(
                f"contract_{i:03d}",
                "contract",
                contract_files[i - 1],
                {"contract_name": f"Banco N°{i}", "page": "1", "row": str(i)},
            )
            for i in range(1, 9)
        ]
    )

    tracker = DownloadTracker(test_dir, log_func)
    tracker.completed_sessions = sessions

    validator = PostExecutionValidator(log_func)
    report = validator.validate_complete_download(tracker, test_dir)

    decision_engine = RecoveryDecisionEngine(log_func)
    recovery_plan = decision_engine.decide_recovery_strategy(report)

    print("\n📊 RESULTADO:")
    print(f"   Excel principal: {'✅' if report.excel_principal_found else '❌'}")
    print(f"   Contratos: {report.contratos_found} (mínimo necesario: 8)")
    print(f"   ¿Puede proceder parcialmente?: {'✅' if report.can_proceed_to_stage2 else '❌'}")
    print(f"   Estrategia: {recovery_plan.strategy_name}")
    print(f"   ¿Permite continuación?: {'✅' if recovery_plan.can_proceed_partial else '❌'}")

    return report.can_proceed_to_stage2 and recovery_plan.can_proceed_partial


def test_scenario_complete_failure():
    """❌ Escenario 5: Fallo completo (pocos archivos)"""
    print("\n" + "=" * 60)
    print("❌ TEST 5: FALLO COMPLETO (solo 3 archivos)")
    print("=" * 60)

    log_func = create_mock_log_func()
    test_dir = create_test_download_dir()

    # Solo 3 contratos, sin Excel
    contract_files = [create_mock_contract_file(test_dir, f"Contrato_{i}") for i in range(1, 4)]

    sessions = [create_mock_failed_session("excel_001", "excel", {}, "network_error")]
    sessions.extend(
        [
            create_mock_successful_session(
                f"contract_{i:03d}",
                "contract",
                contract_files[i - 1],
                {"contract_name": f"Banco N°{i}", "page": "1", "row": str(i)},
            )
            for i in range(1, 4)
        ]
    )

    tracker = DownloadTracker(test_dir, log_func)
    tracker.completed_sessions = sessions

    validator = PostExecutionValidator(log_func)
    report = validator.validate_complete_download(tracker, test_dir)

    decision_engine = RecoveryDecisionEngine(log_func)
    recovery_plan = decision_engine.decide_recovery_strategy(report)

    print("\n📊 RESULTADO:")
    print(f"   Total descargados: {report.total_downloaded}/13")
    print(f"   Tasa de éxito: {report.success_rate:.1f}%")
    print(f"   ¿Puede proceder?: {'✅' if report.can_proceed_to_stage2 else '❌'}")
    print(f"   Estrategia: {recovery_plan.strategy_name}")
    print(
        f"   ¿Requiere intervención?: {'✅' if recovery_plan.user_intervention_required else '❌'}"
    )

    return not report.can_proceed_to_stage2 and recovery_plan.user_intervention_required


def demo_recovery_decision_matrix():
    """📊 Demostración de matriz de decisiones de recovery"""
    print("\n" + "=" * 60)
    print("📊 DEMO: MATRIZ DE DECISIONES DE RECOVERY")
    print("=" * 60)

    scenarios = [
        {"excel": True, "contratos": 12, "desc": "Perfecto (13/13)"},
        {"excel": True, "contratos": 10, "desc": "Muy bueno (11/13)"},
        {"excel": True, "contratos": 8, "desc": "Aceptable (9/13)"},
        {"excel": True, "contratos": 5, "desc": "Parcial limitado (6/13)"},
        {"excel": True, "contratos": 2, "desc": "Muy parcial (3/13)"},
        {"excel": False, "contratos": 12, "desc": "Sin Excel (12/13)"},
        {"excel": False, "contratos": 8, "desc": "Sin Excel parcial (8/13)"},
        {"excel": False, "contratos": 2, "desc": "Fallo masivo (2/13)"},
    ]

    print(f"{'Escenario':<20} {'Excel':<6} {'Contratos':<9} {'¿Procede?':<9} {'Estrategia':<20}")
    print("-" * 70)

    log_func = create_mock_log_func()
    decision_engine = RecoveryDecisionEngine(log_func)

    for scenario in scenarios:
        # Simular reporte básico
        from automation.MtM.post_execution_validator import ValidationReport

        total_downloaded = (1 if scenario["excel"] else 0) + scenario["contratos"]
        missing_count = 13 - total_downloaded

        report = ValidationReport(
            total_expected=13,
            total_downloaded=total_downloaded,
            missing_count=missing_count,
            excel_principal_found=scenario["excel"],
            contratos_found=scenario["contratos"],
            can_proceed_to_stage2=scenario["excel"] and scenario["contratos"] >= 8,
            recommendation="",
        )

        recovery_plan = decision_engine.decide_recovery_strategy(report)

        can_proceed = "✅" if report.can_proceed_to_stage2 else "❌"

        print(
            f"{scenario['desc']:<20} {'✅' if scenario['excel'] else '❌':<6} "
            f"{scenario['contratos']:<9} {can_proceed:<9} {recovery_plan.strategy_name:<20}"
        )


def cleanup_test_files():
    """Limpia archivos de test"""
    import shutil

    test_dir = Path("./test_downloads")
    if test_dir.exists():
        shutil.rmtree(test_dir)


def main():
    """Ejecuta todos los tests del sistema de validación y recovery"""

    print("🧪 SISTEMA DE TESTS - VALIDACIÓN Y RECOVERY POST-EJECUCIÓN")
    print("=" * 70)
    print("Simulando diferentes escenarios de descarga y validando")
    print("cómo el sistema de recovery maneja cada situación.")
    print("=" * 70)

    try:
        # Ejecutar tests
        results = []

        print("\n🎯 EJECUTANDO TESTS DE ESCENARIOS...")

        results.append(("Descarga Perfecta", test_scenario_perfect_download()))
        results.append(("Excel Faltante (Crítico)", test_scenario_missing_excel()))
        results.append(("Pocos Contratos Faltantes", test_scenario_few_contracts_missing()))
        results.append(("Continuación Parcial", test_scenario_partial_continuation()))
        results.append(("Fallo Completo", test_scenario_complete_failure()))

        # Demostración adicional
        demo_recovery_decision_matrix()

        # Resumen de resultados
        print("\n" + "=" * 60)
        print("📋 RESUMEN DE TESTS")
        print("=" * 60)

        passed = 0
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"   {test_name:<30} {status}")
            if result:
                passed += 1

        print(f"\n📊 RESULTADO FINAL: {passed}/{len(results)} tests pasaron")

        if passed == len(results):
            print("🎉 ¡TODOS LOS TESTS EXITOSOS!")
            print("✅ El sistema de validación y recovery está funcionando correctamente")
            print("✅ Maneja todos los escenarios de fallo esperados")
            print("✅ Toma decisiones inteligentes de recovery")
            print("✅ Informa claramente al usuario sobre el estado")
        else:
            print("⚠️ Algunos tests fallaron - revisar implementación")

        # Demostración de integración
        print("\n" + "=" * 60)
        print("🎯 INTEGRACIÓN CON EL SISTEMA PRINCIPAL")
        print("=" * 60)
        print("El sistema está integrado en web_automator.py y se ejecuta automáticamente")
        print("al final de cada proceso de descarga. Proporciona:")
        print("   ✅ Validación automática de los 13 archivos esperados")
        print("   ✅ Identificación específica de archivos faltantes")
        print("   ✅ Estrategias de recovery automáticas e inteligentes")
        print("   ✅ Decisión de si se puede proceder a la Etapa 2")
        print("   ✅ Feedback claro al usuario sobre el estado")

    finally:
        # Limpiar archivos de test
        cleanup_test_files()
        print("\n🧹 Archivos de test limpiados")


if __name__ == "__main__":
    main()
