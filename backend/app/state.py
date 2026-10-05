import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from backend.app.config import load_relationship_config, DERIVED_CACHE_PATH
from backend.app.models.case_models import CaseModel
from backend.app.models.relationship_models import RelationshipExplanation, CaseCluster
from backend.app.services.data_loader import JSONCaseDataProvider
from backend.app.services.data_normalizer import DataNormalizer
from backend.app.services.relationship_engine import RelationshipEngine
from backend.app.services.graph_service import GraphService
from backend.app.services.clustering_service import ClusteringService
from backend.app.services.anomaly_service import AnomalyService


class AppState:
    """
    Central in-memory state repository for the Crime Intelligence portal.
    Initializes on server launch and can be recomputed dynamically.
    """

    def __init__(self):
        self.config = load_relationship_config()
        self.provider = JSONCaseDataProvider()
        self.cases: List[CaseModel] = []
        self.entities: Dict[str, Any] = {}
        self.relationships: List[RelationshipExplanation] = []
        self.case_map: Dict[str, CaseModel] = {}
        self.case_relationships_map: Dict[str, List[RelationshipExplanation]] = {}
        self.graph_service = GraphService()
        self.engine: Optional[RelationshipEngine] = None
        self.clusters: List[CaseCluster] = []
        self.anomalies: List[Dict[str, Any]] = []

    def initialize(self, force_recompute: bool = True):
        raw_cases = self.provider.load_cases()
        self.cases = DataNormalizer.normalize_all(raw_cases)
        self.case_map = {c.case_id: c for c in self.cases}
        self.entities = self.provider.load_entities()

        self.engine = RelationshipEngine(self.config)

        # Force recompute to ensure upgraded feature extraction & layered scoring are applied
        self.recompute_relationships()
        self._build_indexes()
        self.graph_service.build_full_graph(self.cases, self.entities, self.relationships)

        # Compute clusters
        loc_map = self.entities.get("location_map", {})
        self.clusters = ClusteringService.cluster_cases(self.cases, loc_map)

        # Compute anomalies
        self.anomalies = AnomalyService.get_all_anomalies(self.cases, self.entities)

    def recompute_relationships(self):
        if not self.engine:
            self.engine = RelationshipEngine(self.config)
        self.relationships = self.engine.discover_all_relationships(self.cases, self.entities)

        # Save to derived cache without overwriting raw dataset
        try:
            DERIVED_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
            with open(DERIVED_CACHE_PATH, "w", encoding="utf-8") as f:
                json.dump([r.model_dump() for r in self.relationships], f, indent=2)
        except Exception:
            pass

    def _build_indexes(self):
        self.case_relationships_map = {}
        for r in self.relationships:
            self.case_relationships_map.setdefault(r.source_case, []).append(r)
            self.case_relationships_map.setdefault(r.target_case, []).append(r)


# Global singleton instance
app_state = AppState()
