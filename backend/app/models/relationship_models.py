from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class RelationshipFeatures(BaseModel):
    """
    Structured feature vector capturing all empirical comparison metrics
    between two crime incident records.
    """
    same_city: bool = False
    crime_code_match: bool = False
    crime_description_match: bool = False
    crime_domain_match: bool = False
    weapon_match: bool = False

    incident_date_difference_days: Optional[int] = None
    temporal_similarity: float = 0.0

    hour_difference: Optional[int] = None
    time_of_day_similarity: float = 0.0
    same_day_of_week: bool = False

    victim_age_difference: Optional[int] = None
    victim_age_band_match: bool = False
    victim_gender_match: bool = False
    victim_profile_similarity: float = 0.0

    semantic_similarity: float = 0.0
    rarity_multiplier: float = 1.0
    compound_score_boost: float = 0.0


class RelationshipScoreBreakdown(BaseModel):
    same_city: float = 0.0
    crime_code_match: float = 0.0
    crime_description_match: float = 0.0
    crime_domain_match: float = 0.0
    weapon_match: float = 0.0
    temporal_proximity: float = 0.0
    time_of_day_proximity: float = 0.0
    victim_profile_similarity: float = 0.0
    semantic_similarity: float = 0.0
    compound_boost: float = 0.0
    rarity_adjustment: float = 0.0


class RelationshipSignal(BaseModel):
    """
    Individual evidence signal comparing two crime incident records.
    """
    signal_name: str
    label: str
    case_a_value: Any
    case_b_value: Any
    raw_similarity: float
    weight: float
    weighted_contribution: float
    result: str  # "supporting" | "weakening" | "neutral"
    explanation: str


class CaseComparisonRow(BaseModel):
    """
    Side-by-side factual comparison row for display in investigation drawer.
    """
    field_name: str
    label: str
    case_a_value: Any
    case_b_value: Any
    match_status: str  # "match" | "different" | "close" | "partial" | "n/a"
    note: Optional[str] = None


class RelationshipExplanationDetail(BaseModel):
    type: str  # e.g. "SHARED LOCATION + CRIME"
    confidence: float
    classification: str  # "VERY HIGH" | "HIGH" | "MODERATE" | "WEAK" | "NOT SURFACED"


class RelationshipExplanationResponse(BaseModel):
    """
    Complete explainable investigation payload for pair of cases.
    """
    source_case_id: str
    target_case_id: str
    source_case: Dict[str, Any]
    target_case: Dict[str, Any]
    relationship: RelationshipExplanationDetail
    summary: str
    supporting_signals: List[RelationshipSignal] = Field(default_factory=list)
    weakening_signals: List[RelationshipSignal] = Field(default_factory=list)
    neutral_signals: List[RelationshipSignal] = Field(default_factory=list)
    score_breakdown: Dict[str, Any] = Field(default_factory=dict)
    comparison: Dict[str, CaseComparisonRow] = Field(default_factory=dict)
    path: List[str] = Field(default_factory=list)
    edge_label: str = ""


class RelationshipExplanation(BaseModel):
    relationship_id: Optional[str] = None
    source_case: str
    target_case: str
    relationship_type: str = "similar_incident_profile"
    relationship_type_label: str = "SIMILAR INCIDENT PROFILE"
    edge_label: str = ""
    primary_relationship_type: Optional[str] = "similar_incident_profile"
    supporting_signals: List[str] = Field(default_factory=list)
    confidence: float
    category: str = "MODERATE"  # VERY HIGH, HIGH, MODERATE, WEAK
    score_breakdown: RelationshipScoreBreakdown = Field(default_factory=RelationshipScoreBreakdown)
    evidence: List[str] = Field(default_factory=list)
    features: Optional[RelationshipFeatures] = None
    matching_attributes: Dict[str, Any] = Field(default_factory=dict)
    differing_attributes: Dict[str, Any] = Field(default_factory=dict)


class CandidatePair(BaseModel):
    case_a_id: str
    case_b_id: str
    candidate_reasons: List[str] = Field(default_factory=list)


class RelationshipDebugResponse(BaseModel):
    case_a_id: str
    case_b_id: str
    candidate_reasons: List[str] = Field(default_factory=list)
    features: RelationshipFeatures
    weights: Dict[str, float]
    score_breakdown: Dict[str, float]
    final_score: float
    threshold: float
    decision: str
    explanation: List[str] = Field(default_factory=list)


class CasePattern(BaseModel):
    pattern_id: str
    name: str
    crime_description: str
    city: str
    weapon: Optional[str] = None
    time_window: str
    case_count: int
    case_ids: List[str] = Field(default_factory=list)
    confidence: float
    description: str


class CaseCluster(BaseModel):
    cluster_id: str
    name: str
    dominant_crime_type: str
    case_count: int
    case_ids: List[str] = Field(default_factory=list)
    city: str
    weapon: Optional[str] = None
    time_period: str
    narrative_summary: str


class AnomalyItem(BaseModel):
    anomaly_id: str
    case_id: str
    anomaly_type: str
    severity: str  # HIGH, MEDIUM, LOW
    score: float
    reason: str
    details: Dict[str, Any] = Field(default_factory=dict)
