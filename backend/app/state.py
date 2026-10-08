import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from backend.app.config import (
    load_relationship_config,
    DERIVED_DIR,
    DERIVED_PATTERNS_PATH,
    DERIVED_ANOMALIES_PATH,
    DERIVED_STATS_PATH,
)
from backend.app.models.case_models import CaseModel
from backend.app.models.entity_models import EntityListResponse
from backend.app.models.relationship_models import CaseCluster, CasePattern, RelationshipExplanation
from backend.app.services.data_loader import IndianCrimeJsonProvider
from backend.app.services.data_normalizer import DataNormalizer
from backend.app.services.relationship_engine import RelationshipEngine
from backend.app.services.semantic_similarity import SemanticSimilarityService
from backend.app.services.graph_service import GraphService
from backend.app.services.clustering_service import ClusteringService
from backend.app.services.anomaly_service import AnomalyService
from backend.app.services.analysis_service import AnalysisService


class AppState:
    """
    Central in-memory state repository for the Real Indian Crime Intelligence Portal.
    Indexes 40,160 records with high-performance inverted indexes and on-demand
    explainable relationship discovery.
    """

    def __init__(self):
        self.config = load_relationship_config()
        self.provider = IndianCrimeJsonProvider()
        self.cases: List[CaseModel] = []
        self.case_map: Dict[str, CaseModel] = {}
        self.entities: EntityListResponse = EntityListResponse()
        self.semantic_service = SemanticSimilarityService()
        self.graph_service = GraphService()
        self.engine: Optional[RelationshipEngine] = None
        self.patterns: List[CasePattern] = []
        self.clusters: List[CaseCluster] = []
        self.anomalies: List[Dict[str, Any]] = []
        self.stats: Dict[str, Any] = {}
        self.analytics: Dict[str, Any] = {}

    def initialize(self, force_recompute: bool = False):
        print("[PORTAL STARTUP] Loading 40,160 real Indian Crime incident records...")
        raw_cases = self.provider.load_cases()
        self.cases = DataNormalizer.normalize_all(raw_cases)
        self.case_map = {c.case_id: c for c in self.cases}
        self.entities = self.provider.load_entities()

        print("[PORTAL STARTUP] Fitting narrative semantic TF-IDF profile model...")
        self.semantic_service.fit_corpus(self.cases)

        print("[PORTAL STARTUP] Indexing corpus into Relationship Intelligence Engine...")
        self.engine = RelationshipEngine(self.config, self.semantic_service)
        self.engine.index_corpus(self.cases)

        print("[PORTAL STARTUP] Initializing multi-entity knowledge graph structure...")
        self.graph_service.initialize(self.cases, self.entities)

        print("[PORTAL STARTUP] Mining recurrent incident patterns and clusters...")
        self.patterns = ClusteringService.get_recurrent_patterns(self.cases, limit=30)
        self.clusters = ClusteringService.cluster_cases(self.cases, limit=15)

        print("[PORTAL STARTUP] Computing investigative statistical anomalies...")
        self.anomalies = AnomalyService.get_all_anomalies(self.cases)

        print("[PORTAL STARTUP] Calculating global analytics & dimension distributions...")
        self.stats = AnalysisService.get_summary_stats(
            self.cases, self.entities, anomalies_count=len(self.anomalies)
        )
        self.analytics = AnalysisService.get_analytics_breakdown(self.cases)

        # Warm up top relationships cache for first few cases
        print("[PORTAL STARTUP] Pre-warming cache for initial case queries...")
        for c in self.cases[:25]:
            self.engine.get_related_cases(c.case_id, limit=15)

        # Persist derived intelligence separately in data/derived/
        self._persist_derived_intelligence()

        print(
            f"[PORTAL READY] Successfully initialized: {len(self.cases)} cases, "
            f"{len(self.entities.cities)} cities, {len(self.entities.crime_descriptions)} crime types, "
            f"{len(self.patterns)} recurrent patterns discovered."
        )

    def _persist_derived_intelligence(self):
        try:
            DERIVED_DIR.mkdir(parents=True, exist_ok=True)
            with open(DERIVED_PATTERNS_PATH, "w", encoding="utf-8") as f:
                json.dump([p.model_dump() for p in self.patterns], f, indent=2)
            with open(DERIVED_ANOMALIES_PATH, "w", encoding="utf-8") as f:
                json.dump(self.anomalies, f, indent=2)
            with open(DERIVED_STATS_PATH, "w", encoding="utf-8") as f:
                json.dump(self.stats, f, indent=2)
        except Exception as e:
            print(f"[PORTAL WARNING] Could not persist derived intelligence: {e}")


# Global singleton instance
app_state = AppState()
