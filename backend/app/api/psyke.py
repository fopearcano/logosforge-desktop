"""PSYKE search endpoint (GET /api/psyke/search?q=)."""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas.psyke import PsykeSearchResponse
from app.services.psyke_service import psyke_service

router = APIRouter(prefix="/psyke", tags=["psyke"])


@router.get("/search", response_model=PsykeSearchResponse)
def psyke_search(
    q: str = Query("", description="Search query over PSYKE entry names and aliases"),
) -> PsykeSearchResponse:
    return PsykeSearchResponse(query=q, results=psyke_service.search(q))
