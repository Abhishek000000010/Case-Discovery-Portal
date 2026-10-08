from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from collections import Counter
from backend.app.state import app_state

router = APIRouter(prefix="/api/entities", tags=["Entities"])


@router.get("", response_model=Dict[str, Any])
def get_all_entities():
    """
    Returns all real dimensional entities with their case counts and attributes.
    """
    return {
        "cities": [c.model_dump() for c in app_state.entities.cities],
        "crime_descriptions": [cd.model_dump() for cd in app_state.entities.crime_descriptions],
        "weapons": [w.model_dump() for w in app_state.entities.weapons],
        "crime_domains": [d.model_dump() for d in app_state.entities.crime_domains],
        "total_cities": len(app_state.entities.cities),
        "total_crime_types": len(app_state.entities.crime_descriptions),
        "total_weapons": len(app_state.entities.weapons),
        "total_domains": len(app_state.entities.crime_domains),
    }


@router.get("/cities", response_model=List[Dict[str, Any]])
def list_cities():
    """
    Lists all 29 Indian cities with empirical case statistics.
    """
    city_stats = []
    cases_by_city: Dict[str, list] = {}
    for c in app_state.cases:
        cases_by_city.setdefault(c.location.city.lower(), []).append(c)

    for city in app_state.entities.cities:
        c_list = cases_by_city.get(city.name.lower(), [])
        count = len(c_list)
        closed = sum(1 for c in c_list if c.investigation.case_closed)
        crimes = Counter(c.incident.crime_description for c in c_list)
        top_crime = crimes.most_common(1)[0][0] if crimes else "None"

        city_stats.append({
            "city_id": city.city_id,
            "name": city.name,
            "case_count": count,
            "cases_closed": closed,
            "open_cases": count - closed,
            "closure_rate": round((closed / count) * 100, 1) if count > 0 else 0.0,
            "top_crime": top_crime,
        })

    city_stats.sort(key=lambda x: x["case_count"], reverse=True)
    return city_stats


@router.get("/crimes", response_model=List[Dict[str, Any]])
def list_crimes():
    """
    Lists all 21 crime types with empirical case statistics.
    """
    crime_stats = []
    cases_by_crime: Dict[str, list] = {}
    for c in app_state.cases:
        cases_by_crime.setdefault(c.incident.crime_description.lower(), []).append(c)

    for crime in app_state.entities.crime_descriptions:
        c_list = cases_by_crime.get(crime.name.lower(), [])
        count = len(c_list)
        cities = Counter(c.location.city for c in c_list)
        weapons = Counter(c.weapon.used for c in c_list if c.weapon.used)

        top_city = cities.most_common(1)[0][0] if cities else "None"
        top_weapon = weapons.most_common(1)[0][0] if weapons else "None"

        crime_stats.append({
            "crime_id": crime.crime_description_id,
            "name": crime.name,
            "case_count": count,
            "top_city": top_city,
            "top_weapon": top_weapon,
        })

    crime_stats.sort(key=lambda x: x["case_count"], reverse=True)
    return crime_stats


@router.get("/weapons", response_model=List[Dict[str, Any]])
def list_weapons():
    """
    Lists all weapon categories with empirical case statistics.
    """
    weapon_stats = []
    cases_by_weapon: Dict[str, list] = {}
    for c in app_state.cases:
        if c.weapon.used:
            cases_by_weapon.setdefault(c.weapon.used.lower(), []).append(c)

    for weap in app_state.entities.weapons:
        w_list = cases_by_weapon.get(weap.name.lower(), [])
        count = len(w_list)
        crimes = Counter(c.incident.crime_description for c in w_list)
        top_crime = crimes.most_common(1)[0][0] if crimes else "None"

        weapon_stats.append({
            "weapon_id": weap.weapon_id,
            "name": weap.name,
            "case_count": count,
            "top_crime": top_crime,
        })

    weapon_stats.sort(key=lambda x: x["case_count"], reverse=True)
    return weapon_stats


@router.get("/domains", response_model=List[Dict[str, Any]])
def list_domains():
    """
    Lists all 4 crime domains with empirical case statistics.
    """
    domain_stats = []
    cases_by_domain: Dict[str, list] = {}
    for c in app_state.cases:
        cases_by_domain.setdefault(c.incident.crime_domain.lower(), []).append(c)

    for dom in app_state.entities.crime_domains:
        d_list = cases_by_domain.get(dom.name.lower(), [])
        count = len(d_list)

        domain_stats.append({
            "domain_id": dom.domain_id,
            "name": dom.name,
            "case_count": count,
        })

    domain_stats.sort(key=lambda x: x["case_count"], reverse=True)
    return domain_stats
