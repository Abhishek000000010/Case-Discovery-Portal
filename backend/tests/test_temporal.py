import pytest
from backend.app.services.temporal_service import TemporalService


def test_temporal_same_day():
    score, diff, evidence = TemporalService.calculate_temporal_similarity("2026-05-10", "2026-05-10")
    assert score == 1.0
    assert diff == 0
    assert any("exact same calendar date" in e for e in evidence)


def test_temporal_nearby_days():
    score_1, diff_1, ev_1 = TemporalService.calculate_temporal_similarity("2026-05-10", "2026-05-11")
    score_5, diff_5, ev_5 = TemporalService.calculate_temporal_similarity("2026-05-10", "2026-05-15")
    assert score_1 > score_5 > 0.0
    assert diff_1 == 1
    assert diff_5 == 5


def test_temporal_distant_dates():
    score, diff, evidence = TemporalService.calculate_temporal_similarity("2026-01-01", "2026-09-01", max_window_days=45)
    assert score == 0.0
    assert diff > 45
    assert len(evidence) == 0
