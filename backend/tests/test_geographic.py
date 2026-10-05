import pytest
from backend.app.services.geographic_service import GeographicService
from backend.app.models.entity_models import LocationEntity
from backend.app.models.case_models import CaseLocationRef


def test_haversine_same_point():
    dist = GeographicService.haversine_distance(19.1187, 72.9442, 19.1187, 72.9442)
    assert dist == 0.0


def test_haversine_nearby_points():
    # Vikhroli to Bhandup (~3.17 km)
    dist = GeographicService.haversine_distance(19.1187, 72.9442, 19.1450, 72.9320)
    assert 2.0 < dist < 5.0


def test_compare_locations_identical():
    loc1 = LocationEntity(location_id="L001", name="Vikhroli East", latitude=19.1187, longitude=72.9442)
    loc2 = LocationEntity(location_id="L001", name="Vikhroli East", latitude=19.1187, longitude=72.9442)
    score, dist, evidence = GeographicService.compare_locations(loc1, loc2)
    assert score == 1.0
    assert dist == 0.0
    assert any("Identical location" in e for e in evidence)


def test_compare_locations_nearby():
    loc1 = LocationEntity(location_id="L001", name="Vikhroli East", latitude=19.1187, longitude=72.9442)
    loc2 = LocationEntity(location_id="L002", name="Bhandup West", latitude=19.1450, longitude=72.9320)
    score, dist, evidence = GeographicService.compare_locations(loc1, loc2, nearby_threshold_km=15.0)
    assert score > 0.4
    assert dist < 15.0
    assert any("Geographic proximity" in e for e in evidence)


def test_compare_locations_distant():
    # Mumbai to Delhi (~1150 km)
    loc1 = LocationEntity(location_id="L001", name="Mumbai", latitude=19.0760, longitude=72.8777)
    loc2 = LocationEntity(location_id="L099", name="Delhi", latitude=28.7041, longitude=77.1025)
    score, dist, evidence = GeographicService.compare_locations(loc1, loc2, nearby_threshold_km=15.0)
    assert score == 0.0
    assert dist > 1000.0
    assert len(evidence) == 0
