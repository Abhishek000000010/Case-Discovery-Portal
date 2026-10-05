import pytest
from backend.app.services.event_sequence_service import EventSequenceService
from backend.app.models.case_models import CaseEvent


def test_event_sequence_identical():
    events_a = [
        CaseEvent(event_id="E1", type="robbery", timestamp="2026-05-10T10:00:00"),
        CaseEvent(event_id="E2", type="escape", timestamp="2026-05-10T10:15:00"),
        CaseEvent(event_id="E3", type="vehicle_change", timestamp="2026-05-10T10:30:00"),
    ]
    events_b = [
        CaseEvent(event_id="E4", type="robbery", timestamp="2026-05-14T14:00:00"),
        CaseEvent(event_id="E5", type="escape", timestamp="2026-05-14T14:20:00"),
        CaseEvent(event_id="E6", type="vehicle_change", timestamp="2026-05-14T14:45:00"),
    ]
    score, evidence = EventSequenceService.compare_event_sequences(events_a, events_b)
    assert score == 1.0
    assert any("High behavioural event-chain concordance" in e for e in evidence)


def test_event_sequence_partial():
    events_a = [
        CaseEvent(event_id="E1", type="reconnaissance"),
        CaseEvent(event_id="E2", type="robbery"),
        CaseEvent(event_id="E3", type="escape"),
    ]
    events_b = [
        CaseEvent(event_id="E4", type="robbery"),
        CaseEvent(event_id="E5", type="escape"),
        CaseEvent(event_id="E6", type="vehicle_abandonment"),
    ]
    score, evidence = EventSequenceService.compare_event_sequences(events_a, events_b)
    assert score >= 0.5
    assert len(evidence) > 0


def test_event_sequence_different():
    events_a = [CaseEvent(event_id="E1", type="phone_call")]
    events_b = [CaseEvent(event_id="E2", type="break_in")]
    score, evidence = EventSequenceService.compare_event_sequences(events_a, events_b)
    assert score == 0.0
