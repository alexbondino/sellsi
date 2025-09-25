from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Optional, TypedDict


@dataclass
class FileInfo:
    path: Path
    size: int
    mtime: float

    @classmethod
    def from_path(cls, path: Path) -> "FileInfo":
        stat = path.stat()
        return cls(path=path, size=stat.st_size, mtime=stat.st_mtime)


@dataclass
class ValidationResult:
    passed: bool
    reason: Optional[str] = None
    details: Dict[str, str] = field(default_factory=dict)


@dataclass
class DownloadResult:
    file_info: FileInfo
    validation: ValidationResult
    fallback_used: bool = False


@dataclass
class DownloadSession:
    session_id: str
    download_type: str
    metadata: Dict[str, str]
    started_at: float
    pre_snapshot: Dict[Path, FileInfo]
    status: str = "pending"
    result: Optional[DownloadResult] = None
    attempts: int = 0
    created_at: datetime = field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None


class RuleConfig(TypedDict, total=False):
    extensions: List[str]
    magic: List[bytes]
    min_size: int


class DownloadConfig:
    def __init__(self) -> None:
        self.rules: Dict[str, RuleConfig] = {
            "excel": RuleConfig(
                extensions=[".xlsx", ".xls", ".xlsm"],
                magic=[b"PK\x03\x04"],  # ZIP header
                min_size=1024,
            ),
            "contract": RuleConfig(
                extensions=[".pdf", ".xlsx", ".zip"],
                magic=[b"%PDF", b"PK\x03\x04"],
                min_size=512,
            ),
        }
        self.poll_interval: float = 0.5
        self.timeout_seconds: int = 20
        self.report_filename: str = "mtm_download_report.json"

    def get_rule(self, download_type: str) -> RuleConfig:
        return self.rules.get(download_type, RuleConfig())  # empty config


class ContentValidator:
    def __init__(self, config: DownloadConfig) -> None:
        self.config = config

    def validate(self, file_info: FileInfo, download_type: str) -> ValidationResult:
        rule = self.config.get_rule(download_type)
        extension = file_info.path.suffix.lower()

        # Extensión
        allowed_ext = rule.get("extensions")
        if allowed_ext is not None and extension not in allowed_ext:
            return ValidationResult(False, reason="ext", details={"extension": extension})

        # Tamaño mínimo
        min_size = rule.get("min_size")
        if isinstance(min_size, int) and file_info.size < min_size:
            return ValidationResult(False, reason="size", details={"size": str(file_info.size)})

        # Magic bytes (lectura limitada)
        allowed_magic = rule.get("magic")
        if allowed_magic is not None and len(allowed_magic) > 0:
            try:
                with file_info.path.open("rb") as fh:
                    header = fh.read(max(len(m) for m in allowed_magic))
                if not any(header.startswith(magic) for magic in allowed_magic):
                    return ValidationResult(
                        False, reason="magic", details={"header": header[:8].hex()}
                    )
            except Exception as exc:  # pragma: no cover (I/O issues)
                return ValidationResult(False, reason="io", details={"error": str(exc)})

        return ValidationResult(True)


class FileSystemMonitor:
    def __init__(self, download_dir: Path) -> None:
        self.download_dir = download_dir

    def snapshot(self) -> Dict[Path, FileInfo]:
        files: Dict[Path, FileInfo] = {}
        if not self.download_dir.exists():
            return files
        for path in self.download_dir.glob("**/*"):
            if path.is_file():
                files[path] = FileInfo.from_path(path)
        return files

    def new_files(
        self, base: Dict[Path, FileInfo], current: Dict[Path, FileInfo], started_at: float
    ) -> List[FileInfo]:
        results: List[FileInfo] = []
        for path, info in current.items():
            if path.suffix.lower() in {".tmp", ".crdownload"}:
                continue
            base_info = base.get(path)
            if base_info is None and info.mtime >= started_at:
                results.append(info)
            elif base_info and info.mtime > base_info.mtime >= started_at:
                results.append(info)
        return results


