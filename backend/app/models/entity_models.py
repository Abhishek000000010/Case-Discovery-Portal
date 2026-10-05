from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class PersonEntity(BaseModel):
    person_id: str
    name: str
    aliases: List[str] = Field(default_factory=list)
    occupation: Optional[str] = None
    home_location_id: Optional[str] = None
    properties: Dict[str, Any] = Field(default_factory=dict)


class LocationEntity(BaseModel):
    location_id: str
    name: str
    city: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    type: Optional[str] = None
    properties: Dict[str, Any] = Field(default_factory=dict)


class VehicleEntity(BaseModel):
    vehicle_id: str
    registration: Optional[str] = None
    type: Optional[str] = None
    color: Optional[str] = None
    owner_person_id: Optional[str] = None
    properties: Dict[str, Any] = Field(default_factory=dict)


class ObjectEntity(BaseModel):
    object_id: str
    type: Optional[str] = None
    description: Optional[str] = None
    serial_number: Optional[str] = None
    properties: Dict[str, Any] = Field(default_factory=dict)
