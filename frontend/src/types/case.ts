import { PersonEntity, LocationEntity, VehicleEntity, ObjectEntity } from './entity';

export interface CasePersonRef {
  person_id: string;
  role: string;
}

export interface CaseLocationRef {
  location_id: string;
  role: string;
}

export interface CaseVehicleRef {
  vehicle_id: string;
  role: string;
}

export interface CaseObjectRef {
  object_id: string;
  role: string;
}

export interface CaseEvent {
  event_id: string;
  type: string;
  person_id?: string;
  location_id?: string;
  timestamp?: string;
  description?: string;
}

export interface CaseWitness {
  person_id: string;
  statement_id?: string;
  role?: string;
}

export interface CaseEvidence {
  evidence_id: string;
  type: string;
  description?: string;
}

export interface CaseModel {
  case_id: string;
  case_type: string;
  status: string;
  reported_date?: string;
  incident_date?: string;
  incident_time_range?: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | string;
  summary: string;
  people_involved: CasePersonRef[];
  locations: CaseLocationRef[];
  vehicles: CaseVehicleRef[];
  objects: CaseObjectRef[];
  events: CaseEvent[];
  modus_operandi: string[];
  witnesses: CaseWitness[];
  evidence: CaseEvidence[];
  tags: string[];
  related_cases_count?: number;
  people_count?: number;
  location_names?: string[];
}

export interface EnrichedPerson {
  person: PersonEntity;
  role: string;
}

export interface EnrichedLocation {
  location: LocationEntity;
  role: string;
}

export interface EnrichedVehicle {
  vehicle: VehicleEntity;
  role: string;
}

export interface EnrichedObject {
  object: ObjectEntity;
  role: string;
}

export interface CaseDetailResponse {
  case: CaseModel;
  enriched_people: EnrichedPerson[];
  enriched_locations: EnrichedLocation[];
  enriched_vehicles: EnrichedVehicle[];
  enriched_objects: EnrichedObject[];
  related_cases_count: number;
}
