from typing import List, Dict, Any, Optional, Set
import networkx as nx
from backend.app.models.case_models import CaseModel
from backend.app.models.entity_models import (
    CityEntity,
    CrimeCodeEntity,
    CrimeDescriptionEntity,
    WeaponEntity,
    CrimeDomainEntity,
    EntityListResponse,
)
from backend.app.models.relationship_models import RelationshipExplanation
from backend.app.models.graph_models import GraphNode, GraphEdge, GraphData


class GraphService:
    """
    Constructs and queries real-entity knowledge graphs for the Indian Crime dataset.
    Entities: CASE, CITY, CRIME, CRIME_DOMAIN, WEAPON.
    Avoids rendering unwieldy 40k-node graphs by providing bounded ego-graphs,
    neighborhood expansions, and configurable relation limits.
    """

    def __init__(self):
        self.nx_graph = nx.MultiGraph()
        self.case_map: Dict[str, CaseModel] = {}

    def initialize(self, cases: List[CaseModel], entities: EntityListResponse):
        """
        Initializes graph structure and indexes entities.
        """
        self.case_map = {c.case_id: c for c in cases}
        self.nx_graph.clear()

        # Add dimension entity nodes to the master graph
        for city in entities.cities:
            self.nx_graph.add_node(
                city.city_id,
                type="CITY",
                label=city.name,
                case_count=city.case_count,
            )

        for desc in entities.crime_descriptions:
            self.nx_graph.add_node(
                desc.crime_description_id,
                type="CRIME",
                label=desc.name,
                case_count=desc.case_count,
            )

        for weapon in entities.weapons:
            self.nx_graph.add_node(
                weapon.weapon_id,
                type="WEAPON",
                label=weapon.name,
                case_count=weapon.case_count,
            )

        for domain in entities.crime_domains:
            self.nx_graph.add_node(
                domain.domain_id,
                type="CRIME_DOMAIN",
                label=domain.name,
                case_count=domain.case_count,
            )

    def get_case_ego_graph(
        self,
        case_id: str,
        relationships: List[RelationshipExplanation],
        max_related: int = 10,
    ) -> GraphData:
        """
        Generates an ego-network centered on the requested case, including its
        structural entity connections (City, Crime, Domain, Weapon) and top related cases.
        """
        target_case = self.case_map.get(case_id)
        if not target_case:
            return GraphData(nodes=[], edges=[])

        nodes: Dict[str, GraphNode] = {}
        edges: List[GraphEdge] = []

        # 1. Target Case Node (Center)
        nodes[target_case.case_id] = GraphNode(
            id=target_case.case_id,
            type="CASE",
            label=target_case.case_id,
            properties={
                "crime": target_case.incident.crime_description,
                "city": target_case.location.city,
                "domain": target_case.incident.crime_domain,
                "weapon": target_case.weapon.used or "None specified",
                "status": target_case.status,
                "is_focus": True,
            },
        )

        # 2. Structural Entity Nodes for Focus Case
        city_node_id = target_case.graph_entities.city_node or f"CITY::{target_case.location.city.lower()}"
        nodes[city_node_id] = GraphNode(
            id=city_node_id,
            type="CITY",
            label=target_case.location.city,
            properties={"name": target_case.location.city},
        )
        edges.append(
            GraphEdge(
                id=f"EDGE::{target_case.case_id}::{city_node_id}",
                source=target_case.case_id,
                target=city_node_id,
                relationship_type="occurred_in",
                confidence=1.0,
                category="DIRECT",
            )
        )

        crime_node_id = target_case.graph_entities.crime_node or f"CRIME::{target_case.incident.crime_code}"
        nodes[crime_node_id] = GraphNode(
            id=crime_node_id,
            type="CRIME",
            label=f"{target_case.incident.crime_description} (#{target_case.incident.crime_code})",
            properties={"code": target_case.incident.crime_code, "name": target_case.incident.crime_description},
        )
        edges.append(
            GraphEdge(
                id=f"EDGE::{target_case.case_id}::{crime_node_id}",
                source=target_case.case_id,
                target=crime_node_id,
                relationship_type="has_crime_type",
                confidence=1.0,
                category="DIRECT",
            )
        )

        domain_node_id = target_case.graph_entities.domain_node or f"DOMAIN::{target_case.incident.crime_domain.lower()}"
        nodes[domain_node_id] = GraphNode(
            id=domain_node_id,
            type="CRIME_DOMAIN",
            label=target_case.incident.crime_domain,
            properties={"name": target_case.incident.crime_domain},
        )
        edges.append(
            GraphEdge(
                id=f"EDGE::{target_case.case_id}::{domain_node_id}",
                source=target_case.case_id,
                target=domain_node_id,
                relationship_type="belongs_to",
                confidence=1.0,
                category="DIRECT",
            )
        )

        if target_case.weapon.used and target_case.graph_entities.weapon_node:
            weapon_node_id = target_case.graph_entities.weapon_node
            nodes[weapon_node_id] = GraphNode(
                id=weapon_node_id,
                type="WEAPON",
                label=target_case.weapon.used,
                properties={"name": target_case.weapon.used},
            )
            edges.append(
                GraphEdge(
                    id=f"EDGE::{target_case.case_id}::{weapon_node_id}",
                    source=target_case.case_id,
                    target=weapon_node_id,
                    relationship_type="involved_weapon",
                    confidence=1.0,
                    category="DIRECT",
                )
            )

        # 3. Top Related Cases
        for rel in relationships[:max_related]:
            other_id = rel.target_case if rel.target_case != target_case.case_id else rel.source_case
            other_case = self.case_map.get(other_id)
            if not other_case:
                continue

            # Add Related Case Node
            if other_id not in nodes:
                nodes[other_id] = GraphNode(
                    id=other_id,
                    type="CASE",
                    label=other_id,
                    properties={
                        "crime": other_case.incident.crime_description,
                        "city": other_case.location.city,
                        "domain": other_case.incident.crime_domain,
                        "weapon": other_case.weapon.used or "None specified",
                        "status": other_case.status,
                        "confidence": rel.confidence,
                        "is_focus": False,
                    },
                )

            # Add Relationship Edge between cases
            edges.append(
                GraphEdge(
                    id=f"EDGE::{target_case.case_id}::{other_id}",
                    source=target_case.case_id,
                    target=other_id,
                    relationship_type="similar_incident_profile",
                    relationship_type_label=rel.relationship_type_label or "SIMILAR INCIDENT PROFILE",
                    edge_label=rel.edge_label or f"{int(round(rel.confidence * 100))}% • Incident Concordance",
                    confidence=rel.confidence,
                    category=rel.category,
                    evidence=rel.evidence,
                    score_breakdown=rel.score_breakdown,
                )
            )

            # Link related case to shared attribute nodes if present in nodes dictionary
            other_city_id = other_case.graph_entities.city_node
            if other_city_id and other_city_id in nodes:
                edges.append(
                    GraphEdge(
                        id=f"EDGE::{other_id}::{other_city_id}",
                        source=other_id,
                        target=other_city_id,
                        relationship_type="occurred_in",
                        confidence=1.0,
                        category="DIRECT",
                    )
                )

            other_crime_id = other_case.graph_entities.crime_node
            if other_crime_id and other_crime_id in nodes:
                edges.append(
                    GraphEdge(
                        id=f"EDGE::{other_id}::{other_crime_id}",
                        source=other_id,
                        target=other_crime_id,
                        relationship_type="has_crime_type",
                        confidence=1.0,
                        category="DIRECT",
                    )
                )

            other_weapon_id = other_case.graph_entities.weapon_node
            if other_weapon_id and other_weapon_id in nodes:
                edges.append(
                    GraphEdge(
                        id=f"EDGE::{other_id}::{other_weapon_id}",
                        source=other_id,
                        target=other_weapon_id,
                        relationship_type="involved_weapon",
                        confidence=1.0,
                        category="DIRECT",
                    )
                )

        return GraphData(nodes=list(nodes.values()), edges=edges)

    def get_overview_graph(
        self,
        focus_case_id: Optional[str] = None,
        relationships: Optional[List[RelationshipExplanation]] = None,
    ) -> GraphData:
        """
        Returns a focused graph view. Defaults to first case or focus case.
        """
        cid = focus_case_id or (next(iter(self.case_map.keys())) if self.case_map else "IND-CASE-00001")
        rels = relationships or []
        return self.get_case_ego_graph(cid, rels, max_related=10)
