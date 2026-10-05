from typing import List, Dict, Any
from fastapi import APIRouter, Query
from rapidfuzz import fuzz
from backend.app.state import app_state
from backend.app.utils.text_normalization import normalize_text

router = APIRouter(prefix="/api/search", tags=["Global Search"])


@router.get("", response_model=Dict[str, Any])
def global_search(q: str = Query(..., min_length=1)):
    q_norm = normalize_text(q)
    if not q_norm:
        return {"query": q, "cases": [], "people": [], "vehicles": [], "locations": [], "objects": []}

    matched_cases = []
    matched_people = []
    matched_vehicles = []
    matched_locations = []
    matched_objects = []

    # 1. Search Cases
    for c in app_state.cases:
        score = 0
        cid_norm = normalize_text(c.case_id)
        sum_norm = normalize_text(c.summary)
        type_norm = normalize_text(c.case_type)

        if q_norm in cid_norm:
            score = 100
        elif q_norm in sum_norm or q_norm in type_norm:
            score = 80
        elif any(q_norm in normalize_text(t) for t in c.tags) or any(q_norm in normalize_text(m) for m in c.modus_operandi):
            score = 75
        else:
            fuzzy_sum = fuzz.partial_ratio(q_norm, sum_norm)
            if fuzzy_sum > 75:
                score = fuzzy_sum * 0.7

        if score >= 60:
            matched_cases.append({
                "case_id": c.case_id,
                "case_type": c.case_type,
                "severity": c.severity,
                "reported_date": c.reported_date,
                "summary": c.summary,
                "relevance_score": round(score, 2)
            })

    # 2. Search People
    for p in app_state.entities.get("persons", []):
        score = 0
        pid_norm = normalize_text(p.person_id)
        name_norm = normalize_text(p.name)

        if q_norm == pid_norm or q_norm in name_norm:
            score = 100
        elif any(q_norm in normalize_text(a) for a in p.aliases):
            score = 90
        else:
            f_score = fuzz.token_sort_ratio(q_norm, name_norm)
            if f_score > 70:
                score = f_score

        if score >= 65:
            # Count appearances
            involved = [c.case_id for c in app_state.cases if any(pr.person_id == p.person_id for pr in c.people_involved)]
            witnessed = [c.case_id for c in app_state.cases if any(wr.person_id == p.person_id for wr in c.witnesses)]
            matched_people.append({
                "person_id": p.person_id,
                "name": p.name,
                "aliases": p.aliases,
                "occupation": p.occupation,
                "cases_involved": sorted(list(set(involved + witnessed))),
                "relevance_score": round(score, 2)
            })

    # 3. Search Vehicles
    for v in app_state.entities.get("vehicles", []):
        score = 0
        vid_norm = normalize_text(v.vehicle_id)
        reg_norm = normalize_text(v.registration)

        if q_norm in vid_norm or q_norm in reg_norm:
            score = 100
        else:
            f_score = fuzz.partial_ratio(q_norm, reg_norm)
            if f_score > 75:
                score = f_score

        if score >= 65:
            linked_cases = [c.case_id for c in app_state.cases if any(vr.vehicle_id == v.vehicle_id for vr in c.vehicles)]
            matched_vehicles.append({
                "vehicle_id": v.vehicle_id,
                "registration": v.registration,
                "type": v.type,
                "color": v.color,
                "cases_involved": linked_cases,
                "relevance_score": round(score, 2)
            })

    # 4. Search Locations
    for l in app_state.entities.get("locations", []):
        score = 0
        lid_norm = normalize_text(l.location_id)
        name_norm = normalize_text(l.name)
        city_norm = normalize_text(l.city)

        if q_norm in lid_norm or q_norm in name_norm or q_norm in city_norm:
            score = 100
        else:
            f_score = fuzz.token_set_ratio(q_norm, name_norm)
            if f_score > 70:
                score = f_score

        if score >= 65:
            linked_cases = [c.case_id for c in app_state.cases if any(lr.location_id == l.location_id for lr in c.locations)]
            matched_locations.append({
                "location_id": l.location_id,
                "name": l.name,
                "city": l.city,
                "state": l.state,
                "cases_involved": linked_cases,
                "relevance_score": round(score, 2)
            })

    # 5. Search Objects
    for o in app_state.entities.get("objects", []):
        score = 0
        oid_norm = normalize_text(o.object_id)
        desc_norm = normalize_text(o.description)
        ser_norm = normalize_text(o.serial_number)

        if q_norm in oid_norm or q_norm in desc_norm or q_norm in ser_norm:
            score = 100
        else:
            f_score = fuzz.partial_ratio(q_norm, desc_norm)
            if f_score > 75:
                score = f_score

        if score >= 65:
            linked_cases = [c.case_id for c in app_state.cases if any(obr.object_id == o.object_id for obr in c.objects)]
            matched_objects.append({
                "object_id": o.object_id,
                "type": o.type,
                "description": o.description,
                "serial_number": o.serial_number,
                "cases_involved": linked_cases,
                "relevance_score": round(score, 2)
            })

    matched_cases.sort(key=lambda x: x["relevance_score"], reverse=True)
    matched_people.sort(key=lambda x: x["relevance_score"], reverse=True)
    matched_vehicles.sort(key=lambda x: x["relevance_score"], reverse=True)
    matched_locations.sort(key=lambda x: x["relevance_score"], reverse=True)
    matched_objects.sort(key=lambda x: x["relevance_score"], reverse=True)

    return {
        "query": q,
        "cases": matched_cases[:15],
        "people": matched_people[:15],
        "vehicles": matched_vehicles[:15],
        "locations": matched_locations[:15],
        "objects": matched_objects[:15]
    }
