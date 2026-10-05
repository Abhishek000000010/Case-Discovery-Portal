import math
from typing import Tuple, List, Dict, Optional
from backend.app.models.entity_models import LocationEntity
from backend.app.models.case_models import CaseLocationRef


class LocationComparisonResult(tuple):
    def __new__(cls, score: float, dist_km: float, evidence: List[str], band: str = ""):
        obj = super().__new__(cls, (score, dist_km, evidence))
        obj.score = score
        obj.dist_km = dist_km
        obj.evidence = evidence
        obj.band = band
        return obj


class GeographicService:
    """
    Handles geographic proximity calculations, Haversine distance,
    and calibrated multi-bracket location similarity scoring.
    """

    EARTH_RADIUS_KM = 6371.0088

    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        if lat1 == lat2 and lon1 == lon2:
            return 0.0

        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = (
            math.sin(delta_phi / 2.0) ** 2
            + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return self_dist if (self_dist := GeographicService.EARTH_RADIUS_KM * c) >= 0 else 0.0

    @staticmethod
    def compute_distance_band_score(dist_km: float) -> Tuple[float, str]:
        """
        Classifies geographic separation into domain brackets:
        - Exact match: 0.0 km -> 1.0
        - Very close: <= 3.0 km -> 0.90 - 0.75
        - Nearby: <= 10.0 km -> 0.75 - 0.50
        - Moderately distant: <= 25.0 km -> 0.50 - 0.20
        - Far away: > 25.0 km -> 0.0
        """
        if dist_km == 0.0:
            return 1.0, "same_location"
        elif dist_km <= 3.0:
            score = 0.75 + (0.15 * (1.0 - (dist_km / 3.0)))
            return round(score, 3), "very_close"
        elif dist_km <= 10.0:
            score = 0.50 + (0.25 * (1.0 - ((dist_km - 3.0) / 7.0)))
            return round(score, 3), "nearby"
        elif dist_km <= 25.0:
            score = 0.20 + (0.30 * (1.0 - ((dist_km - 10.0) / 15.0)))
            return round(score, 3), "moderately_distant"
        else:
            return 0.0, "far_away"

    @staticmethod
    def compare_locations(
        loc1: LocationEntity,
        loc2: LocationEntity,
        nearby_threshold_km: float = 15.0
    ) -> LocationComparisonResult:
        """
        Compares two location entities.
        Returns:
            LocationComparisonResult(similarity_score, distance_km, evidence_notes, band)
            (Unpacks cleanly as 3 values: score, dist_km, evidence)
        """
        evidence = []
        if loc1.location_id == loc2.location_id:
            evidence.append(f"Identical location '{loc1.name}' (distance 0.0 km)")
            return LocationComparisonResult(1.0, 0.0, evidence, "same_location")

        if (
            loc1.latitude is not None and loc1.longitude is not None and
            loc2.latitude is not None and loc2.longitude is not None
        ):
            dist_km = round(GeographicService.haversine_distance(
                loc1.latitude, loc1.longitude, loc2.latitude, loc2.longitude
            ), 2)

            score, band = GeographicService.compute_distance_band_score(dist_km)

            if band == "same_location":
                evidence.append(f"Identical location coordinates: '{loc1.name}' & '{loc2.name}' (0.0 km)")
            elif band == "very_close":
                evidence.append(f"Geographic proximity (immediate): '{loc1.name}' to '{loc2.name}' ({dist_km} km, under 3km radius)")
            elif band == "nearby":
                evidence.append(f"Geographic proximity (nearby): '{loc1.name}' & '{loc2.name}' ({dist_km} km apart)")
            elif band == "moderately_distant":
                evidence.append(f"Geographic proximity (corridor): '{loc1.name}' & '{loc2.name}' ({dist_km} km apart)")

            return LocationComparisonResult(score, dist_km, evidence, band)

        # Fallback to city/jurisdiction match
        if loc1.city and loc2.city and loc1.city.lower() == loc2.city.lower():
            evidence.append(f"Shared metropolitan jurisdiction: '{loc1.city}'")
            return LocationComparisonResult(0.30, -1.0, evidence, "shared_jurisdiction")

        return LocationComparisonResult(0.0, -1.0, [], "unknown")

    @staticmethod
    def compare_case_locations(
        case_a_loc_refs: List[CaseLocationRef],
        case_b_loc_refs: List[CaseLocationRef],
        location_map: Dict[str, LocationEntity],
        nearby_threshold_km: float = 15.0
    ) -> Tuple[float, Optional[float], List[str], bool]:
        if not case_a_loc_refs or not case_b_loc_refs:
            return 0.0, None, [], False

        locs_a = [location_map[r.location_id] for r in case_a_loc_refs if r.location_id in location_map]
        locs_b = [location_map[r.location_id] for r in case_b_loc_refs if r.location_id in location_map]

        if not locs_a or not locs_b:
            return 0.0, None, [], False

        ids_a = {l.location_id for l in locs_a}
        ids_b = {l.location_id for l in locs_b}
        shared_ids = ids_a.intersection(ids_b)

        evidence = []
        if shared_ids:
            for sid in shared_ids:
                loc_name = location_map[sid].name
                evidence.append(f"Exact same incident location shared: '{loc_name}' ({sid})")
            return 1.0, 0.0, evidence, True

        best_score = 0.0
        best_evidence = []
        min_dist: Optional[float] = None

        for la in locs_a:
            for lb in locs_b:
                res = GeographicService.compare_locations(la, lb, nearby_threshold_km)
                if res.score > best_score:
                    best_score = res.score
                    best_evidence = res.evidence
                    min_dist = res.dist_km if res.dist_km >= 0 else None

        return best_score, min_dist, best_evidence, False
