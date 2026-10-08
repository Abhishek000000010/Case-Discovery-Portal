import pytest
from backend.app.services.temporal_service import TemporalService


def test_circular_clock_distance():
    # 23:00 and 01:00 are only 2 hours apart across midnight
    score_close, diff, ev = TemporalService.calculate_time_of_day_similarity(23, 1)
    assert diff == 2
    assert score_close >= 0.5
    assert any("within 2 hour(s)" in e for e in ev)

    # 14:00 and 15:00 are 1 hour apart
    score_one_hr, diff_one, _ = TemporalService.calculate_time_of_day_similarity(14, 15)
    assert diff_one == 1
    assert score_one_hr > score_close


def test_temporal_proximity_same_day():
    score, days, evidence = TemporalService.calculate_temporal_similarity("2021-05-10", "2021-05-10")
    assert score == 1.0
    assert days == 0
    assert any("exact same date" in e.lower() for e in evidence)


def test_temporal_proximity_decay():
    score_near, days_near, _ = TemporalService.calculate_temporal_similarity("2021-05-10", "2021-05-13")
    score_far, days_far, _ = TemporalService.calculate_temporal_similarity("2021-05-10", "2021-11-10")

    assert days_near == 3
    assert days_far == 184
    assert score_near > score_far
    assert score_near > 0.70
    assert score_far == 0.0  # Outside 90 days window
