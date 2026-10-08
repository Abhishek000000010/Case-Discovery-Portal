from typing import Optional
from fastapi import APIRouter, Query
from backend.app.models.graph_models import GraphData
from backend.app.state import app_state

router = APIRouter(prefix="/api/graph", tags=["Knowledge Graph"])


@router.get("", response_model=GraphData)
def query_graph(
    center_id: Optional[str] = Query(None, description="Center node ID (Case ID or Entity ID)"),
    max_related: int = Query(10, ge=1, le=50),
    min_confidence: float = Query(0.35, ge=0.0, le=1.0),
):
    if not app_state.cases:
        return GraphData(nodes=[], edges=[])

    case_id = center_id
    if not case_id or case_id not in app_state.case_map:
        case_id = app_state.cases[0].case_id

    related = app_state.engine.get_related_cases(case_id, min_confidence=min_confidence, limit=max_related)
    return app_state.graph_service.get_case_ego_graph(case_id, related, max_related=max_related)
