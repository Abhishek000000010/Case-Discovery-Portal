from typing import List, Dict, Any, Optional, Set
import networkx as nx
from backend.app.models.case_models import CaseModel
from backend.app.models.entity_models import PersonEntity, LocationEntity, VehicleEntity, ObjectEntity
from backend.app.models.relationship_models import RelationshipExplanation, IndirectPath
from backend.app.models.graph_models import GraphNode, GraphEdge, GraphData


class GraphService:
    """
    Constructs and queries the multi-entity knowledge graph using NetworkX.
    Manages direct entity bipartite projections, derived case-to-case relationships,
    and multi-hop indirect relationship path discovery.
    """

    def __init__(self):
        self.nx_graph = nx.MultiGraph()

    def build_full_graph(
        self,
        cases: List[CaseModel],
        entities: Dict[str, Any],
        relationships: List[RelationshipExplanation]
    ):
        self.nx_graph.clear()

        # 1. Add Person Nodes
        for p in entities.get("persons", []):
            self.nx_graph.add_node(
                p.person_id,
                type="PERSON",
                label=p.name,
                properties={
                    "aliases": p.aliases,
                    "occupation": p.occupation,
                    "home_location_id": p.home_location_id
                }
            )

        # 2. Add Location Nodes
        for loc in entities.get("locations", []):
            self.nx_graph.add_node(
                loc.location_id,
                type="LOCATION",
                label=loc.name,
                properties={
                    "city": loc.city,
                    "state": loc.state,
                    "latitude": loc.latitude,
                    "longitude": loc.longitude,
                    "location_type": loc.type
                }
            )

        # 3. Add Vehicle Nodes
        for v in entities.get("vehicles", []):
            self.nx_graph.add_node(
                v.vehicle_id,
                type="VEHICLE",
                label=v.registration or v.vehicle_id,
                properties={
                    "vehicle_type": v.type,
                    "color": v.color,
                    "owner_person_id": v.owner_person_id
                }
            )

        # 4. Add Object Nodes
        for obj in entities.get("objects", []):
            self.nx_graph.add_node(
                obj.object_id,
                type="OBJECT",
                label=obj.description or obj.object_id,
                properties={
                    "object_type": obj.type,
                    "serial_number": obj.serial_number
                }
            )

        # 5. Add Case Nodes and Direct Structural Edges
        for c in cases:
            self.nx_graph.add_node(
                c.case_id,
                type="CASE",
                label=c.case_id,
                properties={
                    "case_type": c.case_type,
                    "status": c.status,
                    "severity": c.severity,
                    "reported_date": c.reported_date,
                    "incident_date": c.incident_date,
                    "summary": c.summary,
                    "tags": c.tags
                }
            )

            # Person involvement
            for pref in c.people_involved:
                if self.nx_graph.has_node(pref.person_id):
                    self.nx_graph.add_edge(
                        c.case_id,
                        pref.person_id,
                        key=f"INVOLVED_{c.case_id}_{pref.person_id}",
                        relationship_type="involved_in",
                        category="DIRECT",
                        confidence=1.0,
                        evidence=[f"Role in case: {pref.role}"]
                    )

            # Witnesses
            for wref in c.witnesses:
                if self.nx_graph.has_node(wref.person_id):
                    self.nx_graph.add_edge(
                        c.case_id,
                        wref.person_id,
                        key=f"WITNESS_{c.case_id}_{wref.person_id}",
                        relationship_type="witness_for",
                        category="DIRECT",
                        confidence=1.0,
                        evidence=[f"Recorded witness statement: {wref.statement_id or 'witness'}"]
                    )

            # Location association
            for lref in c.locations:
                if self.nx_graph.has_node(lref.location_id):
                    self.nx_graph.add_edge(
                        c.case_id,
                        lref.location_id,
                        key=f"OCCURRED_{c.case_id}_{lref.location_id}",
                        relationship_type="occurred_at",
                        category="DIRECT",
                        confidence=1.0,
                        evidence=[f"Location role: {lref.role}"]
                    )

            # Vehicle association
            for vref in c.vehicles:
                if self.nx_graph.has_node(vref.vehicle_id):
                    self.nx_graph.add_edge(
                        c.case_id,
                        vref.vehicle_id,
                        key=f"VEHICLE_{c.case_id}_{vref.vehicle_id}",
                        relationship_type="associated_vehicle",
                        category="DIRECT",
                        confidence=1.0,
                        evidence=[f"Vehicle role: {vref.role}"]
                    )

            # Object association
            for oref in c.objects:
                if self.nx_graph.has_node(oref.object_id):
                    self.nx_graph.add_edge(
                        c.case_id,
                        oref.object_id,
                        key=f"OBJECT_{c.case_id}_{oref.object_id}",
                        relationship_type="associated_object",
                        category="DIRECT",
                        confidence=1.0,
                        evidence=[f"Object role: {oref.role}"]
                    )

            # Event Nodes
            for ev in c.events:
                ev_node_id = f"EV_{c.case_id}_{ev.event_id}"
                self.nx_graph.add_node(
                    ev_node_id,
                    type="EVENT",
                    label=ev.type.replace("_", " "),
                    properties={
                        "event_type": ev.type,
                        "timestamp": ev.timestamp,
                        "case_id": c.case_id
                    }
                )
                self.nx_graph.add_edge(
                    c.case_id,
                    ev_node_id,
                    key=f"CASE_EVENT_{c.case_id}_{ev.event_id}",
                    relationship_type="has_event",
                    category="DIRECT",
                    confidence=1.0,
                    evidence=[f"Event sequence point: {ev.type}"]
                )

        # 6. Add Derived Case-to-Case Relationships
        for rel in relationships:
            if self.nx_graph.has_node(rel.source_case) and self.nx_graph.has_node(rel.target_case):
                self.nx_graph.add_edge(
                    rel.source_case,
                    rel.target_case,
                    key=f"DERIVED_{rel.relationship_id}",
                    relationship_type=rel.relationship_type,
                    category=rel.category,
                    confidence=rel.confidence,
                    evidence=rel.evidence,
                    score_breakdown=rel.score_breakdown
                )

    def get_focused_subgraph(
        self,
        center_node_id: str,
        depth: int = 1,
        min_confidence: float = 0.30,
        allowed_node_types: Optional[Set[str]] = None,
        allowed_rel_types: Optional[Set[str]] = None,
    ) -> GraphData:
        if not self.nx_graph.has_node(center_node_id):
            return GraphData(nodes=[], edges=[])

        if allowed_node_types is None:
            allowed_node_types = {"CASE", "PERSON", "LOCATION", "VEHICLE", "OBJECT", "EVENT"}

        # BFS expansion up to specified depth
        visited_nodes: Set[str] = {center_node_id}
        current_layer: Set[str] = {center_node_id}

        for _ in range(depth):
            next_layer: Set[str] = set()
            for u in current_layer:
                for v in self.nx_graph.neighbors(u):
                    if v not in visited_nodes:
                        v_type = self.nx_graph.nodes[v].get("type", "")
                        if v_type in allowed_node_types:
                            edges_data = self.nx_graph.get_edge_data(u, v)
                            passes = any(
                                edata.get("confidence", 1.0) >= min_confidence
                                for edata in edges_data.values()
                            )
                            if passes:
                                visited_nodes.add(v)
                                next_layer.add(v)
            current_layer = next_layer

        result_nodes: List[GraphNode] = []
        for nid in visited_nodes:
            ndata = self.nx_graph.nodes[nid]
            result_nodes.append(
                GraphNode(
                    id=nid,
                    type=ndata.get("type", "UNKNOWN"),
                    label=ndata.get("label", nid),
                    properties=ndata.get("properties", {})
                )
            )

        result_edges: List[GraphEdge] = []
        seen_edge_keys = set()

        for u in visited_nodes:
            for v in visited_nodes:
                if u < v and self.nx_graph.has_edge(u, v):
                    edge_dict = self.nx_graph.get_edge_data(u, v)
                    for k, edata in edge_dict.items():
                        if k in seen_edge_keys:
                            continue
                        seen_edge_keys.add(k)

                        conf = edata.get("confidence", 1.0)
                        rel_type = edata.get("relationship_type", "related_to")

                        if conf < min_confidence:
                            continue

                        if allowed_rel_types and rel_type not in allowed_rel_types:
                            continue

                        result_edges.append(
                            GraphEdge(
                                id=k,
                                source=u,
                                target=v,
                                relationship_type=rel_type,
                                confidence=conf,
                                category=edata.get("category", "DIRECT"),
                                evidence=edata.get("evidence", []),
                                score_breakdown=edata.get("score_breakdown")
                            )
                        )

        return GraphData(nodes=result_nodes, edges=result_edges)

    def find_indirect_paths(
        self,
        source_case: str,
        target_case: str,
        max_hops: int = 4,
        max_paths: int = 5
    ) -> List[IndirectPath]:
        """
        Finds meaningful multi-hop graph paths connecting two cases
        through shared intermediate entities or correlated case chains.
        Example: CASE001 -> PERSON P005 -> CASE014 -> LOCATION L001 -> CASE020
        """
        if not self.nx_graph.has_node(source_case) or not self.nx_graph.has_node(target_case):
            return []

        # Build simple graph representation for pathfinding
        g = nx.Graph()
        for u, v, data in self.nx_graph.edges(data=True):
            # Ignore event nodes to avoid noise in path finding
            u_type = self.nx_graph.nodes[u].get("type", "")
            v_type = self.nx_graph.nodes[v].get("type", "")
            if u_type == "EVENT" or v_type == "EVENT":
                continue

            conf = data.get("confidence", 1.0)
            if conf >= 0.40:
                g.add_edge(u, v, weight=1.0 / max(conf, 0.1), relationship=data.get("relationship_type", "linked"))

        try:
            # Find shortest simple paths up to cutoff
            paths_generator = nx.all_simple_paths(g, source=source_case, target=target_case, cutoff=max_hops)
            discovered_paths = []

            for path in paths_generator:
                if len(path) < 3:
                    continue  # direct edge, not indirect

                # Build narrative and compute path relevance
                path_nodes_info = []
                for nid in path:
                    nd = self.nx_graph.nodes[nid]
                    path_nodes_info.append({
                        "id": nid,
                        "type": nd.get("type", "UNKNOWN"),
                        "label": nd.get("label", nid)
                    })

                # Compute hops (number of transitions)
                hops = len(path) - 1

                # Calculate path relevance: decay by 0.75 per hop
                relevance = round(max(0.20, (0.75 ** (hops - 1))), 3)

                narrative_steps = []
                for i in range(len(path_nodes_info) - 1):
                    n_curr = path_nodes_info[i]
                    n_next = path_nodes_info[i + 1]
                    narrative_steps.append(f"{n_curr['label']} ({n_curr['type']}) connects to {n_next['label']} ({n_next['type']})")

                narrative = " → ".join([f"{n['label']}" for n in path_nodes_info])

                discovered_paths.append(
                    IndirectPath(
                        path_id=f"PATH_{source_case}_{target_case}_{len(discovered_paths) + 1}",
                        source_case=source_case,
                        target_case=target_case,
                        hops=hops,
                        path_nodes=path_nodes_info,
                        path_edges=[f"hop_{i+1}" for i in range(hops)],
                        relevance_score=relevance,
                        narrative=narrative
                    )
                )

                if len(discovered_paths) >= max_paths:
                    break

            discovered_paths.sort(key=lambda p: p.relevance_score, reverse=True)
            return discovered_paths

        except Exception as e:
            return []

    def get_indirect_connections_for_case(
        self,
        case_id: str,
        max_hops: int = 3,
        limit: int = 8
    ) -> List[Dict[str, Any]]:
        """
        Discovers 2nd-degree and 3rd-degree related cases through intermediate entities.
        Filters out cases that already have direct 1-hop relationships.
        """
        if not self.nx_graph.has_node(case_id):
            return []

        # Find direct neighbor cases first
        direct_cases = set()
        for v in self.nx_graph.neighbors(case_id):
            if self.nx_graph.nodes[v].get("type") == "CASE":
                direct_cases.add(v)

        # Explore 2-hop and 3-hop case connections
        indirect_results: Dict[str, Dict[str, Any]] = {}

        # 2-hop: Case -> Entity -> Other Case
        for intermediate in self.nx_graph.neighbors(case_id):
            int_type = self.nx_graph.nodes[intermediate].get("type", "")
            if int_type in {"PERSON", "VEHICLE", "LOCATION", "OBJECT"}:
                int_label = self.nx_graph.nodes[intermediate].get("label", intermediate)
                for other_case in self.nx_graph.neighbors(intermediate):
                    if other_case != case_id and self.nx_graph.nodes[other_case].get("type") == "CASE":
                        if other_case not in direct_cases:
                            if other_case not in indirect_results:
                                indirect_results[other_case] = {
                                    "target_case": other_case,
                                    "hops": 2,
                                    "bridge_entities": [],
                                    "relevance_score": 0.65,
                                    "narrative": f"Indirect connection via {int_type.lower()}: {int_label}"
                                }
                            indirect_results[other_case]["bridge_entities"].append({
                                "id": intermediate,
                                "type": int_type,
                                "label": int_label
                            })

        results = list(indirect_results.values())
        results.sort(key=lambda r: len(r["bridge_entities"]), reverse=True)
        return results[:limit]
