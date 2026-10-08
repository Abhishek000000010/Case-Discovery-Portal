import pytest
from backend.app.services.data_loader import IndianCrimeJsonProvider
from backend.app.config import get_dataset_path


def test_dataset_path_resolves():
    path = get_dataset_path()
    assert path.exists()
    assert "indian_crime_cases_real_cleaned.json" in str(path)


def test_data_loader_real_cases():
    provider = IndianCrimeJsonProvider()
    cases = provider.load_cases()
    assert len(cases) > 40000
    assert len(cases) == 40160

    # Stable deterministic case ID format
    first_case = cases[0]
    assert first_case.case_id == "IND-CASE-00001"
    assert first_case.source.source_report_number == 1
    assert first_case.location.city == "Ahmedabad"
    assert first_case.incident.crime_description == "IDENTITY THEFT"

    # Verify no duplicate original report numbers
    report_numbers = [c.source.source_report_number for c in cases]
    assert len(report_numbers) == len(set(report_numbers))


def test_missing_and_optional_attributes():
    provider = IndianCrimeJsonProvider()
    cases = provider.load_cases()

    # Cases with and without weapons
    cases_with_weapon = [c for c in cases if c.weapon.used is not None]
    cases_without_weapon = [c for c in cases if c.weapon.used is None]
    assert len(cases_with_weapon) > 30000
    assert len(cases_without_weapon) > 5000

    # Cases with closed status and open status
    closed_cases = [c for c in cases if c.investigation.case_closed is True]
    open_cases = [c for c in cases if c.investigation.case_closed is False]
    assert len(closed_cases) > 15000
    assert len(open_cases) > 15000

    # Open cases have None for date_case_closed and closure_duration_days
    sample_open = open_cases[0]
    assert sample_open.investigation.date_case_closed is None
    assert sample_open.investigation.closure_duration_days is None


def test_dimension_tables_loaded():
    provider = IndianCrimeJsonProvider()
    entities = provider.load_entities()

    assert len(entities.cities) == 29
    assert len(entities.crime_descriptions) == 21
    assert len(entities.weapons) == 6
    assert len(entities.crime_domains) == 4

    city_names = [c.name for c in entities.cities]
    assert "Mumbai" in city_names
    assert "Delhi" in city_names
    assert "Ahmedabad" in city_names
