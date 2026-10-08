import pytest
from backend.app.state import app_state


def test_ego_graph_generation():
    target_case_id = "IND-CASE-00001"
    rels = app_state.engine.get_related_cases(target_case_id, min_confidence=0.20, limit=10)

    graph = app_state.graph_service.get_case_ego_graph(target_case_id, rels, max_related=10)

    assert len(graph.nodes) > 0
    assert len(graph.edges) > 0

    node_types = {n.type for n in graph.nodes}
    assert "CASE" in node_types
    assert "CITY" in node_types
    assert "CRIME" in node_types
    assert "CRIME_DOMAIN" in node_types

    # Ensure focus case is in the nodes
    node_ids = {n.id for n in graph.nodes}
    assert target_case_id in node_ids

    # Edge relationship types
    edge_types = {e.relationship_type for e in graph.edges}
    assert "occurred_in" in edge_types
    assert "has_crime_type" in edge_types
    assert "belongs_to" in edge_types
