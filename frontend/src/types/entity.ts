export interface CityEntity {
  city_id: string;
  name: string;
  case_count: number;
  cases_closed?: number;
  open_cases?: number;
  closure_rate?: number;
  top_crime?: string;
}

export interface CrimeDescriptionEntity {
  crime_id: string;
  name: string;
  case_count: number;
  top_city?: string;
  top_weapon?: string;
}

export interface WeaponEntity {
  weapon_id: string;
  name: string;
  case_count: number;
  top_crime?: string;
}

export interface CrimeDomainEntity {
  domain_id: string;
  name: string;
  case_count: number;
}

export interface CrimeCodeEntity {
  crime_id: string;
  crime_code: number;
  case_count: number;
  descriptions?: string[];
}
