from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from backend.app.models.relationship_models import RelationshipScoreBreakdown


class GraphNode(BaseModel):
    id: str
    type: str  # CASE, CITY, CRIME, CRIME_DOMAIN, WEAPON
    label: str
    properties: Dict[str, Any] = Field(default_factory=dict)


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship_type: str
    relationship_type_label: str = ""
    edge_label: str = ""
    confidence: float = 1.0
    category: str = "DIRECT"
    evidence: List[str] = Field(default_factory=list)
    score_breakdown: Optional[RelationshipScoreBreakdown] = None


class GraphData(BaseModel):
    nodes: List[GraphNode] = Field(default_factory=list)
    edges: List[GraphEdge] = Field(default_factory=list)
