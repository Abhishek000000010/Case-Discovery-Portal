import os
import json
from pathlib import Path
from typing import Dict, Any

BASE_DIR = Path(__file__).resolve().parent.parent.parent
CONFIG_DIR = BASE_DIR / "config"
DATA_DIR = BASE_DIR / "data"

WEIGHTS_CONFIG_PATH = CONFIG_DIR / "relationship_weights.json"
DATASET_PATH = DATA_DIR / "crime_intelligence_dataset_120_cases.json"
FALLBACK_DATASET_PATH = BASE_DIR / "crime_intelligence_dataset_120_cases.json"
DERIVED_CACHE_PATH = DATA_DIR / "derived_relationships.json"

DEFAULT_CONFIG: Dict[str, Any] = {
    "weights": {
        "person_overlap": 0.22,
        "vehicle_overlap": 0.18,
        "object_overlap": 0.12,
        "location_proximity": 0.12,
        "temporal_proximity": 0.12,
        "modus_operandi_similarity": 0.14,
        "event_sequence_similarity": 0.10,
        "semantic_similarity": 0.08,
        "witness_overlap": 0.08,
        "tag_overlap": 0.04
    },
    "thresholds": {
        "minimum_confidence_for_ui": 0.30,  # Ignore below 0.30
        "very_high_confidence": 0.85,       # 0.85 - 1.00
        "high_confidence": 0.70,            # 0.70 - 0.84
        "moderate_confidence": 0.50,        # 0.50 - 0.69
        "weak_confidence": 0.30,            # 0.30 - 0.49
        
        # Geographic reasoning distance brackets
        "geographic_exact_km": 0.0,
        "geographic_very_close_km": 3.0,
        "geographic_nearby_km": 10.0,
        "geographic_moderate_km": 25.0,
        
        # Temporal reasoning
        "temporal_window_days": 60,
        "temporal_decay_constant_days": 14.0,  # exp(-days / 14)
        "temporal_decay_half_life_days": 10.0,
        
        # Rarity & quality weighting
        "rarity_max_boost": 1.25,
        "rarity_min_penalty": 0.85,
        "candidate_generation_prefilter_active": True
    },
    "category_definitions": {
        "VERY HIGH": "Compelling multi-factor alignment or verified direct physical/individual identifier link",
        "HIGH": "Strong corroborating evidence across behavioural pattern, timeline, and spatial proximity",
        "MODERATE": "Notable overlapping context, geographic proximity, or behavioral similarities requiring investigation",
        "WEAK": "Indicative similarities or thematic overlaps warranting exploratory review"
    }
}


def load_relationship_config() -> Dict[str, Any]:
    if WEIGHTS_CONFIG_PATH.exists():
        try:
            with open(WEIGHTS_CONFIG_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return DEFAULT_CONFIG


def get_dataset_path() -> Path:
    if DATASET_PATH.exists():
        return DATASET_PATH
    if FALLBACK_DATASET_PATH.exists():
        return FALLBACK_DATASET_PATH
    raise FileNotFoundError("Could not find crime_intelligence_dataset_120_cases.json in data/ or workspace root.")
