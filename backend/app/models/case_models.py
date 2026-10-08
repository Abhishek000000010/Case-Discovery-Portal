from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class SourceInfo(BaseModel):
    dataset: str = "Indian Crimes Dataset"
    source_file: str = "crime_dataset_india.csv"
    source_report_number: int
    data_type: str = "public_dataset_record"


class IncidentInfo(BaseModel):
    crime_code: int
    crime_description: str
    crime_domain: str
    date_of_occurrence: Optional[str] = None
    date_reported: Optional[str] = None
    time_of_occurrence: Optional[str] = None


class LocationInfo(BaseModel):
    city: str


class VictimInfo(BaseModel):
    age: Optional[int] = None
    age_band: Optional[str] = None
    gender: Optional[str] = None


class WeaponInfo(BaseModel):
    used: Optional[str] = None


class InvestigationInfo(BaseModel):
    police_deployed: Optional[int] = None
    case_closed: bool = False
    date_case_closed: Optional[str] = None
    closure_duration_days: Optional[float] = None


class DerivedFeatures(BaseModel):
    occurrence_year: Optional[int] = None
    occurrence_month: Optional[int] = None
    occurrence_month_name: Optional[str] = None
    occurrence_day_of_week: Optional[str] = None
    occurrence_hour: Optional[int] = None
    occurrence_minute: Optional[int] = None
    report_delay_hours: Optional[float] = None
    semantic_text: Optional[str] = None
    city_key: Optional[str] = None
    crime_key: Optional[str] = None
    crime_domain_key: Optional[str] = None
    weapon_key: Optional[str] = None


class GraphEntities(BaseModel):
    case_node: str
    city_node: Optional[str] = None
    crime_node: Optional[str] = None
    domain_node: Optional[str] = None
    weapon_node: Optional[str] = None


class CaseModel(BaseModel):
    case_id: str
    source: SourceInfo
    incident: IncidentInfo
    location: LocationInfo
    victim: VictimInfo
    weapon: WeaponInfo = Field(default_factory=WeaponInfo)
    investigation: InvestigationInfo
    derived_features: DerivedFeatures = Field(default_factory=DerivedFeatures)
    graph_entities: GraphEntities
    tags: List[str] = Field(default_factory=list)

    @property
    def case_type(self) -> str:
        return self.incident.crime_description

    @property
    def status(self) -> str:
        return "Closed" if self.investigation.case_closed else "Open"

    @property
    def city(self) -> str:
        return self.location.city

    @property
    def incident_date(self) -> Optional[str]:
        return self.incident.date_of_occurrence or self.incident.time_of_occurrence or self.incident.date_reported

    @property
    def reported_date(self) -> Optional[str]:
        return self.incident.date_reported


class CaseDetailResponse(BaseModel):
    case: CaseModel
    dimension_info: Dict[str, Any] = Field(default_factory=dict)
    related_cases_count: int = 0
