"""Aggregate /api router.

Mounted under the ``/api`` prefix by ``app.main``. The health endpoint is
intentionally NOT included here — it lives at the root (``/health``).
"""

from fastapi import APIRouter

from app.api import logos, outline, psyke, version, whiteboard, writing_modes

api_router = APIRouter()
api_router.include_router(version.router)
api_router.include_router(whiteboard.router)
api_router.include_router(writing_modes.router)
api_router.include_router(outline.router)
api_router.include_router(psyke.router)
api_router.include_router(logos.router)

__all__ = ["api_router"]
