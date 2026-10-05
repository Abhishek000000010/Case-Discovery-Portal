from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from collections import Counter
from backend.app.state import app_state
from backend.app.services.anomaly_service import AnomalyService

router = APIRouter(prefix="/api/entities", tags=["Entities"])


@router.get("/persons", response_model=List[Dict[str, Any]])
def list_persons(
    only_recurring: bool = False,
    min_cases: int = 1
):
    analysis = AnomalyService.analyze_person_recurrence(
        app_state.cases,
        app_state.entities.get("persons", [])
    )

    p_map = app_state.entities.get("person_map", {})
    loc_map = app_state.entities.get("location_map", {})
    v_list = app_state.entities.get("vehicles", [])

    results = []
    for item in analysis:
        pid = item["entity_id"]
        if item["case_count"] < min_cases:
            continue
        if only_recurring and not item["is_potential_anomaly"] and item["case_count"] < 3:
            continue

        p_obj = p_map.get(pid)
        home_loc_name = None
        if p_obj and p_obj.home_location_id in loc_map:
            home_loc_name = loc_map[p_obj.home_location_id].name

        owned_vehicles = [
            v.registration for v in v_list
            if v.owner_person_id == pid and v.registration
        ]

        results.append({
            "person_id": pid,
            "name": item["name"],
            "aliases": p_obj.aliases if p_obj else [],
            "occupation": p_obj.occupation if p_obj else None,
            "home_location_id": p_obj.home_location_id if p_obj else None,
            "home_location_name": home_loc_name,
            "owned_vehicles": owned_vehicles,
            "case_count": item["case_count"],
            "cases": item["cases"],
            "role_distribution": item["role_distribution"],
            "is_potential_anomaly": item["is_potential_anomaly"],
            "anomaly_label": item["anomaly_label"],
            "investigative_notes": item["investigative_notes"]
        })

    return results


@router.get("/persons/{person_id}", response_model=Dict[str, Any])
def get_person_details(person_id: str):
    p_map = app_state.entities.get("person_map", {})
    if person_id not in p_map:
        raise HTTPException(status_code=404, detail=f"Person ID '{person_id}' not found")

    person = p_map[person_id]
    loc_map = app_state.entities.get("location_map", {})

    home_loc = loc_map.get(person.home_location_id) if person.home_location_id else None

    # Gather case involvement
    involved_cases = []
    role_counter = Counter()

    for c in app_state.cases:
        roles_in_case = []
        for pref in c.people_involved:
            if pref.person_id == person_id:
                roles_in_case.append(pref.role)
                role_counter[pref.role] += 1
        for wref in c.witnesses:
            if wref.person_id == person_id:
                roles_in_case.append("witness")
                role_counter["witness"] += 1

        if roles_in_case:
            involved_cases.append({
                "case_id": c.case_id,
                "case_type": c.case_type,
                "reported_date": c.reported_date,
                "severity": c.severity,
                "summary": c.summary,
                "roles": list(set(roles_in_case))
            })

    owned_vehicles = [
        v for v in app_state.entities.get("vehicles", [])
        if v.owner_person_id == person_id
    ]

    is_anomaly = len(involved_cases) >= 8 or role_counter.get("witness", 0) >= 5
    anomaly_label = "Unusual recurrence detected" if is_anomaly else None

    return {
        "person": person,
        "home_location": home_loc,
        "owned_vehicles": owned_vehicles,
        "case_count": len(involved_cases),
        "cases": involved_cases,
        "role_distribution": dict(role_counter),
        "is_potential_anomaly": is_anomaly,
        "anomaly_label": anomaly_label,
        "investigative_notes": [
            f"Cross-incident recurrence in {len(involved_cases)} case files"
        ] if is_anomaly else []
    }


@router.get("/vehicles", response_model=List[Dict[str, Any]])
def list_vehicles():
    v_analysis = AnomalyService.analyze_vehicle_recurrence(
        app_state.cases,
        app_state.entities.get("vehicles", [])
    )
    v_map = app_state.entities.get("vehicle_map", {})
    p_map = app_state.entities.get("person_map", {})

    results = []
    for item in v_analysis:
        vid = item["entity_id"]
        v_obj = v_map.get(vid)
        owner_name = None
        if v_obj and v_obj.owner_person_id and v_obj.owner_person_id in p_map:
            owner_name = p_map[v_obj.owner_person_id].name

        results.append({
            "vehicle_id": vid,
            "registration": item["registration"],
            "type": item["type"],
            "color": v_obj.color if v_obj else None,
            "owner_person_id": v_obj.owner_person_id if v_obj else None,
            "owner_name": owner_name,
            "case_count": item["case_count"],
            "cases": item["cases"],
            "role_distribution": item["role_distribution"],
            "is_potential_anomaly": item["is_potential_anomaly"],
            "anomaly_label": item["anomaly_label"],
            "investigative_notes": item["investigative_notes"]
        })

    return results


@router.get("/locations", response_model=List[Dict[str, Any]])
def list_locations():
    locs = app_state.entities.get("locations", [])
    loc_cases: Dict[str, List[str]] = {}

    for c in app_state.cases:
        for l in c.locations:
            loc_cases.setdefault(l.location_id, []).append(c.case_id)

    results = []
    for l in locs:
        cids = sorted(list(set(loc_cases.get(l.location_id, []))))
        results.append({
            "location_id": l.location_id,
            "name": l.name,
            "city": l.city,
            "state": l.state,
            "latitude": l.latitude,
            "longitude": l.longitude,
            "type": l.type,
            "case_count": len(cids),
            "cases": cids
        })

    results.sort(key=lambda x: x["case_count"], reverse=True)
    return results


@router.get("/objects", response_model=List[Dict[str, Any]])
def list_objects():
    objs = app_state.entities.get("objects", [])
    obj_cases: Dict[str, List[str]] = {}

    for c in app_state.cases:
        for o in c.objects:
            obj_cases.setdefault(o.object_id, []).append(c.case_id)

    results = []
    for o in objs:
        cids = sorted(list(set(obj_cases.get(o.object_id, []))))
        results.append({
            "object_id": o.object_id,
            "type": o.type,
            "description": o.description,
            "serial_number": o.serial_number,
            "case_count": len(cids),
            "cases": cids
        })

    results.sort(key=lambda x: x["case_count"], reverse=True)
    return results
