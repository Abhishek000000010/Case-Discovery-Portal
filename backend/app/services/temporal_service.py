import math
from datetime import datetime, date
from typing import Tuple, List, Optional
from dateutil import parser
from backend.app.models.case_models import CaseModel


class TemporalService:
    """
    Handles temporal proximity analysis with continuous decay functions,
    event chronology alignment, and explainable time delta metrics.
    Distinguishes incident date from report date.
    """

    @staticmethod
    def parse_date_safe(val: Optional[str]) -> Optional[date]:
        if not val:
            return None
        try:
            dt = parser.parse(str(val))
            return dt.date()
        except Exception:
            return None

    @staticmethod
    def parse_datetime_safe(val: Optional[str]) -> Optional[datetime]:
        if not val:
            return None
        try:
            return parser.parse(str(val))
        except Exception:
            return None

    @staticmethod
    def compare_case_dates(
        case_a: CaseModel,
        case_b: CaseModel,
        decay_constant_days: float = 14.0,
        max_window_days: int = 60
    ) -> Tuple[float, Optional[int], List[str]]:
        """
        Extracts appropriate incident dates (or reported dates as fallback)
        and computes smooth exponential decay temporal proximity.
        Returns:
            (similarity [0.0 - 1.0], difference_in_days, evidence_notes)
        """
        date_a = case_a.incident_date or case_a.reported_date
        date_b = case_b.incident_date or case_b.reported_date

        used_fallback = not case_a.incident_date or not case_b.incident_date
        return TemporalService.calculate_temporal_similarity(
            date_a,
            date_b,
            decay_constant_days=decay_constant_days,
            max_window_days=max_window_days,
            used_fallback=used_fallback
        )

    @staticmethod
    def calculate_temporal_similarity(
        date_a: Optional[str],
        date_b: Optional[str],
        decay_constant_days: float = 14.0,
        max_window_days: int = 60,
        used_fallback: bool = False
    ) -> Tuple[float, Optional[int], List[str]]:
        """
        Calculates a continuous exponential decay score: exp(-days_diff / decay_constant).
        Score is 1.0 at 0 days, ~0.50 at ~10 days, ~0.13 at 28 days.
        """
        d1 = TemporalService.parse_date_safe(date_a)
        d2 = TemporalService.parse_date_safe(date_b)

        if not d1 or not d2:
            return 0.0, None, []

        diff_days = abs((d1 - d2).days)
        evidence: List[str] = []

        date_type_str = "reported date" if used_fallback else "incident date"

        if diff_days == 0:
            evidence.append(f"Occurred on the exact same calendar date ({d1})")
            return 1.0, 0, evidence

        if diff_days > max_window_days:
            return 0.0, diff_days, []

        # Smooth exponential decay function: exp(-diff / tau)
        decay = math.exp(-float(diff_days) / float(decay_constant_days))
        score = round(max(0.0, min(1.0, decay)), 3)

        if diff_days == 1:
            evidence.append(f"Incidents occurred 1 day apart ({d1} vs {d2})")
        elif diff_days <= 7:
            evidence.append(f"Within same 7-day operational window ({diff_days} days apart)")
        elif diff_days <= 21:
            evidence.append(f"Occurred within 3 weeks of each other ({diff_days} days apart)")
        else:
            evidence.append(f"Occurred {diff_days} days apart ({date_type_str})")

        return score, diff_days, evidence
