from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class EntityCounts(BaseModel):
    persons: int = 0
    locations: int = 0
    weapons: int = 0
    vehicles: int = 0
    objects: int = 0
    events: int = 0
    evidence: int = 0


class IntelligenceCaseSummary(BaseModel):
    case_id: str
    crime_type: str
    status: str
    severity: str
    reported_date: Optional[str] = None
    incident_date: Optional[str] = None
    incident_time: Optional[str] = None
    police_station: Optional[str] = None
    investigating_unit: Optional[str] = None
    summary: Optional[str] = None
    location: Optional[str] = None
    counts: EntityCounts = Field(default_factory=EntityCounts)
    is_synthetic_demo: bool = True
    demo_disclaimer: str = "DEMO DATA: Synthetic case record for entity-level graph demonstration"


class CaseEntityNode(BaseModel):
    id: str
    type: str  # CASE, PERSON, LOCATION, WEAPON, VEHICLE, OBJECT, EVENT, EVIDENCE
    label: str
    sublabel: Optional[str] = None
    role: Optional[str] = None
    depth: int = 1
    properties: Dict[str, Any] = Field(default_factory=dict)


class CaseEntityEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship_type: str
    label: str
    relationship_mode: str  # explicit | derived
    explanation: str
    source_detail: Optional[str] = None
    properties: Dict[str, Any] = Field(default_factory=dict)


class TimelineEvent(BaseModel):
    event_id: str
    type: str
    timestamp: str
    time_display: str
    date_display: str
    title: str
    location_id: Optional[str] = None
    location_name: Optional[str] = None
    person_ids: List[str] = Field(default_factory=list)
    person_names: List[str] = Field(default_factory=list)
    weapon_id: Optional[str] = None
    weapon_name: Optional[str] = None
    vehicle_id: Optional[str] = None
    vehicle_registration: Optional[str] = None
    description: Optional[str] = None


class CaseIntelligenceGraphResponse(BaseModel):
    case: IntelligenceCaseSummary
    nodes: List[CaseEntityNode]
    edges: List[CaseEntityEdge]
    timeline: List[TimelineEvent]
