import pytest
from backend.app.services.modus_operandi_service import ModusOperandiService


def test_mo_identical():
    mo1 = ["night_entry", "forced_window", "electronics_targeted", "motorcycle_escape"]
    mo2 = ["night_entry", "forced_window", "electronics_targeted", "motorcycle_escape"]
    score, evidence = ModusOperandiService.calculate_mo_similarity(mo1, mo2)
    assert score == 1.0
    assert any("Identical modus operandi pattern" in e for e in evidence)


def test_mo_partial():
    mo1 = ["night_entry", "forced_window", "electronics_targeted", "motorcycle_escape"]
    mo2 = ["night_entry", "forced_window", "electronics_targeted", "van_transport"]
    score, evidence = ModusOperandiService.calculate_mo_similarity(mo1, mo2)
    assert 0.5 < score < 0.9
    assert any("Shared modus operandi elements (3)" in e for e in evidence)


def test_mo_different():
    mo1 = ["night_entry", "forced_window"]
    mo2 = ["credit_card_fraud", "atm_skimming"]
    score, evidence = ModusOperandiService.calculate_mo_similarity(mo1, mo2)
    assert score == 0.0
