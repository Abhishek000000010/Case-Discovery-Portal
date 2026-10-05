import pytest
from backend.app.services.entity_resolver import EntityResolver
from backend.app.models.entity_models import PersonEntity, VehicleEntity


def test_entity_resolver_exact():
    p1 = PersonEntity(person_id="P001", name="Rohan Mehta", aliases=["R. Mehta"])
    p2 = PersonEntity(person_id="P001", name="Rohan Mehta", aliases=["R. Mehta"])
    score, evidence = EntityResolver.compare_persons(p1, p2)
    assert score == 1.0
    assert any("Identical authoritative ID" in e for e in evidence)


def test_entity_resolver_alias_and_spelling():
    p1 = PersonEntity(person_id="P001", name="Rohan Mehta", aliases=["R. Mehta"])
    p2 = PersonEntity(person_id="P099", name="Rohan M.", aliases=["R. Mehta"])
    score, evidence = EntityResolver.compare_persons(p1, p2)
    assert score >= 0.85
    assert any("Matching alias/name variation" in e for e in evidence)


def test_entity_resolver_unrelated():
    p1 = PersonEntity(person_id="P001", name="Rohan Mehta")
    p2 = PersonEntity(person_id="P002", name="Kunal Joshi")
    score, evidence = EntityResolver.compare_persons(p1, p2)
    assert score < 0.40


def test_vehicle_resolver():
    v1 = VehicleEntity(vehicle_id="V001", registration="MH-04-AB-2187", type="motorcycle", color="black")
    v2 = VehicleEntity(vehicle_id="V002", registration="MH04AB2187", type="motorcycle", color="black")
    score, evidence = EntityResolver.compare_vehicles(v1, v2)
    assert score == 1.0
    assert any("Exact vehicle registration match" in e for e in evidence)
