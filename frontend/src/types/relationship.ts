export interface RelationshipScoreBreakdown {
  person_overlap: number;
  vehicle_overlap: number;
  object_overlap: number;
  location_similarity: number;
  temporal_similarity: number;
  crime_type_similarity: number;
  modus_operandi_similarity: number;
  event_sequence_similarity: number;
  semantic_similarity: number;
  witness_overlap: number;
  tag_overlap: number;
}

export interface RelationshipFeatures {
  person_overlap?: number;
  vehicle_overlap?: number;
  object_overlap?: number;
  witness_overlap?: number;
  location_exact_match?: boolean;
  location_distance_km?: number | null;
  location_similarity?: number;
  incident_date_difference_days?: number | null;
  temporal_similarity?: number;
  crime_type_similarity?: number;
  modus_operandi_similarity?: number;
  mo_matching?: string[];
  mo_differing_a?: string[];
  mo_differing_b?: string[];
  event_sequence_similarity?: number;
  event_common_subsequence?: string[];
  semantic_similarity?: number;
  tag_overlap?: number;
  evidence_similarity?: number;
  rarity_multiplier?: number;
  direct_evidence_quality?: number;
}

export interface RelationshipExplanation {
  relationship_id?: string;
  source_case: string;
  target_case: string;
  relationship_type: string;
  primary_relationship_type?: string;
  supporting_signals?: string[];
  confidence: number;
  category: 'VERY HIGH' | 'HIGH' | 'MODERATE' | 'WEAK' | string;
  score_breakdown: RelationshipScoreBreakdown;
  evidence: string[];
  features?: RelationshipFeatures;
  mo_breakdown?: {
    matching?: string[];
    differing_a?: string[];
    differing_b?: string[];
    similarity?: number;
  };
  sequence_breakdown?: {
    lcs?: string[];
    similarity?: number;
    shared_transitions?: string[];
  };
}

export interface RelationshipDebugResponse {
  case_a_id: string;
  case_b_id: string;
  candidate_reasons: string[];
  features: RelationshipFeatures;
  weights: Record<string, number>;
  score_breakdown: Record<string, number>;
  final_score: number;
  threshold: number;
  decision: string;
  explanation: string[];
}

export interface IndirectPath {
  path_id: string;
  source_case: string;
  target_case: string;
  hops: number;
  path_nodes: Array<{
    id: string;
    label: string;
    type: string;
    subtitle?: string;
  }>;
  path_edges: string[];
  relevance_score: number;
  narrative: string;
}

export interface NextSignal {
  signal_id: string;
  case_id: string;
  signal_type: string;
  target_value: string;
  confidence: number;
  reason: string;
  historical_support_cases: string[];
}

export interface CaseCluster {
  cluster_id: string;
  name: string;
  dominant_crime_type: string;
  case_count: number;
  case_ids: string[];
  common_mo: string[];
  locations: string[];
  time_period: string;
  narrative_summary: string;
}

export interface CaseIntelligenceSummary {
  case_id: string;
  related_cases_count: number;
  high_confidence_count: number;
  very_high_confidence_count: number;
  recurring_entities_count: number;
  detected_patterns_count: number;
  potential_anomalies_count: number;
  most_significant_relationship?: {
    case_id: string;
    confidence: number;
    category: string;
    relationship_type: string;
    reason: string;
    supporting_signals?: string[];
  };
  ranked_relationships: Array<{
    case_id: string;
    score: number;
    category: string;
    relationship_type: string;
    reason: string;
    supporting_signals?: string[];
  }>;
}
