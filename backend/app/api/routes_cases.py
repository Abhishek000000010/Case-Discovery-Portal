from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from backend.app.models.case_models import CaseModel, CaseDetailResponse
from backend.app.models.relationship_models import (
    RelationshipExplanation,
    RelationshipDebugResponse,
)
from backend.app.models.graph_models import GraphData
from backend.app.state import app_state

router = APIRouter(prefix="/api/cases", tags=["Cases"])


@router.get("", response_model=dict)
def list_cases(
    q: Optional[str] = None,
    city: Optional[str] = None,
    crime_description: Optional[str] = None,
    crime_domain: Optional[str] = None,
    weapon: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = Query("case_id", enum=["case_id", "incident_date", "police_deployed", "closure_duration_days"]),
    sort_order: str = Query("asc", enum=["asc", "desc"]),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
):
    cases = app_state.cases

    # Text search
    if q:
        q_lower = q.lower().strip()
        filtered = []
        for c in cases:
            if (
                q_lower in c.case_id.lower()
                or q_lower in str(c.source.source_report_number)
                or q_lower in c.location.city.lower()
                or q_lower in c.incident.crime_description.lower()
                or q_lower in str(c.incident.crime_code)
                or q_lower in c.incident.crime_domain.lower()
                or (c.weapon.used and q_lower in c.weapon.used.lower())
                or (c.victim.gender and q_lower == c.victim.gender.lower())
            ):
                filtered.append(c)
        cases = filtered

    # Structural filters
    if city and city.lower() != "all":
        city_lower = city.lower()
        cases = [c for c in cases if c.location.city.lower() == city_lower]

    if crime_description and crime_description.lower() != "all":
        crime_lower = crime_description.lower()
        cases = [c for c in cases if c.incident.crime_description.lower() == crime_lower]

    if crime_domain and crime_domain.lower() != "all":
        domain_lower = crime_domain.lower()
        cases = [c for c in cases if c.incident.crime_domain.lower() == domain_lower]

    if weapon and weapon.lower() != "all":
        weap_lower = weapon.lower()
        cases = [c for c in cases if (c.weapon.used or "").lower() == weap_lower]

    if status and status.lower() != "all":
        is_closed = (status.lower() == "closed")
        cases = [c for c in cases if c.investigation.case_closed == is_closed]

    # Sorting
    reverse = (sort_order == "desc")
    if sort_by == "incident_date":
        cases = sorted(cases, key=lambda c: (c.incident.date_of_occurrence or c.incident.time_of_occurrence or ""), reverse=reverse)
    elif sort_by == "police_deployed":
        cases = sorted(cases, key=lambda c: (c.investigation.police_deployed or 0), reverse=reverse)
    elif sort_by == "closure_duration_days":
        cases = sorted(cases, key=lambda c: (c.investigation.closure_duration_days or 0.0), reverse=reverse)
    else:
        cases = sorted(cases, key=lambda c: c.case_id, reverse=reverse)

    total_count = len(cases)
    start_idx = (page - 1) * page_size
    paged_cases = cases[start_idx : start_idx + page_size]

    return {
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size if total_count > 0 else 1,
        "cases": [c.model_dump() for c in paged_cases],
    }


@router.get("/{case_id}", response_model=CaseDetailResponse)
def get_case_detail(case_id: str):
    if case_id not in app_state.case_map:
        raise HTTPException(status_code=404, detail=f"Case with ID '{case_id}' not found")

    case = app_state.case_map[case_id]
    related = app_state.engine.get_related_cases(case_id, min_confidence=0.35, limit=20)

    dim_info = {
        "city_total_cases": sum(1 for c in app_state.entities.cities if c.name == case.location.city),
        "crime_description": case.incident.crime_description,
        "crime_code": case.incident.crime_code,
        "crime_domain": case.incident.crime_domain,
    }

    return CaseDetailResponse(
        case=case,
        dimension_info=dim_info,
        related_cases_count=len(related),
    )


@router.get("/{case_id}/relationships", response_model=List[RelationshipExplanation])
def get_case_relationships(
    case_id: str,
    min_confidence: float = Query(0.35, ge=0.0, le=1.0),
    limit: int = Query(20, ge=1, le=100),
):
    if case_id not in app_state.case_map:
        raise HTTPException(status_code=404, detail=f"Case with ID '{case_id}' not found")

    return app_state.engine.get_related_cases(case_id, min_confidence=min_confidence, limit=limit)


@router.get("/{case_id}/graph", response_model=GraphData)
def get_case_subgraph(
    case_id: str,
    max_related: int = Query(10, ge=1, le=50),
    min_confidence: float = Query(0.35, ge=0.0, le=1.0),
):
    if case_id not in app_state.case_map:
        raise HTTPException(status_code=404, detail=f"Case with ID '{case_id}' not found")

    related = app_state.engine.get_related_cases(case_id, min_confidence=min_confidence, limit=max_related)
    return app_state.graph_service.get_case_ego_graph(case_id, related, max_related=max_related)


@router.get("/{case_id}/relationship-debug/{target_case_id}", response_model=RelationshipDebugResponse)
def debug_case_relationship(case_id: str, target_case_id: str):
    if case_id not in app_state.case_map:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found")
    if target_case_id not in app_state.case_map:
        raise HTTPException(status_code=404, detail=f"Target Case '{target_case_id}' not found")

    case_a = app_state.case_map[case_id]
    case_b = app_state.case_map[target_case_id]
    engine = app_state.engine

    features = engine.extract_features(case_a, case_b)
    final_score, breakdown = engine.score_features(features)
    threshold = engine.thresholds.get("minimum_confidence_for_ui", 0.35)
    decision = "ACCEPT - Statistically Significant Profile Match" if final_score >= threshold else "REJECT - Below Confidence Threshold"

    from backend.app.services.relationship_explanation_service import RelationshipExplanationService
    explanation = RelationshipExplanationService.generate_explanation_bullets(features, case_a, case_b)

    cand_reasons = []
    if features.same_city:
        cand_reasons.append("same_city")
    if features.crime_code_match:
        cand_reasons.append("same_crime_code")
    if features.weapon_match:
        cand_reasons.append("same_weapon")

    return RelationshipDebugResponse(
        case_a_id=case_id,
        case_b_id=target_case_id,
        candidate_reasons=cand_reasons,
        features=features,
        weights=engine.weights,
        score_breakdown=breakdown.model_dump(),
        final_score=final_score,
        threshold=threshold,
        decision=decision,
        explanation=explanation,
    )
