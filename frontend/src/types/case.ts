export interface SourceInfo {
  dataset: string;
  source_file: string;
  source_report_number: number;
  data_type: string;
}

export interface IncidentInfo {
  crime_code: number;
  crime_description: string;
  crime_domain: string;
  date_of_occurrence?: string | null;
  date_reported?: string | null;
  time_of_occurrence?: string | null;
}

export interface LocationInfo {
  city: string;
}

export interface VictimInfo {
  age?: number | null;
  age_band?: string | null;
  gender?: string | null;
}

export interface WeaponInfo {
  used?: string | null;
}

export interface InvestigationInfo {
  police_deployed?: number | null;
  case_closed: boolean;
  date_case_closed?: string | null;
  closure_duration_days?: number | null;
}

export interface DerivedFeatures {
  occurrence_year?: number | null;
  occurrence_month?: number | null;
  occurrence_month_name?: string | null;
  occurrence_day_of_week?: string | null;
  occurrence_hour?: number | null;
  occurrence_minute?: number | null;
  report_delay_hours?: number | null;
  semantic_text?: string | null;
  city_key?: string | null;
  crime_key?: string | null;
  crime_domain_key?: string | null;
  weapon_key?: string | null;
}

export interface GraphEntities {
  case_node: string;
  city_node?: string | null;
  crime_node?: string | null;
  domain_node?: string | null;
  weapon_node?: string | null;
}

export interface CaseModel {
  case_id: string;
  source: SourceInfo;
  incident: IncidentInfo;
  location: LocationInfo;
  victim: VictimInfo;
  weapon: WeaponInfo;
  investigation: InvestigationInfo;
  derived_features: DerivedFeatures;
  graph_entities: GraphEntities;
  tags: string[];

  // Convenience / mapped properties
  case_type?: string;
  status?: string;
  city?: string;
  incident_date?: string;
  reported_date?: string;
  related_cases_count?: number;
}

export interface CaseDetailResponse {
  case: CaseModel;
  dimension_info: Record<string, any>;
  related_cases_count: number;
}
