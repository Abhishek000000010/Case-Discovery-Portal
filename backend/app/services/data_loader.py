import json
from abc import ABC, abstractmethod
from pathlib import Path
from typing import List, Dict, Any, Optional
from backend.app.config import get_dataset_path
from backend.app.models.case_models import CaseModel
from backend.app.models.entity_models import (
    CityEntity,
    CrimeCodeEntity,
    CrimeDescriptionEntity,
    WeaponEntity,
    CrimeDomainEntity,
    EntityListResponse,
)


class CaseDataProvider(ABC):
    """
    Abstract interface for case data ingestion.
    Allows seamlessly plugging in a future DocumentExtractionProvider / OCR pipeline
    without modifying the relationship discovery engine or knowledge graph.
    """

    @abstractmethod
    def load_cases(self) -> List[CaseModel]:
        """Loads and returns all structured case incident records."""
        pass

    @abstractmethod
    def load_metadata(self) -> Dict[str, Any]:
        """Returns provenance, record count, quality metrics, and limitations."""
        pass

    @abstractmethod
    def load_dimension_tables(self) -> Dict[str, Any]:
        """Returns reference dimensions (cities, crime types, weapons, domains)."""
        pass

    @abstractmethod
    def load_entities(self) -> EntityListResponse:
        """Returns typed entity dimension collections."""
        pass


class IndianCrimeJsonProvider(CaseDataProvider):
    """
    Production data provider loading the cleaned real Indian Crime dataset.
    Preserves raw JSON fidelity with zero data fabrication.
    """

    def __init__(self, file_path: Optional[Path] = None):
        self.file_path = file_path or get_dataset_path()
        self._raw_data: Dict[str, Any] = {}
        self._load_raw()

    def _load_raw(self):
        if not self.file_path.exists():
            raise FileNotFoundError(f"Dataset file not found at: {self.file_path}")
        with open(self.file_path, "r", encoding="utf-8") as f:
            self._raw_data = json.load(f)

    def load_cases(self) -> List[CaseModel]:
        cases_raw = self._raw_data.get("cases", [])
        return [CaseModel(**c) for c in cases_raw]

    def load_metadata(self) -> Dict[str, Any]:
        return self._raw_data.get("metadata", {})

    def load_dimension_tables(self) -> Dict[str, Any]:
        return self._raw_data.get("dimension_tables", {})

    def load_entities(self) -> EntityListResponse:
        dims = self.load_dimension_tables()

        cities = [CityEntity(**c) for c in dims.get("cities", [])]
        crime_codes = [CrimeCodeEntity(**cc) for cc in dims.get("crime_codes", [])]
        crime_descs = [CrimeDescriptionEntity(**cd) for cd in dims.get("crime_descriptions", [])]
        weapons = [WeaponEntity(**w) for w in dims.get("weapons", [])]
        domains = [CrimeDomainEntity(**d) for d in dims.get("crime_domains", [])]

        return EntityListResponse(
            cities=cities,
            crime_descriptions=crime_descs,
            weapons=weapons,
            crime_domains=domains,
            crime_codes=crime_codes,
        )


# Backward-compatible alias
JSONCaseDataProvider = IndianCrimeJsonProvider
RealIndianCrimeDataProvider = IndianCrimeJsonProvider
