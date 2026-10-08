import os
import json
from pathlib import Path
from typing import Dict, Any

BASE_DIR = Path(__file__).resolve().parent.parent.parent
CONFIG_DIR = BASE_DIR / "config"
DATA_DIR = BASE_DIR / "data"

WEIGHTS_CONFIG_PATH = CONFIG_DIR / "relationship_weights.json"
REAL_DATASET_PATH = DATA_DIR / "real" / "indian_crime_cases_real_cleaned.json"
ROOT_REAL_DATASET_PATH = BASE_DIR / "indian_crime_cases_real_cleaned.json"

DERIVED_DIR = DATA_DIR / "derived"
DERIVED_RELATIONSHIPS_PATH = DERIVED_DIR / "relationships.json"
DERIVED_PATTERNS_PATH = DERIVED_DIR / "patterns.json"
DERIVED_ANOMALIES_PATH = DERIVED_DIR / "anomalies.json"
DERIVED_STATS_PATH = DERIVED_DIR / "statistics.json"

DEFAULT_CONFIG: Dict[str, Any] = {
    "weights": {
        "same_city": 0.20,
        "crime_code_match": 0.25,
        "crime_description_match": 0.15,
        "crime_domain_match": 0.08,
        "weapon_match": 0.18,
        "temporal_proximity": 0.15,
        "time_of_day_proximity": 0.10,
        "victim_profile_similarity": 0.10,
        "semantic_similarity": 0.12,
    },
    "thresholds": {
        "minimum_confidence_for_ui": 0.35,
        "very_high_confidence": 0.80,
        "high_confidence": 0.65,
        "moderate_confidence": 0.45,
        "weak_confidence": 0.35,
        "temporal_window_days": 90,
        "temporal_decay_half_life_days": 14.0,
        "hour_window": 3,
    },
    "category_definitions": {
        "VERY HIGH": "Compelling multi-attribute alignment across city, exact crime code, weapon, and temporal window",
        "HIGH": "Strong corroborating incident profile across crime type, weapon, and municipal jurisdiction",
        "MODERATE": "Notable overlapping characteristics such as matching crime domain, weapon, or temporal window",
        "WEAK": "Indicative similarities or thematic overlaps warranting exploratory review",
    },
}


SYNTHETIC_DIR = DATA_DIR / "synthetic"
SYNTHETIC_DATASET_PATH = SYNTHETIC_DIR / "indian_detailed_case_entity_dataset.json"
ROOT_SYNTHETIC_DATASET_PATH = BASE_DIR / "indian_detailed_case_entity_dataset.json"


def load_relationship_config() -> Dict[str, Any]:
    if WEIGHTS_CONFIG_PATH.exists():
        try:
            with open(WEIGHTS_CONFIG_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return DEFAULT_CONFIG


def get_dataset_path() -> Path:
    if REAL_DATASET_PATH.exists():
        return REAL_DATASET_PATH
    if ROOT_REAL_DATASET_PATH.exists():
        return ROOT_REAL_DATASET_PATH
    raise FileNotFoundError(
        f"Could not find real dataset indian_crime_cases_real_cleaned.json at {REAL_DATASET_PATH} or {ROOT_REAL_DATASET_PATH}."
    )


def get_synthetic_dataset_path() -> Path:
    if SYNTHETIC_DATASET_PATH.exists():
        return SYNTHETIC_DATASET_PATH
    if ROOT_SYNTHETIC_DATASET_PATH.exists():
        return ROOT_SYNTHETIC_DATASET_PATH
    raise FileNotFoundError(
        f"Could not find synthetic dataset indian_detailed_case_entity_dataset.json at {SYNTHETIC_DATASET_PATH} or {ROOT_SYNTHETIC_DATASET_PATH}."
    )