class DownloadTracker:
    def __init__(
        self, download_dir: Path, log_func, config: Optional[DownloadConfig] = None
    ) -> None:
        self.download_dir = download_dir
        self.log = log_func
        self.config = config or DownloadConfig()
        self.validator = ContentValidator(self.config)
        self.monitor = FileSystemMonitor(download_dir)
        self.active_sessions: Dict[str, DownloadSession] = {}
        self.completed_sessions: List[DownloadSession] = []
        self._sequence = 0

    def begin(
        self, download_type: str, metadata: Optional[Dict[str, str]] = None
    ) -> Optional[DownloadSession]:
        if not self.download_dir.exists():
            try:
                self.download_dir.mkdir(parents=True, exist_ok=True)
            except Exception as exc:
                self.log(f"[Tracker] No se pudo crear carpeta de descargas: {exc}", level="ERROR")
                return None

        self._sequence += 1
        session_id = f"{datetime.utcnow():%Y%m%d_%H%M%S}_{self._sequence:03d}"
        session = DownloadSession(
            session_id=session_id,
            download_type=download_type,
            metadata=metadata or {},
            started_at=time.time(),
            pre_snapshot=self.monitor.snapshot(),
        )
        self.active_sessions[session_id] = session
        self.log(f"[Tracker] Sesión {session_id} iniciada ({download_type}).", level="DEBUG")
        return session

    def wait_for_file(
        self, session: DownloadSession, timeout: Optional[int] = None
    ) -> Optional[DownloadResult]:
        if not session:
            return None
        timeout = timeout or self.config.timeout_seconds
        deadline = time.time() + timeout
        last_snapshot = session.pre_snapshot

        while time.time() < deadline:
            current_snapshot = self.monitor.snapshot()
            new_files = self.monitor.new_files(last_snapshot, current_snapshot, session.started_at)
            if new_files:
                for file_info in new_files:
                    validation = self.validator.validate(file_info, session.download_type)
                    if validation.passed:
                        result = DownloadResult(file_info=file_info, validation=validation)
                        session.result = result
                        session.status = "success"
                        session.completed_at = datetime.utcnow()
                        self.active_sessions.pop(session.session_id, None)
                        self.completed_sessions.append(session)
                        self.log(
                            f"[Tracker] Sesión {session.session_id}: archivo {file_info.path.name} detectado.",
                            level="INFO",
                        )
                        return result
            last_snapshot = current_snapshot
            time.sleep(self.config.poll_interval)

        return None

    def mark_manual_file(
        self, session: Optional[DownloadSession], file_path: Path, fallback_used: bool = False
    ) -> None:
        if not session:
            return
        file_info = FileInfo.from_path(file_path)
        validation = self.validator.validate(file_info, session.download_type)
        result = DownloadResult(
            file_info=file_info, validation=validation, fallback_used=fallback_used
        )
        session.result = result
        session.status = "success" if validation.passed else "invalid"
        session.completed_at = datetime.utcnow()
        self.active_sessions.pop(session.session_id, None)
        self.completed_sessions.append(session)
        self.log(
            f"[Tracker] Sesión {session.session_id}: archivo manual {file_path.name} registrado.",
            level="DEBUG",
        )

    def fail(self, session: Optional[DownloadSession], reason: str) -> None:
        if not session:
            return
        session.status = "failed"
        session.metadata["failure_reason"] = reason
        session.completed_at = datetime.utcnow()
        self.active_sessions.pop(session.session_id, None)
        self.completed_sessions.append(session)
        self.log(
            f"[Tracker] Sesión {session.session_id} marcada como fallida ({reason}).", level="ERROR"
        )

    def export_report(self) -> Optional[Path]:
        if not self.completed_sessions:
            return None
        report = {
            "generated_at": datetime.utcnow().isoformat(),
            "download_dir": str(self.download_dir),
            "summary": self._build_summary(self.completed_sessions),
            "sessions": [self._session_to_dict(s) for s in self.completed_sessions],
        }
        report_path = self.download_dir / self.config.report_filename
        try:
            with report_path.open("w", encoding="utf-8") as fh:
                json.dump(report, fh, ensure_ascii=False, indent=2)
            self.log(f"[Tracker] Reporte de descargas guardado en {report_path}.", level="INFO")
            return report_path
        except Exception as exc:
            self.log(f"[Tracker] Error al escribir reporte: {exc}", level="ERROR")
            return None

    def get_completed_sessions(self) -> List[DownloadSession]:
        """Devuelve una copia de las sesiones completadas.

        Se expone para mantener encapsulado el listado interno y evitar que
        código externo lo modifique directamente.
        """
        return list(self.completed_sessions)

    def _build_summary(self, sessions: Iterable[DownloadSession]) -> Dict[str, int]:
        summary: Dict[str, int] = {"success": 0, "failed": 0, "invalid": 0}
        for session in sessions:
            summary[session.status] = summary.get(session.status, 0) + 1
        return summary

    def _session_to_dict(self, session: DownloadSession) -> Dict[str, object]:
        data: Dict[str, object] = {
            "session_id": session.session_id,
            "type": session.download_type,
            "status": session.status,
            "metadata": session.metadata,
            "started_at": session.created_at.isoformat(),
            "completed_at": session.completed_at.isoformat() if session.completed_at else None,
        }
        if session.result:
            data["file"] = {
                "path": str(session.result.file_info.path),
                "size": session.result.file_info.size,
                "mtime": session.result.file_info.mtime,
                "fallback_used": session.result.fallback_used,
            }
            if session.result.validation:
                data["validation"] = {
                    "passed": session.result.validation.passed,
                    "reason": session.result.validation.reason,
                    "details": session.result.validation.details,
                }
        return data


__all__ = ["DownloadTracker", "DownloadSession", "DownloadResult", "DownloadConfig"]
