import pytest
from backend.app.services.data_loader import JSONCaseDataProvider
from backend.app.config import get_dataset_path


def test_dataset_path_resolves():
    path = get_dataset_path()
    assert path.exists()


def test_data_loader_cases():
    provider = JSONCaseDataProvider()
    cases = provider.load_cases()
    assert len(cases) == 120
    assert cases[0].case_id == "CASE001"
    assert cases[0].case_type == "missing_person"


def test_data_loader_entities():
    provider = JSONCaseDataProvider()
    entities = provider.load_entities()
    assert len(entities["persons"]) == 80
    assert len(entities["locations"]) == 20
    assert len(entities["vehicles"]) == 20
    assert len(entities["objects"]) == 20
    assert "P001" in entities["person_map"]
    assert "L001" in entities["location_map"]


def test_ground_truth_isolation():
    provider = JSONCaseDataProvider()
    gt = provider.load_ground_truth_for_evaluation_only()
    assert len(gt) > 0
    assert "source_id" in gt[0]
