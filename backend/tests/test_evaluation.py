import pytest
from backend.app.state import app_state
from backend.app.services.evaluation_service import EvaluationService


def test_evaluation_service_metrics():
    gt = app_state.provider.load_ground_truth_for_evaluation_only()
    result = EvaluationService.evaluate(
        discovered=app_state.relationships,
        ground_truth_raw=gt,
        confidence_threshold=0.50,
        cases=app_state.cases
    )

    metrics = result["metrics"]
    assert metrics["ground_truth_total"] > 0
    assert metrics["matched_relationships"] > 0
    assert metrics["recall"] > 0.70  # Substantial recall on benchmark ground truth
    assert len(result["negative_control_checks"]) > 0
