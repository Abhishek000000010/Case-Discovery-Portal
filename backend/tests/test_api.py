import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["cases_loaded"] == 40160
    assert data["cities"] == 29
    assert data["crime_types"] == 21


def test_list_cases_pagination():
    res = client.get("/api/cases?page=1&page_size=25")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 40160
    assert data["page"] == 1
    assert data["page_size"] == 25
    assert len(data["cases"]) == 25
    assert data["cases"][0]["case_id"] == "IND-CASE-00001"

    # Page 2 test
    res2 = client.get("/api/cases?page=2&page_size=25")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["cases"][0]["case_id"] == "IND-CASE-00026"


def test_case_detail_endpoint():
    res = client.get("/api/cases/IND-CASE-00001")
    assert res.status_code == 200
    data = res.json()
    c = data["case"]
    assert c["case_id"] == "IND-CASE-00001"
    assert c["location"]["city"] == "Ahmedabad"
    assert c["incident"]["crime_code"] == 576
    assert c["source"]["source_report_number"] == 1


def test_case_relationships_endpoint():
    res = client.get("/api/cases/IND-CASE-00001/relationships?min_confidence=0.20")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    if len(data) > 0:
        first = data[0]
        assert "confidence" in first
        assert "evidence" in first
        assert "score_breakdown" in first


def test_global_search_endpoint():
    res = client.get("/api/search?q=ahmedabad")
    assert res.status_code == 200
    data = res.json()
    assert len(data["cases"]) > 0
    assert any(c["city"] == "Ahmedabad" for c in data["cases"])


def test_stats_endpoint():
    res = client.get("/api/stats")
    assert res.status_code == 200
    data = res.json()
    assert data["total_cases"] == 40160
    assert data["total_cities"] == 29
    assert data["total_crime_types"] == 21
    assert data["total_weapons"] == 6
    assert data["total_crime_domains"] == 4
    assert "cases_closed" in data
    assert "open_cases" in data


def test_entities_endpoints():
    res_cities = client.get("/api/entities/cities")
    assert res_cities.status_code == 200
    assert len(res_cities.json()) == 29

    res_crimes = client.get("/api/entities/crimes")
    assert res_crimes.status_code == 200
    assert len(res_crimes.json()) == 21

    res_weapons = client.get("/api/entities/weapons")
    assert res_weapons.status_code == 200
    assert len(res_weapons.json()) == 6

    res_domains = client.get("/api/entities/domains")
    assert res_domains.status_code == 200
    assert len(res_domains.json()) == 4


def test_patterns_and_anomalies_endpoints():
    res_patterns = client.get("/api/patterns")
    assert res_patterns.status_code == 200
    assert isinstance(res_patterns.json(), list)

    res_anomalies = client.get("/api/anomalies")
    assert res_anomalies.status_code == 200
    assert isinstance(res_anomalies.json(), list)
