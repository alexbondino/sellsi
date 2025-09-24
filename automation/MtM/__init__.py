"""MtM automation package public API.

Expose main classes for convenient imports, e.g.:
from automation.MtM import BrowserManager, FileDownloader
"""

from .browser_manager import BrowserManager  # noqa: F401
from .downloader import FileDownloader  # noqa: F401
from .download_tracker import (
    DownloadTracker,
    DownloadSession,
    DownloadResult,
    DownloadConfig,
)  # noqa: F401
from .element_finder import ElementFinder  # noqa: F401
from .navigation_handler import NavigationHandler  # noqa: F401
from .ui_controller import UIController  # noqa: F401

__all__ = [
    "BrowserManager",
    "FileDownloader",
    "DownloadTracker",
    "DownloadSession",
    "DownloadResult",
    "DownloadConfig",
    "ElementFinder",
    "NavigationHandler",
    "UIController",
]
