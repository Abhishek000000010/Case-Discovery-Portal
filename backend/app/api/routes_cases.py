from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from backend.app.models.case_models import (
    CaseModel,
    CaseDetailResponse,
    EnrichedPerson,
    EnrichedLocation,
    EnrichedVehicle,
    EnrichedObject,
)
from backend.app.models.relationship_models import (
    RelationshipExplanation,
    RelationshipDebugResponse,
    IndirectPath,
    NextSignal,
)
from backend.app.models.graph_models import GraphData
from backend.app.state import app_state
from backend.app.services.clustering_service import ClusteringService

router = APIRouter(prefix="/api/cases", tags=["Cases"])


@router.get("", response_model=dict)
def list_cases(
    q: Optional[str] = None,
    crime_type: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    location_id: Optional[str] = None,
    sort_by: str = Query("reported_date", enum=["reported_date", "incident_date", "severity", "case_id"]),
    sort_order: str = Query("desc", enum=["asc", "desc"]),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=120),
):
    cases = list(app_state.cases)

    # Filter by query search in summary, case_id, tags
    if q:
        q_lower = q.lower().strip()
        cases = [
            c for c in cases
            if q_lower in c.case_id.lower()
            or q_lower in c.summary.lower()
            or any(q_lower in t.lower() for t in c.tags)
            or any(q_lower in m.lower() for m in c.modus_operandi)
        ]

    # Filters
    if crime_type and crime_type != "all":
        cases = [c for c in cases if c.case_type.lower() == crime_type.lower()]

    if severity and severity != "all":
        cases = [c for c in cases if c.severity.lower() == severity.lower()]

    if status and status != "all":
        cases = [c for c in cases if c.status.lower() == status.lower()]

    if location_id and location_id != "all":
        cases = [c for c in cases if any(l.location_id == location_id for l in c.locations)]

    # Sorting
    reverse = (sort_order == "desc")
    if sort_by == "reported_date":
        cases.sort(key=lambda c: (c.reported_date or ""), reverse=reverse)
    elif sort_by == "incident_date":
        cases.sort(key=lambda c: (c.incident_date or ""), reverse=reverse)
    elif sort_by == "severity":
        sev_rank = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        cases.sort(key=lambda c: sev_rank.get(c.severity.lower(), 0), reverse=reverse)
    else:
        cases.sort(key=lambda c: c.case_id, reverse=reverse)

    total_count = len(cases)
    start_idx = (page - 1) * page_size
    paged_cases = cases[start_idx: start_idx + page_size]

    enhanced_list = []
    for c in paged_cases:
        c_dict = c.model_dump()
        c_dict["related_cases_count"] = len(app_state.case_relationships_map.get(c.case_id, []))
        c_dict["people_count"] = len(c.people_involved)
        c_dict["location_names"] = [
            app_state.entities["location_map"][l.location_id].name
            for l in c.locations
            if l.location_id in app_state.entities.get("location_map", {})
        ]
        enhanced_list.append(c_dict)

    return {
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size,
        "cases": enhanced_list
    }


@router.get("/{case_id}", response_model=CaseDetailResponse)
def get_case_detail(case_id: str):
    if case_id not in app_state.case_map:
        raise HTTPException(status_code=404, detail=f"Case with ID '{case_id}' not found")

    case = app_state.case_map[case_id]
    ent = app_state.entities

    enriched_people = []
    for pref in case.people_involved:
        if pref.person_id in ent["person_map"]:
            enriched_people.append(
                EnrichedPerson(person=ent["person_map"][pref.person_id], role=pref.role)
            )

    enriched_locations = []
    for lref in case.locations:
        if lref.location_id in ent["location_map"]:
            enriched_locations.append(
                EnrichedLocation(location=ent["location_map"][lref.location_id], role=lref.role)
            )

    enriched_vehicles = []
    for vref in case.vehicles:
        if vref.vehicle_id in ent["vehicle_map"]:
            enriched_vehicles.append(
                EnrichedVehicle(vehicle=ent["vehicle_map"][vref.vehicle_id], role=vref.role)
            )

    enriched_objects = []
    for oref in case.objects:
        if oref.object_id in ent["object_map"]:
            enriched_objects.append(
                EnrichedObject(object=ent["object_map"][oref.object_id], role=oref.role)
            )

    related_count = len(app_state.case_relationships_map.get(case_id, []))

    return CaseDetailResponse(
        case=case,
        enriched_people=enriched_people,
        enriched_locations=enriched_locations,
        enriched_vehicles=enriched_vehicles,
        enriched_objects=enriched_objects,
        related_cases_count=related_count
    )


