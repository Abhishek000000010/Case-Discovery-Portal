import pytest
from backend.app.services.geographic_service import GeographicService
from backend.app.state import app_state


def test_compare_cases_same_city():
    # Pick two cases in Ahmedabad
    ahmedabad_cases = [c for c in app_state.cases if c.location.city == "Ahmedabad"]
    case1 = ahmedabad_cases[0]
    case2 = ahmedabad_cases[1]

    score, is_same, evidence = GeographicService.compare_cases(case1, case2)
    assert score == 1.0
    assert is_same is True
    assert len(evidence) == 1
    assert "Ahmedabad" in evidence[0]


def test_compare_cases_different_cities():
    case1 = [c for c in app_state.cases if c.location.city == "Mumbai"][0]
    case2 = [c for c in app_state.cases if c.location.city == "Delhi"][0]

    score, is_same, evidence = GeographicService.compare_cases(case1, case2)
    assert score == 0.0
    assert is_same is False
    assert "different jurisdictions" in evidence[0]


def test_no_fabricated_coordinates():
    # Verify no coordinates are returned or computed
    case1 = app_state.cases[0]
    case2 = app_state.cases[1]
    _, _, evidence = GeographicService.compare_cases(case1, case2)
    assert not any("latitude" in e.lower() or "longitude" in e.lower() for e in evidence)
