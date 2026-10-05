export interface PersonEntity {
  person_id: string;
  name: string;
  aliases: string[];
  occupation?: string;
  home_location_id?: string;
  home_location_name?: string;
  owned_vehicles?: string[];
  case_count?: number;
  cases?: string[];
  role_distribution?: Record<string, number>;
  is_potential_anomaly?: boolean;
  anomaly_label?: string;
  investigative_notes?: string[];
}

export interface LocationEntity {
  location_id: string;
  name: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  type?: string;
  case_count?: number;
  cases?: string[];
}

export interface VehicleEntity {
  vehicle_id: string;
  registration?: string;
  type?: string;
  color?: string;
  owner_person_id?: string;
  owner_name?: string;
  case_count?: number;
  cases?: string[];
  role_distribution?: Record<string, number>;
  is_potential_anomaly?: boolean;
  anomaly_label?: string;
  investigative_notes?: string[];
}

export interface ObjectEntity {
  object_id: string;
  type?: string;
  description?: string;
  serial_number?: string;
  case_count?: number;
  cases?: string[];
}
