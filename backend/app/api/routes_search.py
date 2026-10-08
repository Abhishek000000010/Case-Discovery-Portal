import json
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Query
from backend.app.state import app_state
from backend.app.config import get_synthetic_dataset_path

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/search", tags=["Global Search"])

_cached_synthetic_data: Optional[Dict[str, Any]] = None


def _get_synthetic_data() -> Dict[str, Any]:
    global _cached_synthetic_data
    if _cached_synthetic_data is None:
        try:
            path = get_synthetic_dataset_path()
            with open(path, "r", encoding="utf-8") as f:
                _cached_synthetic_data = json.load(f)
        except Exception as e:
            logger.error("Failed to load synthetic dataset for search: %s", e)
            _cached_synthetic_data = {"cases": []}
    return _cached_synthetic_data


@router.get("", response_model=Dict[str, Any])
def global_search(q: str = Query(..., min_length=1)):
    q_lower = q.lower().strip()
    if not q_lower:
        return {
            "query": q,
            "persons": [],
            "cases": [],
            "locations": [],
            "cities": [],
            "vehicles": [],
            "weapons": [],
            "crime_types": [],
        }

    matched_persons = []
    matched_cases = []
    matched_locations = []
    matched_cities = []
    matched_vehicles = []
    matched_weapons = []
    matched_crime_types = []

    synthetic_data = _get_synthetic_data()
    detailed_cases = synthetic_data.get("cases", [])

    # =========================================================================
    # 1. Search Detailed Entity Dataset (Persons, Vehicles, Locations, Weapons, Cases)
    # =========================================================================
    for c in detailed_cases:
        case_id = c.get("case_id", "")
        c_info = c.get("case", {})
        crime_type = c_info.get("crime_type", "")
        case_status = c_info.get("status", "Under Investigation")
        severity = c_info.get("severity", "Normal")
        summary = c_info.get("summary", "")
        police_station = c_info.get("police_station", "")
        reported_date = c_info.get("reported_date", "")

        locations = c.get("locations", [])
        persons = c.get("persons", [])
        weapons = c.get("weapons", [])
        vehicles = c.get("vehicles", [])
        events = c.get("events", [])
        evidence = c.get("evidence", [])

        # Build lookup for persons & locations in this case
        person_name_map = {p.get("person_id"): p.get("name") for p in persons}
        loc_name_map = {loc.get("location_id"): loc.get("name") for loc in locations}

        # 1A. Match Persons
        for p in persons:
            p_name = p.get("name", "")
            p_aliases = p.get("aliases", [])
            p_role = p.get("role", "")
            p_residence = p.get("residence", "")
            p_occ = p.get("occupation", "")
            p_summary = p.get("statement_summary", "")

            # Check matching
            name_match = (
                q_lower in p_name.lower()
                or any(q_lower in str(a).lower() for a in p_aliases)
            )
            role_match = q_lower in p_role.lower()
            residence_match = q_lower in p_residence.lower()

            if name_match or role_match or residence_match:
                # Calculate relevance score
                relevance = 100 if q_lower == p_name.lower() else (90 if p_name.lower().startswith(q_lower) else 75)
                if name_match:
                    relevance += 10

                # Collect connected events for this person
                p_id = p.get("person_id")
                connected_events_list = []
                for ev in events:
                    if p_id in ev.get("person_ids", []):
                        ev_loc = loc_name_map.get(ev.get("location_id"), "")
                        connected_events_list.append({
                            "event_id": ev.get("event_id"),
                            "type": ev.get("type", "").replace("_", " ").title(),
                            "timestamp": ev.get("timestamp", ""),
                            "location": ev_loc,
                        })

                # Collect other parties in this case
                other_parties = [
                    {
                        "person_id": op.get("person_id"),
                        "name": op.get("name"),
                        "role": op.get("role", "").replace("_", " ").title(),
                    }
                    for op in persons
                    if op.get("person_id") != p_id
                ]

                matched_persons.append({
                    "person_id": p.get("person_id"),
                    "name": p.get("name"),
                    "aliases": p_aliases,
                    "role": p.get("role", "person").replace("_", " ").title(),
                    "age": p.get("age"),
                    "gender": p.get("gender"),
                    "residence": p.get("residence") or f"{locations[0].get('name') if locations else 'Unknown'}, {locations[0].get('city') if locations else 'Mumbai'}",
                    "city": p.get("city") or (locations[0].get("city") if locations else "Mumbai"),
                    "state": p.get("state") or (locations[0].get("state") if locations else "Maharashtra"),
                    "occupation": p.get("occupation") or "Resident / Civilian",
                    "contact": p.get("contact", ""),
                    "statement_summary": p_summary,
                    # Connected Case Intelligence
                    "case_id": case_id,
                    "crime_type": crime_type,
                    "case_status": case_status,
                    "severity": severity,
                    "case_summary": summary,
                    "police_station": police_station,
                    "reported_date": reported_date,
                    # Connected Entities
                    "connected_weapons": [w.get("type", "").title() for w in weapons],
                    "connected_vehicles": [
                        f"{v.get('registration')} ({v.get('type', '').title()})"
                        for v in vehicles
                    ],
                    "connected_locations": [l.get("name") for l in locations],
                    "connected_events": connected_events_list,
                    "other_parties": other_parties,
                    "relevance_score": relevance,
                })

        # 1B. Match Detailed Case
        case_matched = False
        case_score = 0
        if q_lower in case_id.lower():
            case_score = 100
            case_matched = True
        elif q_lower in crime_type.lower():
            case_score = 85
            case_matched = True
        elif q_lower in summary.lower():
            case_score = 75
            case_matched = True
        elif q_lower in police_station.lower():
            case_score = 70
            case_matched = True

        if case_matched:
            primary_loc = locations[0].get("name") if locations else "Mumbai"
            primary_city = locations[0].get("city") if locations else "Mumbai"
            matched_cases.append({
                "case_id": case_id,
                "report_number": f"FIR-{case_id}",
                "city": primary_city,
                "location": primary_loc,
                "crime_description": crime_type,
                "crime_code": 302 if crime_type.lower() == "murder" else 379,
                "crime_domain": "Violent Crime" if severity.lower() == "critical" else "Property/Financial",
                "weapon": weapons[0].get("type", "").title() if weapons else "None",
                "date": reported_date,
                "status": case_status,
                "severity": severity,
                "summary": summary,
                "is_synthetic": True,
                "entity_count": len(persons) + len(locations) + len(weapons) + len(vehicles) + len(events),
                "relevance_score": case_score,
            })

        # 1C. Match Detailed Locations
        for loc in locations:
            loc_name = loc.get("name", "")
            loc_city = loc.get("city", "")
            loc_role = loc.get("role", "")
            if q_lower in loc_name.lower() or q_lower in loc_city.lower() or q_lower in loc_role.lower():
                matched_locations.append({
                    "location_id": loc.get("location_id"),
                    "name": loc_name,
                    "city": loc_city,
                    "state": loc.get("state", "Maharashtra"),
                    "role": loc_role.replace("_", " ").title(),
                    "case_id": case_id,
                    "crime_type": crime_type,
                    "severity": severity,
                })

        # 1D. Match Detailed Vehicles
        for veh in vehicles:
            veh_reg = veh.get("registration", "")
            veh_type = veh.get("type", "")
            veh_role = veh.get("role", "")
            if q_lower in veh_reg.lower() or q_lower in veh_type.lower() or q_lower in veh_role.lower():
                owner_id = veh.get("owner_person_id")
                matched_vehicles.append({
                    "vehicle_id": veh.get("vehicle_id"),
                    "registration": veh_reg,
                    "type": veh_type.title(),
                    "role": veh_role.replace("_", " ").title(),
                    "owner_name": person_name_map.get(owner_id, "Unknown Owner"),
                    "case_id": case_id,
                    "crime_type": crime_type,
                })

        # 1E. Match Detailed Weapons
        for w in weapons:
            w_type = w.get("type", "")
            w_desc = w.get("description", "")
            w_status = w.get("status", "seized")
            if q_lower in w_type.lower() or q_lower in w_desc.lower():
                matched_weapons.append({
                    "weapon_id": w.get("weapon_id"),
                    "type": w_type.title(),
                    "description": w_desc,
                    "status": w_status.title(),
                    "case_id": case_id,
                    "crime_type": crime_type,
                })

    # =========================================================================
    # 2. Search Dimension Entities from Real Corpus (Cities, Crime Types, Weapons)
    # =========================================================================
    for city in app_state.entities.cities:
        if q_lower in city.name.lower():
            matched_cities.append(city.model_dump())

    for crime in app_state.entities.crime_descriptions:
        if q_lower in crime.name.lower():
            matched_crime_types.append(crime.model_dump())

    for weap in app_state.entities.weapons:
        if q_lower in weap.name.lower():
            # Avoid duplicate simple names
            if not any(mw.get("type", "").lower() == weap.name.lower() for mw in matched_weapons):
                matched_weapons.append({
                    "weapon_id": f"WPN-GEN-{weap.weapon_id}",
                    "type": weap.name.title(),
                    "description": f"Standard forensic classification with {weap.case_count} historical incidents",
                    "status": "Catalogued",
                    "case_id": "Various",
                    "crime_type": "Multi-category",
                })

    # =========================================================================
    # 3. Search Real Cases from 40k Corpus
    # =========================================================================
    for c in app_state.cases:
        score = 0
        cid_lower = c.case_id.lower()
        rep_str = str(c.source.source_report_number)
        city_lower = c.location.city.lower()
        crime_lower = c.incident.crime_description.lower()
        code_str = str(c.incident.crime_code)
        domain_lower = c.incident.crime_domain.lower()
        weap_lower = (c.weapon.used or "").lower()

        if q_lower == cid_lower or q_lower == rep_str:
            score = 100
        elif cid_lower.startswith(q_lower):
            score = 90
        elif q_lower in crime_lower or q_lower == code_str:
            score = 80
        elif q_lower in city_lower:
            score = 75
        elif q_lower in weap_lower:
            score = 70
        elif q_lower in domain_lower:
            score = 65

        if score >= 65:
            matched_cases.append({
                "case_id": c.case_id,
                "report_number": c.source.source_report_number,
                "city": c.location.city,
                "crime_description": c.incident.crime_description,
                "crime_code": c.incident.crime_code,
                "crime_domain": c.incident.crime_domain,
                "weapon": c.weapon.used or "Unspecified",
                "date": c.incident.date_of_occurrence or c.incident.time_of_occurrence,
                "status": c.status,
                "severity": "High" if "murder" in crime_lower or "robbery" in crime_lower else "Standard",
                "is_synthetic": False,
                "relevance_score": score,
            })
            if len(matched_cases) >= 60:
                break

    # Sort results
    matched_persons.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
    matched_cases.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)

    return {
        "query": q,
        "persons": matched_persons[:15],
        "cases": matched_cases[:25],
        "locations": matched_locations[:10],
        "cities": matched_cities[:10],
        "vehicles": matched_vehicles[:10],
        "weapons": matched_weapons[:10],
        "crime_types": matched_crime_types[:10],
        "total_matches": (
            len(matched_persons)
            + len(matched_cases)
            + len(matched_locations)
            + len(matched_cities)
            + len(matched_vehicles)
            + len(matched_weapons)
        ),
    }
