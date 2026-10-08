import math
from datetime import datetime, date
from typing import Tuple, List, Optional
from dateutil import parser
from backend.app.models.case_models import CaseModel


class TemporalService:
    """
    Handles temporal proximity analysis with continuous decay functions,
    time-of-day alignment, day-of-week concordance, and explainable time deltas.
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
    def calculate_temporal_similarity(
        date_a: Optional[str],
        date_b: Optional[str],
        decay_constant_days: float = 14.0,
        max_window_days: int = 90,
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

        if diff_days == 0:
            evidence.append(f"Occurred on the exact same date ({d1})")
            return 1.0, 0, evidence

        if diff_days > max_window_days:
            return 0.0, diff_days, []

        decay = math.exp(-float(diff_days) / float(decay_constant_days))
        score = round(max(0.0, min(1.0, decay)), 3)

        if diff_days == 1:
            evidence.append(f"Incidents occurred 1 day apart ({d1} vs {d2})")
        elif diff_days <= 7:
            evidence.append(f"Within same 7-day operational window ({diff_days} days apart)")
        elif diff_days <= 21:
            evidence.append(f"Occurred within 3 weeks ({diff_days} days apart)")
        else:
            evidence.append(f"Occurred {diff_days} days apart")

        return score, diff_days, evidence

    @staticmethod
    def calculate_time_of_day_similarity(
        hour_a: Optional[int],
        hour_b: Optional[int],
        max_hour_delta: int = 6
    ) -> Tuple[float, Optional[int], List[str]]:
        """
        Compares time-of-day occurrence hours (0-23) on a circular 24-hour clock.
        """
        if hour_a is None or hour_b is None:
            return 0.0, None, []

        # Circular hour difference on 24h clock
        raw_diff = abs(hour_a - hour_b)
        hour_diff = min(raw_diff, 24 - raw_diff)
        evidence: List[str] = []

        if hour_diff == 0:
            evidence.append(f"Occurred at the same hour window ({hour_a:02d}:00)")
            return 1.0, 0, evidence
        elif hour_diff <= 2:
            score = 1.0 - (0.25 * hour_diff)
            evidence.append(f"Occurred within {hour_diff} hour(s) of each other ({hour_a:02d}:00 vs {hour_b:02d}:00)")
            return round(score, 3), hour_diff, evidence
        elif hour_diff <= max_hour_delta:
            score = max(0.0, 0.50 - (0.10 * (hour_diff - 2)))
            evidence.append(f"Occurred in similar part of day ({hour_diff} hours apart)")
            return round(score, 3), hour_diff, evidence
        else:
            return 0.0, hour_diff, []

    @staticmethod
    def compare_cases(
        case_a: CaseModel,
        case_b: CaseModel,
        decay_constant_days: float = 14.0,
        max_window_days: int = 90,
    ) -> Tuple[float, float, Optional[int], Optional[int], bool, List[str]]:
        """
        Comprehensive temporal evaluation:
        Returns:
            (date_similarity, time_of_day_similarity, days_diff, hour_diff, same_day_of_week, evidence)
        """
        date_a = case_a.incident.date_of_occurrence or case_a.incident.time_of_occurrence or case_a.incident.date_reported
        date_b = case_b.incident.date_of_occurrence or case_b.incident.time_of_occurrence or case_b.incident.date_reported

        date_sim, days_diff, date_ev = TemporalService.calculate_temporal_similarity(
            date_a, date_b, decay_constant_days=decay_constant_days, max_window_days=max_window_days
        )

        hour_a = case_a.derived_features.occurrence_hour
        hour_b = case_b.derived_features.occurrence_hour
        tod_sim, hour_diff, tod_ev = TemporalService.calculate_time_of_day_similarity(hour_a, hour_b)

        dow_a = case_a.derived_features.occurrence_day_of_week
        dow_b = case_b.derived_features.occurrence_day_of_week
        same_dow = bool(dow_a and dow_b and dow_a == dow_b)

        evidence = date_ev + tod_ev
        if same_dow and dow_a:
            evidence.append(f"Both incidents took place on a {dow_a}")

        return date_sim, tod_sim, days_diff, hour_diff, same_dow, evidence
