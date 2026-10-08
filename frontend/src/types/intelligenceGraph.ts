export type EntityType =
  | 'CASE'
  | 'PERSON'
  | 'LOCATION'
  | 'WEAPON'
  | 'VEHICLE'
  | 'OBJECT'
  | 'EVENT'
  | 'EVIDENCE';

export interface EntityCounts {
  persons: number;
  locations: number;
  weapons: number;
  vehicles: number;
  objects: number;
  events: number;
  evidence: number;
}

export interface IntelligenceCaseSummary {
  case_id: string;
  crime_type: string;
  status: string;
  severity: string;
  reported_date?: string | null;
  incident_date?: string | null;
  incident_time?: string | null;
  police_station?: string | null;
  investigating_unit?: string | null;
  summary?: string | null;
  location?: string | null;
  counts: EntityCounts;
  is_synthetic_demo: boolean;
  demo_disclaimer?: string;
}

export interface CaseEntityNode {
  id: string;
  type: EntityType;
  label: string;
  sublabel?: string | null;
  role?: string | null;
  depth: number;
  properties: Record<string, any>;
}

export interface CaseEntityEdge {
  id: string;
  source: string;
  target: string;
  relationship_type: string;
  label: string;
  relationship_mode: 'explicit' | 'derived';
  explanation: string;
  source_detail?: string | null;
  properties?: Record<string, any>;
}

export interface TimelineEvent {
  event_id: string;
  type: string;
  timestamp: string;
  time_display: string;
  date_display: string;
  title: string;
  location_id?: string | null;
  location_name?: string | null;
  person_ids: string[];
  person_names: string[];
  weapon_id?: string | null;
  weapon_name?: string | null;
  vehicle_id?: string | null;
  vehicle_registration?: string | null;
  description?: string | null;
}

export interface CaseIntelligenceGraphResponse {
  case: IntelligenceCaseSummary;
  nodes: CaseEntityNode[];
  edges: CaseEntityEdge[];
  timeline: TimelineEvent[];
}
