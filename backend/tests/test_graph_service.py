import pytest
from backend.app.state import app_state


def test_graph_construction():
    graph = app_state.graph_service.nx_graph
    assert graph.number_of_nodes() > 120
    assert graph.has_node("CASE001")
    assert graph.has_node("P001")
    assert graph.has_node("L001")


def test_subgraph_extraction():
    subgraph = app_state.graph_service.get_focused_subgraph("CASE003", depth=1, min_confidence=0.40)
    assert len(subgraph.nodes) > 1
    assert any(n.id == "CASE003" for n in subgraph.nodes)
    assert len(subgraph.edges) > 0


def test_subgraph_type_filtering():
    subgraph = app_state.graph_service.get_focused_subgraph(
        "CASE003",
        depth=1,
        min_confidence=0.40,
        allowed_node_types={"CASE", "PERSON"}
    )
    for n in subgraph.nodes:
        assert n.type in ["CASE", "PERSON"]