@router.get("/{case_id}/relationships", response_model=List[RelationshipExplanation])
def get_case_relationships(
    case_id: str,
    min_confidence: float = Query(0.30, ge=0.0, le=1.0)
):
    if case_id not in app_state.case_map:
        raise HTTPException(status_code=404, detail=f"Case with ID '{case_id}' not found")

    rels = app_state.case_relationships_map.get(case_id, [])
    filtered = [r for r in rels if r.confidence >= min_confidence]
    filtered.sort(key=lambda r: r.confidence, reverse=True)
    return filtered


@router.get("/{case_id}/graph", response_model=GraphData)
def get_case_subgraph(
    case_id: str,
    depth: int = Query(1, ge=1, le=2),
    min_confidence: float = Query(0.30, ge=0.0, le=1.0)
):
    if case_id not in app_state.case_map:
        raise HTTPException(status_code=404, detail=f"Case with ID '{case_id}' not found")

    return app_state.graph_service.get_focused_subgraph(
        center_node_id=case_id,
        depth=depth,
        min_confidence=min_confidence
    )


@router.get("/{case_id}/relationship-debug/{target_case_id}", response_model=RelationshipDebugResponse)
def debug_case_relationship(case_id: str, target_case_id: str):
    """
    Section 26 Debug Mode:
    Exposes raw candidate generation reasons, feature extraction vector,
    scoring weights, score breakdown, threshold, decision, and evidence explanation.
    """
    if case_id not in app_state.case_map:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found")
    if target_case_id not in app_state.case_map:
        raise HTTPException(status_code=404, detail=f"Target Case '{target_case_id}' not found")

    case_a = app_state.case_map[case_id]
    case_b = app_state.case_map[target_case_id]
    engine = app_state.engine

    # 1. Check candidate generation reasons
    candidates = engine.generate_candidate_pairs(
        [case_a, case_b], app_state.entities["location_map"]
    )
    cand_reasons = []
    if candidates:
        cand_reasons = candidates[0].candidate_reasons

    # 2. Extract features
    features = engine.extract_features(
        case_a,
        case_b,
        app_state.entities["location_map"],
        app_state.entities["vehicle_map"],
        app_state.entities["person_map"],
        app_state.entities["object_map"]
    )

    # 3. Score case pair
    rel = engine.score_case_pair(
        case_a,
        case_b,
        app_state.entities["location_map"],
        app_state.entities["vehicle_map"],
        app_state.entities["person_map"],
        app_state.entities["object_map"],
        candidate_reasons=cand_reasons
    )

    threshold = engine.thresholds.get("minimum_confidence_for_ui", 0.30)
    final_score = rel.confidence if rel else 0.0
    decision = f"SURFACED ({rel.category})" if rel else "REJECTED (Below threshold 0.30)"
    explanation = rel.evidence if rel else ["Score did not satisfy minimum investigative correlation threshold."]

    score_dict = rel.score_breakdown.model_dump() if rel else {}

    return RelationshipDebugResponse(
        case_a_id=case_id,
        case_b_id=target_case_id,
        candidate_reasons=cand_reasons,
        features=features,
        weights=engine.weights,
        score_breakdown=score_dict,
        final_score=final_score,
        threshold=threshold,
        decision=decision,
        explanation=explanation
    )


