import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_list_intelligence_cases():
    res = client.get("/api/intelligence-cases")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) == 15
    first = data[0]
    assert first["case_id"] == "DETAIL-CASE-001"
    assert first["crime_type"] == "Murder"
    assert first["is_synthetic_demo"] is True
    assert "counts" in first
    assert first["counts"]["persons"] == 4
    assert first["counts"]["locations"] == 2
    assert first["counts"]["weapons"] == 1
    assert first["counts"]["vehicles"] == 1
    assert first["counts"]["objects"] == 2
    assert first["counts"]["events"] == 4
    assert first["counts"]["evidence"] == 3


def test_detail_case_001_graph_structure():
    res = client.get("/api/intelligence-cases/DETAIL-CASE-001/graph")
    assert res.status_code == 200
    data = res.json()

    # Case metadata
    assert data["case"]["case_id"] == "DETAIL-CASE-001"
    assert data["case"]["crime_type"] == "Murder"
    assert data["case"]["is_synthetic_demo"] is True

    # Nodes
    nodes = data["nodes"]
    node_types = set(n["type"] for n in nodes)
    expected_types = {"CASE", "PERSON", "LOCATION", "WEAPON", "VEHICLE", "OBJECT", "EVENT", "EVIDENCE"}
    assert expected_types.issubset(node_types)

    # Check root node
    root = next(n for n in nodes if n["id"] == "DETAIL-CASE-001")
    assert root["type"] == "CASE"
    assert root["depth"] == 0

    # Check person node with roles
    nitin = next(n for n in nodes if n["id"] == "PER-002")
    assert nitin["type"] == "PERSON"
    assert nitin["role"] == "suspect"
    assert nitin["label"] == "Nitin Rajendra Pawar"

    arjun = next(n for n in nodes if n["id"] == "PER-001")
    assert arjun["role"] == "victim"

    # Check weapon
    knife = next(n for n in nodes if n["id"] == "WPN-001")
    assert knife["type"] == "WEAPON"
    assert "knife" in knife["label"].lower()

    # Check vehicle with registration
    veh = next(n for n in nodes if n["id"] == "VEH-001")
    assert veh["type"] == "VEHICLE"
    assert veh["label"] == "MH-03-KR-4821"

    # Edges & modes (explicit and derived)
    edges = data["edges"]
    modes = set(e["relationship_mode"] for e in edges)
    assert "explicit" in modes
    assert "derived" in modes

    # Explanations present
    for edge in edges:
        assert len(edge["explanation"]) > 0
        assert edge["relationship_type"] is not None

    # Timeline
    timeline = data["timeline"]
    assert len(timeline) == 4
    assert timeline[0]["event_id"] == "EVT-001"
    assert timeline[0]["time_display"] == "22:10"
    assert timeline[1]["event_id"] == "EVT-002"
    assert timeline[1]["time_display"] == "22:31"
    assert timeline[1]["weapon_id"] == "WPN-001"
    assert timeline[2]["event_id"] == "EVT-004"
    assert timeline[2]["time_display"] == "22:40"
    assert timeline[2]["vehicle_id"] == "VEH-001"
    assert timeline[3]["event_id"] == "EVT-003"
    assert timeline[3]["time_display"] == "22:52"


def test_depth_filtering():
    res_direct = client.get("/api/intelligence-cases/DETAIL-CASE-001/graph?depth=direct")
    assert res_direct.status_code == 200
    data_direct = res_direct.json()

    res_full = client.get("/api/intelligence-cases/DETAIL-CASE-001/graph?depth=full")
    assert res_full.status_code == 200
    data_full = res_full.json()

    # Direct has fewer edges than full because secondary edges (e.g. event-to-weapon, sequence) are excluded
    assert len(data_direct["edges"]) < len(data_full["edges"])


def test_invalid_intelligence_case():
    res = client.get("/api/intelligence-cases/NON-EXISTENT-999/graph")
    assert res.status_code == 404
