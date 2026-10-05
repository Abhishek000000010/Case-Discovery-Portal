import pytest
from backend.app.state import app_state
from backend.app.config import DEFAULT_CONFIG
from backend.app.services.relationship_engine import RelationshipEngine
from backend.app.services.modus_operandi_service import ModusOperandiService
from backend.app.services.event_sequence_service import EventSequenceService
from backend.app.services.temporal_service import TemporalService
from backend.app.services.geographic_service import GeographicService
from backend.app.services.clustering_service import ClusteringService
from backend.app.services.entity_resolver import EntityResolver
from backend.app.utils.text_normalization import compare_person_names, normalize_vehicle_registration
from backend.app.models.case_models import CaseModel, CaseEvent, CaseLocationRef
from backend.app.models.entity_models import PersonEntity, VehicleEntity, LocationEntity


def test_mo_matching_and_differing_tokens():
    mo_a = ["night_entry", "forced_window", "electronics_targeted", "motorcycle_escape"]
    mo_b = ["night_entry", "forced_window", "electronics_targeted", "van_transport"]

    res = ModusOperandiService.calculate_mo_similarity(mo_a, mo_b)
    score, evidence = res
    breakdown = res.breakdown

    assert score >= 0.60
    assert "night_entry" in breakdown["matching"]
    assert "forced_window" in breakdown["matching"]
    assert "electronics_targeted" in breakdown["matching"]
    assert "motorcycle_escape" in breakdown["differing_a"]
    assert "van_transport" in breakdown["differing_b"]
    assert len(evidence) > 0


def test_event_sequence_lcs_and_transitions():
    ev_a = [
        CaseEvent(event_id="e1", type="robbery", timestamp="2024-01-01T10:00:00"),
        CaseEvent(event_id="e2", type="escape", timestamp="2024-01-01T10:15:00"),
        CaseEvent(event_id="e3", type="vehicle_change", timestamp="2024-01-01T10:30:00"),
    ]
    ev_b = [
        CaseEvent(event_id="e4", type="robbery", timestamp="2024-02-01T14:00:00"),
        CaseEvent(event_id="e5", type="escape", timestamp="2024-02-01T14:20:00"),
        CaseEvent(event_id="e6", type="vehicle_change", timestamp="2024-02-01T14:40:00"),
    ]
    ev_c = [
        CaseEvent(event_id="e7", type="robbery", timestamp="2024-03-01T12:00:00"),
        CaseEvent(event_id="e8", type="arrest", timestamp="2024-03-01T12:30:00"),
        CaseEvent(event_id="e9", type="court_appearance", timestamp="2024-03-02T10:00:00"),
    ]

    res_ab = EventSequenceService.compare_event_sequences(ev_a, ev_b)
    score_ab, _ = res_ab
    breakdown_ab = res_ab.breakdown

    res_ac = EventSequenceService.compare_event_sequences(ev_a, ev_c)
    score_ac, _ = res_ac
    breakdown_ac = res_ac.breakdown

    # Identical sequence chain should score ~1.0
    assert score_ab >= 0.95
    assert breakdown_ab["lcs"] == ["robbery", "escape", "vehicle_change"]

    # Divergent sequence chain should score much lower
    assert score_ac < score_ab
    assert score_ac <= 0.40


def test_temporal_smooth_exponential_decay():
    # Day 0: exactly 1.0
    s0, d0, _ = TemporalService.calculate_temporal_similarity("2024-01-01", "2024-01-01", decay_constant_days=14.0)
    assert s0 == 1.0
    assert d0 == 0

    # Day 7: moderate decay
    s7, d7, _ = TemporalService.calculate_temporal_similarity("2024-01-01", "2024-01-08", decay_constant_days=14.0)
    assert 0.50 <= s7 <= 0.70
    assert d7 == 7

    # Day 60: near zero / expired window
    s60, d60, _ = TemporalService.calculate_temporal_similarity("2024-01-01", "2024-03-02", decay_constant_days=14.0, max_window_days=60)
    assert s60 <= 0.05


def test_geographic_multi_bracket_distances():
    # Test distance bands
    s_exact, b_exact = GeographicService.compute_distance_band_score(0.0)
    assert s_exact == 1.0
    assert b_exact == "same_location"

    s_close, b_close = GeographicService.compute_distance_band_score(2.5)
    assert 0.75 <= s_close <= 0.90
    assert b_close == "very_close"

    s_nearby, b_nearby = GeographicService.compute_distance_band_score(8.0)
    assert 0.50 <= s_nearby <= 0.75
    assert b_nearby == "nearby"

    s_far, b_far = GeographicService.compute_distance_band_score(35.0)
    assert s_far == 0.0
    assert b_far == "far_away"