@router.get("/{case_id}/indirect-paths/{target_case_id}", response_model=List[IndirectPath])
def get_indirect_paths(case_id: str, target_case_id: str, max_hops: int = Query(4, ge=2, le=5)):
    """
    Section 12: Graph Path Analysis.
    Surfaces 2nd and 3rd degree indirect paths between two crime cases.
    """
    if case_id not in app_state.case_map or target_case_id not in app_state.case_map:
        raise HTTPException(status_code=404, detail="One or both cases not found")

    return app_state.graph_service.find_indirect_paths(
        source_case=case_id,
        target_case=target_case_id,
        max_hops=max_hops
    )


@router.get("/{case_id}/indirect-connections", response_model=List[Dict[str, Any]])
def get_indirect_connections(case_id: str, limit: int = Query(8, ge=1, le=20)):
    """
    Discovers second-degree related cases connected through bridge entities.
    """
    if case_id not in app_state.case_map:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found")

    return app_state.graph_service.get_indirect_connections_for_case(case_id, limit=limit)


@router.get("/{case_id}/next-signals", response_model=List[NextSignal])
def get_case_next_signals(case_id: str):
    """
    Section 20: Investigative 'Next Signals'.
    Surfaces historical probabilistic transition indicators for investigative prioritization.
    """
    if case_id not in app_state.case_map:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found")

    case = app_state.case_map[case_id]
    loc_map = app_state.entities.get("location_map", {})
    return ClusteringService.infer_next_signals(case, app_state.cases, loc_map)


@router.get("/{case_id}/intelligence-summary", response_model=Dict[str, Any])
def get_case_intelligence_summary(case_id: str):
    """
    Section 22: Dynamically generated Case Intelligence Summary.
    """
    if case_id not in app_state.case_map:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found")

    case = app_state.case_map[case_id]
    rels = app_state.case_relationships_map.get(case_id, [])
    rels.sort(key=lambda r: r.confidence, reverse=True)

    high_conf = [r for r in rels if r.confidence >= 0.70]
    very_high_conf = [r for r in rels if r.confidence >= 0.85]

    # Recurring entities in this case
    recurring_people = sum(
        1 for p in case.people_involved
        if app_state.engine.person_frequencies.get(p.person_id, 0) >= 3
    )

    # Patterns matching this case
    patterns_count = sum(
        1 for cl in app_state.clusters
        if case_id in cl.case_ids
    )

    # Potential anomalies matching this case
    anomalies_list = getattr(app_state, "anomalies", [])
    anomalies_count = sum(
        1 for anom in anomalies_list
        if case_id in (anom.get("involved_cases", []) if isinstance(anom, dict) else getattr(anom, "involved_cases", []))
    )

    # Most significant relationship
    most_sig = None
    if rels:
        top = rels[0]
        other_cid = top.target_case if top.source_case == case_id else top.source_case
        reason_summary = top.evidence[0] if top.evidence else top.relationship_type.replace("_", " ")
        most_sig = {
            "case_id": other_cid,
            "confidence": top.confidence,
            "category": top.category,
            "relationship_type": top.relationship_type,
            "reason": reason_summary,
            "supporting_signals": top.supporting_signals
        }

    # Ranked relationships summary
    ranked = []
    for r in rels[:5]:
        other_cid = r.target_case if r.source_case == case_id else r.source_case
        ranked.append({
            "case_id": other_cid,
            "score": r.confidence,
            "category": r.category,
            "relationship_type": r.relationship_type.replace("_", " ").title(),
            "reason": r.evidence[0] if r.evidence else "Multi-factor correlation",
            "supporting_signals": r.supporting_signals
        })

    return {
        "case_id": case_id,
        "related_cases_count": len(rels),
        "high_confidence_count": len(high_conf),
        "very_high_confidence_count": len(very_high_conf),
        "recurring_entities_count": recurring_people,
        "detected_patterns_count": patterns_count,
        "potential_anomalies_count": anomalies_count,
        "most_significant_relationship": most_sig,
        "ranked_relationships": ranked
    }
