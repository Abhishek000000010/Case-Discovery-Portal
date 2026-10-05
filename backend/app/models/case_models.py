from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from backend.app.models.entity_models import PersonEntity, LocationEntity, VehicleEntity, ObjectEntity


class CasePersonRef(BaseModel):
    person_id: str
    role: str = "involved"


class CaseLocationRef(BaseModel):
    location_id: str
    role: str = "scene"


class CaseVehicleRef(BaseModel):
    vehicle_id: str
    role: str = "associated"


class CaseObjectRef(BaseModel):
    object_id: str
    role: str = "evidence_or_target"


class CaseEvent(BaseModel):
    event_id: str
    type: str
    person_id: Optional[str] = None
    location_id: Optional[str] = None
    timestamp: Optional[str] = None
    description: Optional[str] = None


class CaseWitness(BaseModel):
    person_id: str
    statement_id: Optional[str] = None
    role: str = "witness"


class CaseEvidence(BaseModel):
    evidence_id: str
    type: str
    description: Optional[str] = None


class CaseSourceDocument(BaseModel):
    document_id: str
    type: str = "synthetic_case_report"


class CaseModel(BaseModel):
    case_id: str
    case_type: str
    status: str
    reported_date: Optional[str] = None
    incident_date: Optional[str] = None
    incident_time_range: Optional[str] = None
    severity: str = "medium"
    summary: str
    people_involved: List[CasePersonRef] = Field(default_factory=list)
    locations: List[CaseLocationRef] = Field(default_factory=list)
    vehicles: List[CaseVehicleRef] = Field(default_factory=list)
    objects: List[CaseObjectRef] = Field(default_factory=list)
    events: List[CaseEvent] = Field(default_factory=list)
    modus_operandi: List[str] = Field(default_factory=list)
    witnesses: List[CaseWitness] = Field(default_factory=list)
    evidence: List[CaseEvidence] = Field(default_factory=list)
    source_documents: List[CaseSourceDocument] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)


class EnrichedPerson(BaseModel):
    person: PersonEntity
    role: str


class EnrichedLocation(BaseModel):
    location: LocationEntity
    role: str


class EnrichedVehicle(BaseModel):
    vehicle: VehicleEntity
    role: str


class EnrichedObject(BaseModel):
    object: ObjectEntity
    role: str


class CaseDetailResponse(BaseModel):
    case: CaseModel
    enriched_people: List[EnrichedPerson] = Field(default_factory=list)
    enriched_locations: List[EnrichedLocation] = Field(default_factory=list)
    enriched_vehicles: List[EnrichedVehicle] = Field(default_factory=list)
    enriched_objects: List[EnrichedObject] = Field(default_factory=list)
    related_cases_count: int = 0
