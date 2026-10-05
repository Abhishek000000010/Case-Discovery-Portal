from typing import Dict, Any


def clamp_score(score: float, min_val: float = 0.0, max_val: float = 1.0) -> float:
    return max(min_val, min(max_val, round(score, 4)))


def categorize_confidence(
    score: float,
    thresholds: Dict[str, Any] = None,
    has_direct_match: bool = False
) -> str:
    """
    Standard calibrated categorization:
    0.85 - 1.00 = VERY HIGH (or DIRECT if physical identifier match)
    0.70 - 0.84 = HIGH
    0.50 - 0.69 = MODERATE
    0.30 - 0.49 = WEAK
    below 0.30 = IGNORE
    """
    th = thresholds or {}
    very_high_th = th.get("very_high_confidence", 0.85)
    high_th = th.get("high_confidence", 0.70)
    moderate_th = th.get("moderate_confidence", 0.50)
    weak_th = th.get("weak_confidence", 0.30)

    if has_direct_match and score >= 0.75:
        return "DIRECT"
    if score >= very_high_th:
        return "VERY HIGH"
    elif score >= high_th:
        return "HIGH"
    elif score >= moderate_th:
        return "MODERATE"
    elif score >= weak_th:
        return "WEAK"
    return "IGNORE"
