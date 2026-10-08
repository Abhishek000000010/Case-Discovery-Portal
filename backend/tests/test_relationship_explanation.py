import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.state import app_state
from backend.app.services.relationship_explanation_service import RelationshipExplanationService
from backend.app.models.relationship_models import RelationshipFeatures
from backend.app.models.case_models import CaseModel


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_confidence_classification():
    """Verify confidence threshold classifications."""
    assert RelationshipExplanationService.classify_confidence(0.92) == "VERY HIGH"
    assert RelationshipExplanationService.classify_confidence(0.85) == "VERY HIGH"
    assert RelationshipExplanationService.classify_confidence(0.78) == "HIGH"
    assert RelationshipExplanationService.classify_confidence(0.70) == "HIGH"
    assert RelationshipExplanationService.classify_confidence(0.62) == "MODERATE"
    assert RelationshipExplanationService.classify_confidence(0.50) == "MODERATE"
    assert RelationshipExplanationService.classify_confidence(0.42) == "WEAK"
    assert RelationshipExplanationService.classify_confidence(0.30) == "WEAK"
    assert RelationshipExplanationService.classify_confidence(0.25) == "NOT SURFACED"


def test_exact_crime_and_city_signals():
    """Verify exact crime matches and same-city cases produce correct supporting signals."""
    case_a = app_state.cases[0]
    case_b = app_state.cases[1]

    # Create synthetic features simulating same city and crime code
    features = RelationshipFeatures(
        same_city=True,
        crime_code_match=True,
        crime_description_match=True,
        crime_domain_match=True,
        weapon_match=False,
        temporal_similarity=0.9,
        incident_date_difference_days=2,
        time_of_day_similarity=0.8,
        hour_difference=1,
    )

    explanation = RelationshipExplanationService.explain_relationship(
        case_a=case_a,
        case_b=case_b,
        features=features,
        confidence=0.88,
    )

    assert explanation.relationship.classification == "VERY HIGH"
    assert explanation.relationship.type == "SHARED LOCATION + CRIME"

    # Verify supporting signals contain city and crime code
    sup_names = [s.signal_name for s in explanation.supporting_signals]
    assert "city" in sup_names
    assert "crime_code" in sup_names
    assert "occurrence_date" in sup_names

    # Check city explanation
    city_sig = next(s for s in explanation.supporting_signals if s.signal_name == "city")
    assert city_sig.result == "supporting"
    assert city_sig.raw_similarity == 1.0
    assert case_a.location.city in city_sig.explanation

    # Check that weakening signals contains weapon since it didn't match
    weak_names = [s.signal_name for s in explanation.weakening_signals]
    assert "weapon" in weak_names


def test_same_weapon_produces_weapon_signal():
    """Verify matching weapons produce weapon supporting signal."""
    case_a = app_state.cases[0]
    case_b = app_state.cases[1]

    features = RelationshipFeatures(
        same_city=False,
        crime_code_match=False,
        weapon_match=True,
    )

    explanation = RelationshipExplanationService.explain_relationship(
        case_a=case_a,
        case_b=case_b,
        features=features,
        confidence=0.45,
    )

    if case_a.weapon.used:
        weapon_sig = next((s for s in explanation.supporting_signals if s.signal_name == "weapon"), None)
        assert weapon_sig is not None
        assert weapon_sig.result == "supporting"
        assert weapon_sig.raw_similarity == 1.0


def test_temporal_difference_calculations():
    """Verify temporal difference calculations categorize correctly."""
    case_a = app_state.cases[0]
    case_b = app_state.cases[1]

    # Extreme temporal distance -> weakening
    features_distant = RelationshipFeatures(
        incident_date_difference_days=240,
        temporal_similarity=0.0,
    )
    exp_distant = RelationshipExplanationService.explain_relationship(
        case_a, case_b, features_distant, 0.35
    )
    temp_weak = next((s for s in exp_distant.weakening_signals if s.signal_name == "occurrence_date"), None)
    assert temp_weak is not None
    assert temp_weak.result == "weakening"

    # Close temporal distance -> supporting
    features_close = RelationshipFeatures(
        incident_date_difference_days=3,
        temporal_similarity=0.88,
    )
    exp_close = RelationshipExplanationService.explain_relationship(
        case_a, case_b, features_close, 0.75
    )
    temp_sup = next((s for s in exp_close.supporting_signals if s.signal_name == "occurrence_date"), None)
    assert temp_sup is not None
    assert temp_sup.result == "supporting"


def test_score_breakdown_consistency():
    """Verify score breakdown contains configured weights and non-negative contributions."""
    case_a = app_state.cases[0]
    case_b = app_state.cases[1]

    features = app_state.engine.extract_features(case_a, case_b)
    final_score, _ = app_state.engine.score_features(features)

    explanation = RelationshipExplanationService.explain_relationship(
        case_a=case_a,
        case_b=case_b,
        features=features,
        confidence=final_score,
    )

    assert len(explanation.score_breakdown) > 0
    for name, item in explanation.score_breakdown.items():
        assert item["weight"] > 0
        assert 0.0 <= item["raw_similarity"] <= 1.0
        assert item["weighted_contribution"] >= 0.0


def test_api_relationship_explanation_endpoint(client):
    """Test GET /api/relationships/{source_case_id}/{target_case_id}/explanation returns 200."""
    source_id = app_state.cases[0].case_id
    target_id = app_state.cases[1].case_id

    response = client.get(f"/api/relationships/{source_id}/{target_id}/explanation")
    assert response.status_code == 200
    data = response.json()

    assert data["source_case_id"] == source_id
    assert data["target_case_id"] == target_id
    assert "relationship" in data
    assert "type" in data["relationship"]
    assert "confidence" in data["relationship"]
    assert "classification" in data["relationship"]
    assert "summary" in data
    assert "supporting_signals" in data
    assert "weakening_signals" in data
    assert "comparison" in data
    assert "path" in data

    # Verify comparison rows match source case values
    assert data["comparison"]["city"]["case_a_value"] == app_state.cases[0].location.city
    assert data["comparison"]["city"]["case_b_value"] == app_state.cases[1].location.city


def test_api_relationship_explanation_404(client):
    """Verify 404 on nonexistent case ID."""
    response = client.get("/api/relationships/INVALID-CASE-999/INVALID-CASE-888/explanation")
    assert response.status_code == 404