def test_entity_resolution_name_variations_and_plates():
    # Name initials and surname match
    sim1, ev1 = compare_person_names("Rohan Mehta", "R. Mehta")
    assert sim1 >= 0.88
    assert len(ev1) > 0

    # First name and last name initial
    sim2, ev2 = compare_person_names("Rohan Mehta", "Rohan M.")
    assert sim2 >= 0.88
    assert len(ev2) > 0

    # Plate normalization
    assert normalize_vehicle_registration("MH-04-AB-2187") == "MH04AB2187"
    assert normalize_vehicle_registration("mh04ab2187") == "MH04AB2187"
    assert normalize_vehicle_registration("MH 04 AB 2187") == "MH04AB2187"

    # Vehicle resolver
    v1 = VehicleEntity(vehicle_id="v1", registration="MH-04-AB-2187", type="sedan", color="white")
    v2 = VehicleEntity(vehicle_id="v2", registration="mh04ab2187", type="sedan", color="white")
    score, ev = EntityResolver.compare_vehicles(v1, v2)
    assert score == 1.0


def test_false_positive_control():
    """
    Cases that share only generic common features (e.g. both 'theft', both 'Mumbai')
    without matching entities, MO, or close dates must NOT receive strong relationship score.
    """
    engine = RelationshipEngine(DEFAULT_CONFIG)
    engine.build_corpus_frequencies(app_state.cases)

    case_a = CaseModel(
        case_id="TEST_THEFT_1",
        title="Generic Theft 1",
        case_type="theft",
        summary="A generic theft occurred in Mumbai.",
        incident_date="2023-01-01",
        status="closed",
        severity="low",
        locations=[CaseLocationRef(location_id="LOC_TEST_1", role="scene")],
        modus_operandi=["daytime_pickpocket"],
        tags=["theft", "mumbai"],
        people_involved=[],
        vehicles=[],
        objects=[],
        witnesses=[],
        events=[]
    )

    case_b = CaseModel(
        case_id="TEST_THEFT_2",
        title="Generic Theft 2",
        case_type="theft",
        summary="Another generic theft occurred in Mumbai a year later.",
        incident_date="2024-06-01",
        status="open",
        severity="low",
        locations=[CaseLocationRef(location_id="LOC_TEST_2", role="scene")],
        modus_operandi=["night_snatching"],
        tags=["theft", "mumbai"],
        people_involved=[],
        vehicles=[],
        objects=[],
        witnesses=[],
        events=[]
    )

    loc_map = {
        "LOC_TEST_1": LocationEntity(location_id="LOC_TEST_1", name="Market A", latitude=19.0760, longitude=72.8777, city="Mumbai"),
        "LOC_TEST_2": LocationEntity(location_id="LOC_TEST_2", name="Station B", latitude=19.2183, longitude=72.9781, city="Mumbai"),  # > 20km
    }

    rel = engine.score_case_pair(
        case_a, case_b,
        loc_map, {}, {}, {}
    )

    # Must either be None (rejected) or score < 0.35 (weak / not high confidence)
    if rel is not None:
        assert rel.confidence < 0.35
        assert rel.category in ["WEAK", "IGNORE"]


def test_indirect_path_discovery():
    paths = app_state.graph_service.find_indirect_paths("CASE001", "CASE002", max_hops=4)
    # If a path exists, it should have structured nodes and narrative
    for p in paths:
        assert p.hops >= 2
        assert len(p.path_nodes) >= 3
        assert p.narrative != ""
        assert p.relevance_score > 0.0


def test_clustering_and_next_signals():
    loc_map = app_state.entities["location_map"]
    clusters = ClusteringService.cluster_cases(app_state.cases, loc_map)
    assert len(clusters) > 0
    assert clusters[0].case_count >= 3
    assert clusters[0].dominant_crime_type != ""
    assert len(clusters[0].common_mo) > 0

    c3 = app_state.case_map["CASE003"]
    signals = ClusteringService.infer_next_signals(c3, app_state.cases, loc_map)
    # Returns probabilistic next signals
    for sig in signals:
        assert sig.signal_type in ["location_pattern", "mo_transition"]
        assert 0.0 < sig.confidence <= 1.0
        assert len(sig.reason) > 10
