from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class RelationshipFeatures(BaseModel):
    """
    Structured feature vector capturing all multi-dimensional comparison metrics
    between two crime cases. Accessible for scoring, explanation, and debugging.
    """
    person_overlap: float = 0.0
    vehicle_overlap: float = 0.0
    object_overlap: float = 0.0
    witness_overlap: float = 0.0

    location_exact_match: bool = False
    location_distance_km: Optional[float] = None
    location_similarity: float = 0.0

    incident_date_difference_days: Optional[int] = None
    temporal_similarity: float = 0.0

    crime_type_similarity: float = 0.0
    modus_operandi_similarity: float = 0.0
    mo_matching: List[str] = Field(default_factory=list)
    mo_differing_a: List[str] = Field(default_factory=list)
    mo_differing_b: List[str] = Field(default_factory=list)

    event_sequence_similarity: float = 0.0
    event_common_subsequence: List[str] = Field(default_factory=list)

    semantic_similarity: float = 0.0
    tag_overlap: float = 0.0
    evidence_similarity: float = 0.0

    # Rarity & quality indicators
    rarity_multiplier: float = 1.0
    direct_evidence_quality: float = 0.0


class RelationshipScoreBreakdown(BaseModel):
    person_overlap: float = 0.0
    vehicle_overlap: float = 0.0
    object_overlap: float = 0.0
    location_similarity: float = 0.0
    temporal_similarity: float = 0.0
    crime_type_similarity: float = 0.0
    modus_operandi_similarity: float = 0.0
    event_sequence_similarity: float = 0.0
    semantic_similarity: float = 0.0
    witness_overlap: float = 0.0
    tag_overlap: float = 0.0
    evidence_quality_boost: float = 0.0
    rarity_adjustment: float = 0.0


class RelationshipExplanation(BaseModel):
    relationship_id: Optional[str] = None
    source_case: str
    target_case: str
    relationship_type: str
    primary_relationship_type: Optional[str] = None
    supporting_signals: List[str] = Field(default_factory=list)
    confidence: float
    category: str  # VERY HIGH, HIGH, MODERATE, WEAK
    score_breakdown: RelationshipScoreBreakdown
    evidence: List[str] = Field(default_factory=list)
    features: Optional[RelationshipFeatures] = None
    mo_breakdown: Optional[Dict[str, Any]] = None
    sequence_breakdown: Optional[Dict[str, Any]] = None


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


class IndirectPath(BaseModel):
    path_id: str
    source_case: str
    target_case: str
    hops: int
    path_nodes: List[Dict[str, Any]] = Field(default_factory=list)
    path_edges: List[str] = Field(default_factory=list)
    relevance_score: float
    narrative: str


class NextSignal(BaseModel):
    signal_id: str
    case_id: str
    signal_type: str  # location_pattern, mo_transition, temporal_recurrence
    target_value: str
    confidence: float
    reason: str
    historical_support_cases: List[str] = Field(default_factory=list)


class CaseCluster(BaseModel):
    cluster_id: str
    name: str
    dominant_crime_type: str
    case_count: int
    case_ids: List[str] = Field(default_factory=list)
    common_mo: List[str] = Field(default_factory=list)
    locations: List[str] = Field(default_factory=list)
    time_period: str
    narrative_summary: str
