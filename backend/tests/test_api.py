import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["cases_loaded"] == 120


def test_list_cases_endpoint():
    res = client.get("/api/cases?page=1&page_size=10")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 120
    assert len(data["cases"]) == 10


def test_case_detail_endpoint():
    res = client.get("/api/cases/CASE001")
    assert res.status_code == 200
    data = res.json()
    assert data["case"]["case_id"] == "CASE001"
    assert len(data["enriched_people"]) > 0


def test_case_relationships_endpoint():
    res = client.get("/api/cases/CASE003/relationships")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)


def test_global_search_endpoint():
    res = client.get("/api/search?q=burglary")
    assert res.status_code == 200
    data = res.json()
    assert len(data["cases"]) > 0


def test_stats_endpoint():
    res = client.get("/api/stats")
    assert res.status_code == 200
    data = res.json()
    assert data["total_cases"] == 120
    assert data["total_persons"] == 80


def test_anomalies_endpoint():
    res = client.get("/api/anomalies")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
