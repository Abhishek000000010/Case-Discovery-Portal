from typing import Tuple, List, Optional
from backend.app.models.case_models import CaseModel


class GeographicService:
    """
    Handles city-level geographic reasoning for the real Indian Crime dataset.
    Does NOT fabricate latitude/longitude or speculative inter-city distances.
    Operates strictly at the verifiable municipal jurisdiction level.
    """

    @staticmethod
    def compare_cases(
        case_a: CaseModel,
        case_b: CaseModel,
    ) -> Tuple[float, bool, List[str]]:
        """
        Compares two cases based on municipal jurisdiction.
        Returns:
            (geographic_similarity [0.0 or 1.0], same_city [bool], evidence_notes [List[str]])
        """
        city_a = (case_a.location.city or "").strip().lower()
        city_b = (case_b.location.city or "").strip().lower()

        if not city_a or not city_b:
            return 0.0, False, ["Unknown or unspecified municipal jurisdiction."]

        if city_a == city_b:
            display_city = case_a.location.city.strip()
            return 1.0, True, [f"Both incidents occurred within the same jurisdiction: {display_city}"]
        else:
            return 0.0, False, [f"Occurred in different jurisdictions: {case_a.location.city} vs {case_b.location.city}"]
