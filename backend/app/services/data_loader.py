import json
from abc import ABC, abstractmethod
from pathlib import Path
from typing import List, Dict, Any, Tuple
from backend.app.config import get_dataset_path
from backend.app.models.case_models import CaseModel
from backend.app.models.entity_models import (
    PersonEntity,
    LocationEntity,
    VehicleEntity,
    ObjectEntity,
)


class CaseDataProvider(ABC):
    """
    Abstract interface for case data ingestion.
    Allows seamlessly plugging in a future DocumentExtractionService / OCR pipeline
    without modifying the relationship discovery engine.
    """

    @abstractmethod
    def load_cases(self) -> List[CaseModel]:
        pass

    @abstractmethod
    def load_entities(self) -> Dict[str, Any]:
        pass

    @abstractmethod
    def load_ground_truth_for_evaluation_only(self) -> List[Dict[str, Any]]:
        """
        MUST ONLY be accessed by test/evaluation services.
        Production relationship discovery MUST NEVER invoke this method.
        """
        pass


class JSONCaseDataProvider(CaseDataProvider):
    """
    Loads synthetic dataset from structured JSON file.
    """

    def __init__(self, file_path: Path = None):
        self.file_path = file_path or get_dataset_path()
        self._raw_data: Dict[str, Any] = {}
        self._load_raw()

    def _load_raw(self):
        with open(self.file_path, "r", encoding="utf-8") as f:
            self._raw_data = json.load(f)

    def load_cases(self) -> List[CaseModel]:
        cases_raw = self._raw_data.get("cases", [])
        return [CaseModel(**c) for c in cases_raw]

    def load_entities(self) -> Dict[str, Any]:
        entities_raw = self._raw_data.get("entities", {})
        persons = [PersonEntity(**p) for p in entities_raw.get("persons", [])]
        locations = [LocationEntity(**l) for l in entities_raw.get("locations", [])]
        vehicles = [VehicleEntity(**v) for v in entities_raw.get("vehicles", [])]
        objects = [ObjectEntity(**o) for o in entities_raw.get("objects", [])]

        return {
            "persons": persons,
            "locations": locations,
            "vehicles": vehicles,
            "objects": objects,
            "person_map": {p.person_id: p for p in persons},
            "location_map": {l.location_id: l for l in locations},
            "vehicle_map": {v.vehicle_id: v for v in vehicles},
            "object_map": {o.object_id: o for o in objects},
        }

    def load_ground_truth_for_evaluation_only(self) -> List[Dict[str, Any]]:
        """
        Isolated access for benchmark testing and evaluation only.
        """
        return self._raw_data.get("ground_truth_relationships_for_testing", [])
