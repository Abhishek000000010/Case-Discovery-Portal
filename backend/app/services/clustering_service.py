from typing import List, Dict, Any, Optional
from collections import Counter
from backend.app.models.case_models import CaseModel
from backend.app.models.relationship_models import CaseCluster, CasePattern


class ClusteringService:
    """
    Empirical Case Clustering and Recurrent Incident Pattern Engine.
    Discovers repeated operational combinations across real crime types,
    weapons, municipal jurisdictions, and time windows.
    Zero synthetic or hardcoded patterns.
    """

    @staticmethod
    def _get_time_window(hour: Optional[int]) -> str:
        if hour is None:
            return "Unspecified Time Window"
        if hour < 6:
            return "Night (00:00–06:00)"
        elif hour < 12:
            return "Morning (06:00–12:00)"
        elif hour < 18:
            return "Afternoon (12:00–18:00)"
        else:
            return "Evening (18:00–24:00)"

    @classmethod
    def get_recurrent_patterns(
        cls, cases: List[CaseModel], min_count: int = 10, limit: int = 25
    ) -> List[CasePattern]:
        """
        Discovers repeated multi-attribute combinations:
        Crime Description + Weapon + City + Time Window.
        """
        combos: Dict[tuple, List[str]] = {}

        for c in cases:
            tw = cls._get_time_window(c.derived_features.occurrence_hour)
            crime = c.incident.crime_description
            city = c.location.city
            weap = c.weapon.used or "None Specified"

            key = (crime, city, weap, tw)
            combos.setdefault(key, []).append(c.case_id)

        sorted_combos = sorted(combos.items(), key=lambda item: len(item[1]), reverse=True)

        patterns: List[CasePattern] = []
        for idx, (key, case_ids) in enumerate(sorted_combos[:limit], start=1):
            crime, city, weap, tw = key
            count = len(case_ids)
            conf = min(0.98, round(0.65 + (count * 0.015), 2))

            weap_clause = f"involving {weap}" if weap != "None Specified" else "with no specific weapon recorded"
            desc = (
                f"Statistical recurrence: {count} recorded incidents of {crime} in {city} "
                f"{weap_clause} occurring during {tw}."
            )

            patterns.append(
                CasePattern(
                    pattern_id=f"PAT-{idx:03d}",
                    name=f"Series {idx:02d}: {crime} in {city} ({tw})",
                    crime_description=crime,
                    city=city,
                    weapon=weap if weap != "None Specified" else None,
                    time_window=tw,
                    case_count=count,
                    case_ids=case_ids[:15],
                    confidence=conf,
                    description=desc,
                )
            )

        return patterns

    @classmethod
    def cluster_cases(cls, cases: List[CaseModel], limit: int = 15) -> List[CaseCluster]:
        """
        Groups case series into interpretable multi-incident clusters.
        """
        patterns = cls.get_recurrent_patterns(cases, limit=limit)
        clusters: List[CaseCluster] = []

        for p in patterns:
            clusters.append(
                CaseCluster(
                    cluster_id=f"CLUSTER::{p.pattern_id}",
                    name=p.name,
                    dominant_crime_type=p.crime_description,
                    case_count=p.case_count,
                    case_ids=p.case_ids,
                    city=p.city,
                    weapon=p.weapon,
                    time_period=p.time_window,
                    narrative_summary=p.description,
                )
            )

        return clusters
