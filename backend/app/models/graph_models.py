from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from backend.app.models.relationship_models import RelationshipScoreBreakdown


class GraphNode(BaseModel):
    id: str
    type: str  # CASE, PERSON, LOCATION, VEHICLE, OBJECT, EVENT
    label: str
    properties: Dict[str, Any] = Field(default_factory=dict)


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship_type: str
    confidence: float = 1.0
    category: str = "DIRECT"  # DIRECT, STRONG, MODERATE, WEAK
    evidence: List[str] = Field(default_factory=list)
    score_breakdown: Optional[RelationshipScoreBreakdown] = None


class GraphData(BaseModel):
    nodes: List[GraphNode] = Field(default_factory=list)
    edges: List[GraphEdge] = Field(default_factory=list)
