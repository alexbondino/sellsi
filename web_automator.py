"""Wrapper que reexporta la implementación principal de WebAutomator.

Este archivo existe solo para compatibilidad con imports antiguos:
from web_automator import WebAutomator

La implementación real está en automation.web_automator.
"""

from automation.web_automator import WebAutomator  # type: ignore F401

__all__ = ["WebAutomator"]
