from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.models.intelligence_graph_models import (
    IntelligenceCaseSummary,
    CaseIntelligenceGraphResponse,
)
from backend.app.services.case_entity_graph_provider import intelligence_provider

router = APIRouter(prefix="/api/intelligence-cases", tags=["Case Intelligence Graph"])


@router.get("", response_model=List[IntelligenceCaseSummary])
def list_intelligence_cases():
    """
    List all synthetic demo cases available for entity-level Case Intelligence Graph exploration.
    Simulates output of future document-upload and entity-extraction pipeline.
    """
    return intelligence_provider.get_cases()


@router.get("/{case_id}/graph", response_model=CaseIntelligenceGraphResponse)
def get_case_intelligence_graph(
    case_id: str,
    depth: str = Query(
        "full",
        description="Graph depth: 'direct' (Level 1), 'two_levels', or 'full' (all connections & sequences)",
    ),
):
    """
    Fetch the entity-level graph, timeline, and node/edge metadata for a specific case.
    The selected case serves as the central root node connected to people, locations,
    weapons, vehicles, objects, events, and evidence.
    """
    res = intelligence_provider.get_case_graph(case_id, depth=depth)
    if not res:
        raise HTTPException(
            status_code=404,
            detail=f"Intelligence case '{case_id}' not found in synthetic demonstration dataset.",
        )
    return res
