import pytest
from backend.app.state import app_state
from backend.app.services.relationship_engine import RelationshipEngine
from backend.app.config import load_relationship_config


def test_engine_initializes_and_indexes():
    weights = load_relationship_config()["weights"]
    engine = RelationshipEngine(weights)
    engine.index_corpus(app_state.cases)

    assert len(engine.city_index) == 29
    assert len(engine.crime_code_index) > 0
    assert len(engine.domain_index) == 4


def test_candidate_retrieval_performance():
    weights = load_relationship_config()["weights"]
    engine = RelationshipEngine(weights)
    engine.index_corpus(app_state.cases)

    first_case = app_state.cases[0]
    candidate_indices = engine.get_candidate_case_indices(first_case, max_candidates=200)

    assert len(candidate_indices) > 0
    assert len(candidate_indices) <= 200
    # First case index is 0, should not be in candidates
    assert 0 not in candidate_indices


def test_engine_scores_similar_incident_profile():
    weights = load_relationship_config()["weights"]
    engine = RelationshipEngine(weights)
    engine.index_corpus(app_state.cases)

    # Find two cases in Ahmedabad with the same crime code and weapon
    cases_match = [c for c in app_state.cases if c.location.city == "Ahmedabad" and c.weapon.used is not None]
    case_a = cases_match[0]
    matching = [c for c in cases_match[1:] if c.incident.crime_code == case_a.incident.crime_code and c.weapon.used == case_a.weapon.used]

    if matching:
        case_b = matching[0]
        rel = engine.compare_case_pair(case_a, case_b)
        assert rel is not None
        assert rel.confidence >= 0.50
        assert rel.category in ["VERY HIGH", "HIGH", "MODERATE"]
        assert len(rel.evidence) > 0
        assert rel.score_breakdown.same_city == 1.0
        assert rel.score_breakdown.crime_code_match == 1.0
        assert rel.score_breakdown.weapon_match == 1.0


def test_engine_ranks_relationships():
    target_case_id = "IND-CASE-00001"
    relationships = app_state.engine.get_related_cases(target_case_id, min_confidence=0.20, limit=10)

    assert len(relationships) > 0
    # Strictly descending order by confidence
    confidences = [r.confidence for r in relationships]
    assert confidences == sorted(confidences, reverse=True)
