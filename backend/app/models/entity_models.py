from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class CityEntity(BaseModel):
    city_id: str
    name: str
    case_count: int = 0
    properties: Dict[str, Any] = Field(default_factory=dict)


class CrimeCodeEntity(BaseModel):
    crime_id: str
    crime_code: int
    case_count: int = 0
    descriptions: List[str] = Field(default_factory=list)


class CrimeDescriptionEntity(BaseModel):
    crime_description_id: str
    name: str
    case_count: int = 0


class WeaponEntity(BaseModel):
    weapon_id: str
    name: str
    case_count: int = 0


class CrimeDomainEntity(BaseModel):
    domain_id: str
    name: str
    case_count: int = 0


class EntityListResponse(BaseModel):
    cities: List[CityEntity] = Field(default_factory=list)
    crime_descriptions: List[CrimeDescriptionEntity] = Field(default_factory=list)
    weapons: List[WeaponEntity] = Field(default_factory=list)
    crime_domains: List[CrimeDomainEntity] = Field(default_factory=list)
    crime_codes: List[CrimeCodeEntity] = Field(default_factory=list)
