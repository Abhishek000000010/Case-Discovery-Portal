import math
from typing import List, Dict, Any, Set, Tuple, Optional
from collections import Counter

from backend.app.models.case_models import CaseModel
from backend.app.models.relationship_models import (
    RelationshipFeatures,
    RelationshipScoreBreakdown,
    RelationshipExplanation,
    CandidatePair,
    RelationshipDebugResponse,
)
from backend.app.services.geographic_service import GeographicService
from backend.app.services.temporal_service import TemporalService
from backend.app.services.semantic_similarity import SemanticSimilarityService
from backend.app.services.relationship_explanation_service import RelationshipExplanationService
from backend.app.utils.scoring import clamp_score, categorize_confidence


class RelationshipEngine:
    """
    Data-driven, explainable Case Relationship Intelligence Engine for real Indian crime data.
    Scales to 40,000+ records via inverted index candidate generation and on-demand
    scoring with cached top relationships.
    """

    def __init__(
        self,
        config: Dict[str, Any],
        semantic_service: Optional[SemanticSimilarityService] = None,
    ):
        self.config = config
        self.weights = config.get("weights", {})
        self.thresholds = config.get("thresholds", {})
        self.semantic_service = semantic_service or SemanticSimilarityService()

        # Corpus frequencies for IDF rarity calculations
        self.total_corpus_cases: int = 1
        self.crime_code_frequencies: Counter = Counter()
        self.crime_desc_frequencies: Counter = Counter()
        self.weapon_frequencies: Counter = Counter()
        self.city_frequencies: Counter = Counter()

        # Inverted indices for candidate retrieval
        self.cases: List[CaseModel] = []
        self.case_map: Dict[str, CaseModel] = {}
        self.city_index: Dict[str, List[int]] = {}
        self.crime_code_index: Dict[int, List[int]] = {}
        self.crime_desc_index: Dict[str, List[int]] = {}
        self.weapon_index: Dict[str, List[int]] = {}
        self.domain_index: Dict[str, List[int]] = {}
        self.city_crime_index: Dict[Tuple[str, int], List[int]] = {}

        # Relationship cache: case_id -> List[RelationshipExplanation]
        self._relationship_cache: Dict[str, List[RelationshipExplanation]] = {}

    def index_corpus(self, cases: List[CaseModel]):
        """
        Builds inverted indices and frequency tables across the entire case corpus.
        Executes in milliseconds.
        """
        self.cases = cases
        self.total_corpus_cases = max(len(cases), 1)
        self.case_map = {c.case_id: c for c in cases}

        self.crime_code_frequencies.clear()
        self.crime_desc_frequencies.clear()
        self.weapon_frequencies.clear()
        self.city_frequencies.clear()

        self.city_index.clear()
        self.crime_code_index.clear()
        self.crime_desc_index.clear()
        self.weapon_index.clear()
        self.domain_index.clear()
        self.city_crime_index.clear()
        self._relationship_cache.clear()

        for idx, c in enumerate(cases):
            city_key = (c.derived_features.city_key or c.location.city.lower()).strip()
            code = c.incident.crime_code
            desc_key = (c.derived_features.crime_key or c.incident.crime_description.lower()).strip()
            weapon_key = (c.derived_features.weapon_key or "").strip()
            domain_key = (c.derived_features.crime_domain_key or c.incident.crime_domain.lower()).strip()

            self.city_frequencies[city_key] += 1
            self.crime_code_frequencies[code] += 1
            self.crime_desc_frequencies[desc_key] += 1
            if weapon_key:
                self.weapon_frequencies[weapon_key] += 1

            self.city_index.setdefault(city_key, []).append(idx)
            self.crime_code_index.setdefault(code, []).append(idx)
            self.crime_desc_index.setdefault(desc_key, []).append(idx)
            if weapon_key:
                self.weapon_index.setdefault(weapon_key, []).append(idx)
            self.domain_index.setdefault(domain_key, []).append(idx)
            self.city_crime_index.setdefault((city_key, code), []).append(idx)

    def calculate_rarity_multiplier(self, crime_code: int, weapon_key: Optional[str]) -> float:
        """
        Calculates IDF rarity factor. Rare crime codes or weapons increase discriminative value.
        """
        n = float(self.total_corpus_cases)
        idf_scores: List[float] = []

        code_freq = self.crime_code_frequencies.get(crime_code, 100)
        idf_scores.append(math.log((n + 1.0) / (code_freq + 1.0)))

        if weapon_key:
            weap_freq = self.weapon_frequencies.get(weapon_key, 1000)
            idf_scores.append(math.log((n + 1.0) / (weap_freq + 1.0)))

        if not idf_scores:
            return 1.0

        avg_idf = sum(idf_scores) / len(idf_scores)
        max_possible_idf = math.log(n + 1.0)
        ratio = avg_idf / max(max_possible_idf, 1.0)
        return round(0.92 + (0.24 * ratio), 3)

    def get_candidate_case_indices(self, case: CaseModel, max_candidates: int = 250) -> List[int]:
        """
        Fast candidate retrieval using inverted multi-attribute indices.
        Retrieves cases sharing municipal jurisdiction, crime code/type, or weapon.
        """
        city_key = (case.derived_features.city_key or case.location.city.lower()).strip()
        code = case.incident.crime_code
        weapon_key = (case.derived_features.weapon_key or "").strip()
        desc_key = (case.derived_features.crime_key or case.incident.crime_description.lower()).strip()

        candidate_counts: Counter = Counter()

        # Highest priority: same city AND same crime code
        for idx in self.city_crime_index.get((city_key, code), []):
            candidate_counts[idx] += 4

        # High priority: same crime code
        for idx in self.crime_code_index.get(code, []):
            candidate_counts[idx] += 3

        # Medium priority: same city AND same weapon
        if weapon_key:
            for idx in self.weapon_index.get(weapon_key, []):
                candidate_counts[idx] += 2

        # Medium priority: same city AND same crime description
        for idx in self.city_index.get(city_key, []):
            candidate_counts[idx] += 1

        for idx in self.crime_desc_index.get(desc_key, []):
            candidate_counts[idx] += 1

        # Remove self
        self_idx = next((i for i, c in enumerate(self.cases) if c.case_id == case.case_id), None)
        if self_idx is not None and self_idx in candidate_counts:
            del candidate_counts[self_idx]

        sorted_candidates = [idx for idx, _ in candidate_counts.most_common(max_candidates)]
        return sorted_candidates

    def extract_features(self, case_a: CaseModel, case_b: CaseModel) -> RelationshipFeatures:
        """
        Extracts multi-signal empirical feature vector between two real cases.
        """
        f = RelationshipFeatures()

        # 1. Geographic / Municipal Jurisdiction
        geo_sim, same_city, _ = GeographicService.compare_cases(case_a, case_b)
        f.same_city = same_city

        # 2. Crime Specification
        f.crime_code_match = (case_a.incident.crime_code == case_b.incident.crime_code)
        f.crime_description_match = (
            (case_a.derived_features.crime_key or case_a.incident.crime_description.lower())
            == (case_b.derived_features.crime_key or case_b.incident.crime_description.lower())
        )
        f.crime_domain_match = (
            (case_a.derived_features.crime_domain_key or case_a.incident.crime_domain.lower())
            == (case_b.derived_features.crime_domain_key or case_b.incident.crime_domain.lower())
        )

        # 3. Weapon
        weap_a = case_a.derived_features.weapon_key or (case_a.weapon.used or "").lower()
        weap_b = case_b.derived_features.weapon_key or (case_b.weapon.used or "").lower()
        f.weapon_match = bool(weap_a and weap_b and weap_a == weap_b)

        # 4. Temporal Proximity
        date_sim, tod_sim, days_diff, hour_diff, same_dow, _ = TemporalService.compare_cases(
            case_a, case_b,
            decay_constant_days=self.thresholds.get("temporal_decay_half_life_days", 14.0),
            max_window_days=self.thresholds.get("temporal_window_days", 90),
        )
        f.temporal_similarity = date_sim
        f.incident_date_difference_days = days_diff
        f.time_of_day_similarity = tod_sim
        f.hour_difference = hour_diff
        f.same_day_of_week = same_dow

        # 5. Victim Profile
        v_age_a = case_a.victim.age
        v_age_b = case_b.victim.age
        if v_age_a is not None and v_age_b is not None:
            age_diff = abs(v_age_a - v_age_b)
            f.victim_age_difference = age_diff
            f.victim_age_band_match = (case_a.victim.age_band == case_b.victim.age_band)
        f.victim_gender_match = bool(
            case_a.victim.gender and case_b.victim.gender and case_a.victim.gender == case_b.victim.gender
        )

        prof_sim = 0.0
        if f.victim_gender_match:
            prof_sim += 0.5
        if f.victim_age_band_match:
            prof_sim += 0.5
        f.victim_profile_similarity = prof_sim

        # 6. Semantic text similarity
        sem_sim, _ = self.semantic_service.compute_similarity(case_a.case_id, case_b.case_id)
        f.semantic_similarity = sem_sim

        # 7. Compound Profile Boost
        # Extra confidence when municipal jurisdiction + crime code + weapon coincide
        compound_boost = 0.0
        if f.same_city and f.crime_code_match and f.weapon_match:
            if f.incident_date_difference_days is not None and f.incident_date_difference_days <= 14:
                compound_boost = 0.16
            else:
                compound_boost = 0.10
        elif f.same_city and f.crime_description_match and f.weapon_match:
            compound_boost = 0.06
        elif f.same_city and f.crime_code_match:
            compound_boost = 0.04
        f.compound_score_boost = compound_boost

        # 8. Rarity multiplier
        weapon_key = case_a.derived_features.weapon_key if f.weapon_match else None
        f.rarity_multiplier = self.calculate_rarity_multiplier(case_a.incident.crime_code, weapon_key)

        return f

    def score_features(
        self, features: RelationshipFeatures
    ) -> Tuple[float, RelationshipScoreBreakdown]:
        """
        Calculates mathematically explainable score breakdown and final confidence score.
        """
        w = self.weights

        # Geographic contribution
        s_city = (w.get("same_city", 0.20) * 1.0) if features.same_city else 0.0

        # Crime specification contribution
        if features.crime_code_match:
            s_crime = w.get("crime_code_match", 0.25) * 1.0
        elif features.crime_description_match:
            s_crime = w.get("crime_description_match", 0.15) * 1.0
        elif features.crime_domain_match:
            s_crime = w.get("crime_domain_match", 0.08) * 1.0
        else:
            s_crime = 0.0

        # Weapon contribution
        s_weapon = (w.get("weapon_match", 0.18) * 1.0) if features.weapon_match else 0.0

        # Temporal proximity contribution
        s_temporal = w.get("temporal_proximity", 0.15) * features.temporal_similarity

        # Time of day contribution
        s_tod = w.get("time_of_day_proximity", 0.10) * features.time_of_day_similarity

        # Victim profile contribution
        s_victim = w.get("victim_profile_similarity", 0.10) * features.victim_profile_similarity

        # Semantic profile contribution
        s_semantic = w.get("semantic_similarity", 0.12) * features.semantic_similarity

        raw_sum = s_city + s_crime + s_weapon + s_temporal + s_tod + s_victim + s_semantic

        # Compound boost
        boost = features.compound_score_boost

        # Rarity adjustment
        rarity_adj = (raw_sum * features.rarity_multiplier) - raw_sum

        final_score = (raw_sum + boost) * features.rarity_multiplier
        final_score = round(max(0.0, min(1.0, final_score)), 3)

        breakdown = RelationshipScoreBreakdown(
            same_city=round(s_city, 3),
            crime_code_match=round(s_crime if features.crime_code_match else 0.0, 3),
            crime_description_match=round(s_crime if not features.crime_code_match and features.crime_description_match else 0.0, 3),
            crime_domain_match=round(s_crime if not features.crime_description_match and features.crime_domain_match else 0.0, 3),
            weapon_match=round(s_weapon, 3),
            temporal_proximity=round(s_temporal, 3),
            time_of_day_proximity=round(s_tod, 3),
            victim_profile_similarity=round(s_victim, 3),
            semantic_similarity=round(s_semantic, 3),
            compound_boost=round(boost, 3),
            rarity_adjustment=round(rarity_adj, 3),
        )

        return final_score, breakdown

    def compare_case_pair(
        self, case_a: CaseModel, case_b: CaseModel
    ) -> Optional[RelationshipExplanation]:
        """
        Direct pairwise comparison of two cases.
        """
        features = self.extract_features(case_a, case_b)
        score, breakdown = self.score_features(features)

        min_conf = self.thresholds.get("minimum_confidence_for_ui", 0.35)
        if score < min_conf:
            return None

        # Build natural-language evidence
        evidence = RelationshipExplanationService.generate_explanation_bullets(features, case_a, case_b)

        # Supporting signals
        signals = []
        if features.same_city:
            signals.append("same_city")
        if features.crime_code_match:
            signals.append("same_crime_code")
        elif features.crime_description_match:
            signals.append("same_crime_description")
        if features.weapon_match:
            signals.append("same_weapon")
        if features.temporal_similarity >= 0.50:
            signals.append("temporal_proximity")
        if features.time_of_day_similarity >= 0.50:
            signals.append("similar_time_of_day")
        if features.compound_score_boost > 0:
            signals.append("compound_profile_pattern")

        # Categorize confidence & labels
        category = RelationshipExplanationService.classify_confidence(score)
        rel_type_label, edge_label = RelationshipExplanationService.get_relationship_labels(
            features, score, case_a, case_b
        )

        matching_attrs = {
            "city": case_a.location.city if features.same_city else None,
            "crime_code": case_a.incident.crime_code if features.crime_code_match else None,
            "crime_description": case_a.incident.crime_description if features.crime_description_match else None,
            "weapon": case_a.weapon.used if features.weapon_match else None,
        }
        matching_attrs = {k: v for k, v in matching_attrs.items() if v is not None}

        differing_attrs = {
            "date_separation_days": features.incident_date_difference_days,
            "hour_difference": features.hour_difference,
            "victim_age_difference": features.victim_age_difference,
        }
        differing_attrs = {k: v for k, v in differing_attrs.items() if v is not None}

        rel_id = f"REL::{case_a.case_id}::{case_b.case_id}"

        return RelationshipExplanation(
            relationship_id=rel_id,
            source_case=case_a.case_id,
            target_case=case_b.case_id,
            relationship_type="similar_incident_profile",
            relationship_type_label=rel_type_label,
            edge_label=edge_label,
            primary_relationship_type="similar_incident_profile",
            supporting_signals=signals,
            confidence=score,
            category=category,
            score_breakdown=breakdown,
            evidence=evidence,
            features=features,
            matching_attributes=matching_attrs,
            differing_attributes=differing_attrs,
        )

    def get_related_cases(
        self,
        case_id: str,
        min_confidence: Optional[float] = None,
        limit: int = 20,
    ) -> List[RelationshipExplanation]:
        """
        Fast on-demand retrieval of strongest related cases for a given case.
        Results are cached for instant repeated retrieval.
        """
        if case_id in self._relationship_cache:
            results = self._relationship_cache[case_id]
            if min_confidence is not None:
                results = [r for r in results if r.confidence >= min_confidence]
            return results[:limit]

        target_case = self.case_map.get(case_id)
        if not target_case:
            return []

        candidates = self.get_candidate_case_indices(target_case, max_candidates=250)
        relationships: List[RelationshipExplanation] = []

        for c_idx in candidates:
            other_case = self.cases[c_idx]
            rel = self.compare_case_pair(target_case, other_case)
            if rel:
                relationships.append(rel)

        # Sort descending by confidence
        relationships.sort(key=lambda r: r.confidence, reverse=True)
        self._relationship_cache[case_id] = relationships

        if min_confidence is not None:
            relationships = [r for r in relationships if r.confidence >= min_confidence]

        return relationships[:limit]
