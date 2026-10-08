from fastapi import APIRouter, HTTPException
from backend.app.models.relationship_models import RelationshipExplanationResponse
from backend.app.services.relationship_explanation_service import RelationshipExplanationService
from backend.app.state import app_state

router = APIRouter(prefix="/api/relationships", tags=["Relationship Intelligence"])


@router.get(
    "/{source_case_id}/{target_case_id}/explanation",
    response_model=RelationshipExplanationResponse,
    summary="Get Explainable Relationship Analysis Between Two Cases",
)
def get_relationship_explanation(source_case_id: str, target_case_id: str):
    """
    Forensically analyzes and explains the multi-signal relationship between two real cases.
    Identifies supporting signals, weakening signals, factual attribute comparisons,
    configured score contributions, and connection pathways without fabricating data.
    """
    if source_case_id not in app_state.case_map:
        raise HTTPException(
            status_code=404,
            detail=f"Source Case '{source_case_id}' not found in active repository",
        )
    if target_case_id not in app_state.case_map:
        raise HTTPException(
            status_code=404,
            detail=f"Target Case '{target_case_id}' not found in active repository",
        )

    case_a = app_state.case_map[source_case_id]
    case_b = app_state.case_map[target_case_id]
    engine = app_state.engine

    # Extract empirical comparison features
    features = engine.extract_features(case_a, case_b)
    final_score, breakdown = engine.score_features(features)

    # Generate full explainable payload
    explanation_response = RelationshipExplanationService.explain_relationship(
        case_a=case_a,
        case_b=case_b,
        features=features,
        confidence=final_score,
        weights=engine.weights,
    )

    return explanation_response
