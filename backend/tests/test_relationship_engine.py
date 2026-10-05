import pytest
from backend.app.state import app_state
from backend.app.services.relationship_engine import RelationshipEngine
from backend.app.config import DEFAULT_CONFIG


def test_engine_scores_strong_relationship():
    engine = RelationshipEngine(DEFAULT_CONFIG)
    cases = app_state.cases
    entities = app_state.entities

    c3 = app_state.case_map["CASE003"]
    c4 = app_state.case_map["CASE004"]

    rel = engine.score_case_pair(
        c3, c4,
        entities["location_map"],
        entities["vehicle_map"],
        entities["person_map"],
        entities["object_map"]
    )

    assert rel is not None
    assert rel.confidence >= 0.75
    assert rel.category in ["DIRECT", "STRONG"]
    assert len(rel.evidence) > 0
    assert rel.score_breakdown.modus_operandi_similarity > 0.8


def test_engine_rejects_unrelated_cases():
    engine = RelationshipEngine(DEFAULT_CONFIG)
    entities = app_state.entities

    # Pick two distant cases with completely different types and no shared entities
    c1 = app_state.case_map["CASE001"]
    c_distant = [c for c in app_state.cases if c.case_type != "missing_person" and "bhiwandi" not in c.summary.lower()][-1]

    rel = engine.score_case_pair(
        c1, c_distant,
        entities["location_map"],
        entities["vehicle_map"],
        entities["person_map"],
        entities["object_map"]
    )

    # Either no relationship or very weak below threshold
    if rel is not None:
        assert rel.confidence < 0.60
