export interface RelationshipScoreBreakdown {
  same_city: number;
  crime_code_match: number;
  crime_description_match: number;
  crime_domain_match: number;
  weapon_match: number;
  temporal_proximity: number;
  time_of_day_proximity: number;
  victim_profile_similarity: number;
  semantic_similarity: number;
  compound_boost: number;
  rarity_adjustment: number;
}

export interface RelationshipFeatures {
  same_city?: boolean;
  crime_code_match?: boolean;
  crime_description_match?: boolean;
  crime_domain_match?: boolean;
  weapon_match?: boolean;
  incident_date_difference_days?: number | null;
  temporal_similarity?: number;
  hour_difference?: number | null;
  time_of_day_similarity?: number;
  same_day_of_week?: boolean;
  victim_age_difference?: number | null;
  victim_age_band_match?: boolean;
  victim_gender_match?: boolean;
  victim_profile_similarity?: number;
  semantic_similarity?: number;
  rarity_multiplier?: number;
  compound_score_boost?: number;
}

export interface RelationshipSignal {
  signal_name: string;
  label: string;
  case_a_value: any;
  case_b_value: any;
  raw_similarity: number;
  weight: number;
  weighted_contribution: number;
  result: 'supporting' | 'weakening' | 'neutral';
  explanation: string;
}

export interface CaseComparisonRow {
  field_name: string;
  label: string;
  case_a_value: any;
  case_b_value: any;
  match_status: 'match' | 'different' | 'close' | 'partial' | 'n/a' | string;
  note?: string | null;
}

export interface RelationshipExplanationDetail {
  type: string;
  confidence: number;
  classification: 'VERY HIGH' | 'HIGH' | 'MODERATE' | 'WEAK' | 'NOT SURFACED' | string;
}

export interface RelationshipExplanationResponse {
  source_case_id: string;
  target_case_id: string;
  source_case: Record<string, any>;
  target_case: Record<string, any>;
  relationship: RelationshipExplanationDetail;
  summary: string;
  supporting_signals: RelationshipSignal[];
  weakening_signals: RelationshipSignal[];
  neutral_signals: RelationshipSignal[];
  score_breakdown: Record<string, any>;
  comparison: Record<string, CaseComparisonRow>;
  path: string[];
  edge_label?: string;
}

export interface RelationshipExplanation {
  relationship_id?: string;
  source_case: string;
  target_case: string;
  relationship_type: string;
  relationship_type_label?: string;
  edge_label?: string;
  primary_relationship_type?: string;
  supporting_signals?: string[];
  confidence: number;
  category: 'VERY HIGH' | 'HIGH' | 'MODERATE' | 'WEAK' | string;
  score_breakdown: RelationshipScoreBreakdown;
  evidence: string[];
  features?: RelationshipFeatures;
  matching_attributes?: Record<string, any>;
  differing_attributes?: Record<string, any>;
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

export interface CasePattern {
  pattern_id: string;
  name: string;
  crime_description: string;
  city: string;
  weapon?: string | null;
  time_window: string;
  case_count: number;
  case_ids: string[];
  confidence: number;
  description: string;
}

export interface CaseCluster {
  cluster_id: string;
  name: string;
  dominant_crime_type: string;
  case_count: number;
  case_ids: string[];
  city: string;
  weapon?: string | null;
  time_period: string;
  narrative_summary: string;
}

export interface AnomalyItem {
  anomaly_id: string;
  case_id: string;
  anomaly_type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  score: number;
  reason: string;
  city?: string;
  crime?: string;
  details?: Record<string, any>;
}
