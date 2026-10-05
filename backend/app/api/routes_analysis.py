from typing import Dict, Any, List
from fastapi import APIRouter, Query
from backend.app.state import app_state
from backend.app.services.analysis_service import AnalysisService
from backend.app.services.anomaly_service import AnomalyService
from backend.app.services.evaluation_service import EvaluationService
from backend.app.models.relationship_models import CaseCluster

router = APIRouter(prefix="/api", tags=["Analysis & Evaluation"])


@router.get("/stats", response_model=Dict[str, Any])
def get_dashboard_stats():
    return AnalysisService.get_summary_stats(
        app_state.cases,
        app_state.entities,
        app_state.relationships
    )


@router.get("/patterns", response_model=List[Dict[str, Any]])
def get_patterns():
    return AnalysisService.detect_patterns(
        app_state.cases,
        app_state.relationships,
        app_state.entities
    )


@router.get("/clusters", response_model=List[CaseCluster])
def get_case_clusters():
    return app_state.clusters


@router.get("/anomalies", response_model=List[Dict[str, Any]])
def get_anomalies():
    return AnomalyService.get_all_anomalies(
        app_state.cases,
        app_state.entities
    )


@router.get("/evaluation", response_model=Dict[str, Any])
def get_benchmark_evaluation(
    min_confidence: float = Query(0.45, ge=0.1, le=1.0)
):
    gt_data = app_state.provider.load_ground_truth_for_evaluation_only()
    return EvaluationService.evaluate(
        discovered=app_state.relationships,
        ground_truth_raw=gt_data,
        confidence_threshold=min_confidence,
        cases=app_state.cases
    )


@router.post("/analysis/rebuild", response_model=Dict[str, Any])
def rebuild_relationships():
    app_state.initialize(force_recompute=True)
    return {
        "status": "success",
        "message": f"Successfully recomputed relationships and reconstructed graph across {len(app_state.cases)} cases.",
        "relationships_discovered": len(app_state.relationships),
        "clusters_discovered": len(app_state.clusters),
        "graph_nodes": app_state.graph_service.nx_graph.number_of_nodes(),
        "graph_edges": app_state.graph_service.nx_graph.number_of_edges()
    }
