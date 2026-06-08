"""PSYKE endpoints: search + element creation/lookup (PSYKE Small)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.schemas.psyke import (
    PsykeElementCreate,
    PsykeElementResponse,
    PsykeSearchResponse,
)
from app.services.psyke_service import psyke_service

router = APIRouter(prefix="/psyke", tags=["psyke"])


@router.get("/search", response_model=PsykeSearchResponse)
def psyke_search(
    q: str = Query("", description="Search over PSYKE name, type, description, notes, aliases"),
) -> PsykeSearchResponse:
    return PsykeSearchResponse(query=q, results=psyke_service.search(q))


@router.post("/elements", response_model=PsykeElementResponse)
def psyke_create_element(payload: PsykeElementCreate) -> PsykeElementResponse:
    return PsykeElementResponse(ok=True, element=psyke_service.create(payload))


@router.get("/elements/{element_id}", response_model=PsykeElementResponse)
def psyke_get_element(element_id: str) -> PsykeElementResponse:
    element = psyke_service.get(element_id)
    if element is None:
        raise HTTPException(status_code=404, detail="PSYKE element not found")
    return PsykeElementResponse(ok=True, element=element)
