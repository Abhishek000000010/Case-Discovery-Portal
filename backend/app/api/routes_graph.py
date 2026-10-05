from typing import Optional, Set
from fastapi import APIRouter, Query
from backend.app.models.graph_models import GraphData
from backend.app.state import app_state

router = APIRouter(prefix="/api/graph", tags=["Knowledge Graph"])


@router.get("", response_model=GraphData)
def query_graph(
    center_id: Optional[str] = Query(None, description="Center node ID (Case, Person, Location, etc.)"),
    depth: int = Query(1, ge=1, le=2),
    min_confidence: float = Query(0.40, ge=0.0, le=1.0),
    node_types: Optional[str] = Query(None, description="Comma-separated node types: CASE,PERSON,LOCATION,VEHICLE,OBJECT,EVENT"),
    rel_types: Optional[str] = Query(None, description="Comma-separated relationship types"),
):
    # Default to first case if not specified
    if not center_id:
        if app_state.cases:
            center_id = app_state.cases[0].case_id
        else:
            return GraphData(nodes=[], edges=[])

    allowed_nodes: Optional[Set[str]] = None
    if node_types:
        allowed_nodes = {t.strip().upper() for t in node_types.split(",") if t.strip()}

    allowed_rels: Optional[Set[str]] = None
    if rel_types:
        allowed_rels = {r.strip() for r in rel_types.split(",") if r.strip()}

    return app_state.graph_service.get_focused_subgraph(
        center_node_id=center_id,
        depth=depth,
        min_confidence=min_confidence,
        allowed_node_types=allowed_nodes,
        allowed_rel_types=allowed_rels
    )
