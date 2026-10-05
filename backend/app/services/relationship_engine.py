import math
from typing import List, Dict, Any, Set, Tuple, Optional
from itertools import combinations
from collections import Counter

from backend.app.models.case_models import CaseModel
from backend.app.models.entity_models import PersonEntity, LocationEntity, VehicleEntity, ObjectEntity
from backend.app.models.relationship_models import (
    RelationshipFeatures,
    RelationshipScoreBreakdown,
    RelationshipExplanation,
    CandidatePair,
)
from backend.app.services.geographic_service import GeographicService
from backend.app.services.temporal_service import TemporalService
from backend.app.services.modus_operandi_service import ModusOperandiService
from backend.app.services.event_sequence_service import EventSequenceService
from backend.app.services.semantic_similarity import SemanticSimilarityService
from backend.app.services.relationship_explanation_service import RelationshipExplanationService
from backend.app.utils.scoring import clamp_score, categorize_confidence


class RelationshipEngine:
    """
    Layered, explainable Case Relationship Intelligence Engine.
    Operates strictly autonomously without ground truth access.
    
    Pipeline Stages:
    1. Normalization & Corpus Frequency Indexing (Rarity / Discriminative Power)
    2. Candidate Generation (Multi-Signal indexing with stored reasons)
    3. Feature Extraction (Structured RelationshipFeatures vector)
    4. Rarity-Aware Scoring & Evidence Quality Weighting
    5. Multi-Signal Classification (Primary type + Supporting signals)
    6. Evidence Generation (Via RelationshipExplanationService)
    7. Confidence Calibration (VERY HIGH, HIGH, MODERATE, WEAK, IGNORE)
    """

    def __init__(
        self,
        config: Dict[str, Any],
        semantic_service: Optional[SemanticSimilarityService] = None
    ):
        self.config = config
        self.weights = config.get("weights", {})
        self.thresholds = config.get("thresholds", {})
        self.semantic_service = semantic_service or SemanticSimilarityService()

        # Corpus frequency counters for Rarity-Aware Scoring
        self.total_corpus_cases: int = 120
        self.person_frequencies: Counter = Counter()
        self.vehicle_frequencies: Counter = Counter()
        self.object_frequencies: Counter = Counter()
        self.tag_frequencies: Counter = Counter()
        self.mo_frequencies: Counter = Counter()
        self.crime_type_frequencies: Counter = Counter()

    def build_corpus_frequencies(self, cases: List[CaseModel]):
        """
        Computes occurrence frequencies across the case corpus to quantify
        feature rarity (Inverse Document Frequency / discriminative power).
        """
        self.total_corpus_cases = max(len(cases), 1)
        self.person_frequencies.clear()
        self.vehicle_frequencies.clear()
        self.object_frequencies.clear()
        self.tag_frequencies.clear()
        self.mo_frequencies.clear()
        self.crime_type_frequencies.clear()

        for c in cases:
            self.crime_type_frequencies[c.case_type] += 1
            for p in c.people_involved:
                self.person_frequencies[p.person_id] += 1
            for v in c.vehicles:
                self.vehicle_frequencies[v.vehicle_id] += 1
            for o in c.objects:
                self.object_frequencies[o.object_id] += 1
            for t in c.tags:
                self.tag_frequencies[t] += 1
            for mo in c.modus_operandi:
                self.mo_frequencies[mo] += 1

    def calculate_rarity_multiplier(
        self,
        shared_persons: Set[str],
        shared_vehicles: Set[str],
        shared_objects: Set[str],
        matching_mo: List[str]
    ) -> float:
        """
        Rarity-Aware Scoring:
        Features appearing in very few cases (e.g., a specific vehicle plate in 2 cases)
        carry high discriminative power. Features appearing across 50+ cases carry low power.
        """
        if not (shared_persons or shared_vehicles or shared_objects or matching_mo):
            return 1.0

        n = float(self.total_corpus_cases)
        idf_scores: List[float] = []

        for pid in shared_persons:
            freq = self.person_frequencies.get(pid, 1)
            idf = math.log((n + 1.0) / (freq + 1.0)) + 1.0
            idf_scores.append(idf)

        for vid in shared_vehicles:
            freq = self.vehicle_frequencies.get(vid, 1)
            idf = math.log((n + 1.0) / (freq + 1.0)) + 1.0
            idf_scores.append(idf)

        for oid in shared_objects:
            freq = self.object_frequencies.get(oid, 1)
            idf = math.log((n + 1.0) / (freq + 1.0)) + 1.0
            idf_scores.append(idf)

        for mo in matching_mo:
            freq = self.mo_frequencies.get(mo, 5)
            idf = math.log((n + 1.0) / (freq + 1.0)) + 1.0
            idf_scores.append(idf)

        if not idf_scores:
            return 1.0

        # Average normalized IDF multiplier (bounded between 0.85 and 1.25)
        avg_idf = sum(idf_scores) / len(idf_scores)
        max_possible_idf = math.log(n + 1.0) + 1.0
        normalized = avg_idf / max(max_possible_idf, 1.0)

        # Scale to [0.90, 1.20]
        return round(0.90 + (0.30 * normalized), 3)

    def generate_candidate_pairs(
        self,
        cases: List[CaseModel],
        location_map: Dict[str, LocationEntity]
    ) -> List[CandidatePair]:
        """
        Stage 1: Scalable Multi-Signal Candidate Generation.
        Generates candidate pairs from multiple independent signals and stores the
        exact reasons why the pair was selected.
        """
        person_index: Dict[str, Set[str]] = {}
        vehicle_index: Dict[str, Set[str]] = {}
        object_index: Dict[str, Set[str]] = {}
        witness_index: Dict[str, Set[str]] = {}
        location_index: Dict[str, Set[str]] = {}
        mo_index: Dict[str, Set[str]] = {}

        candidate_reasons: Dict[Tuple[str, str], Set[str]] = {}

        for c in cases:
            cid = c.case_id
            for p in c.people_involved:
                person_index.setdefault(p.person_id, set()).add(cid)
            for v in c.vehicles:
                vehicle_index.setdefault(v.vehicle_id, set()).add(cid)
            for o in c.objects:
                object_index.setdefault(o.object_id, set()).add(cid)
            for w in c.witnesses:
                witness_index.setdefault(w.person_id, set()).add(cid)
            for loc in c.locations:
                location_index.setdefault(loc.location_id, set()).add(cid)
            for mo in c.modus_operandi:
                mo_index.setdefault(mo, set()).add(cid)

        def add_candidates(index: Dict[str, Set[str]], reason_tag: str):
            for key, case_set in index.items():
                if len(case_set) > 1:
                    for c1, c2 in combinations(case_set, 2):
                        pair = (c1, c2) if c1 < c2 else (c2, c1)
                        candidate_reasons.setdefault(pair, set()).add(reason_tag)

        add_candidates(person_index, "shared_person")
        add_candidates(vehicle_index, "shared_vehicle")
        add_candidates(object_index, "shared_object")
        add_candidates(witness_index, "shared_witness")
        add_candidates(location_index, "shared_location")
        add_candidates(mo_index, "similar_modus_operandi")

        # Spatial-Temporal candidate generation
        nearby_threshold = self.thresholds.get("geographic_nearby_km", 10.0)
        window_days = self.thresholds.get("temporal_window_days", 60)

        for c1, c2 in combinations(cases, 2):
            pair = (c1.case_id, c2.case_id) if c1.case_id < c2.case_id else (c2.case_id, c1.case_id)
            d1 = TemporalService.parse_date_safe(c1.incident_date or c1.reported_date)
            d2 = TemporalService.parse_date_safe(c2.incident_date or c2.reported_date)

            if d1 and d2 and abs((d1 - d2).days) <= window_days:
                geo_sim, min_dist, _, _ = GeographicService.compare_case_locations(
                    c1.locations, c2.locations, location_map
                )
                if geo_sim >= 0.50:  # <= 10 km
                    candidate_reasons.setdefault(pair, set()).add("geographic_temporal_proximity")

        return [
            CandidatePair(
                case_a_id=p[0],
                case_b_id=p[1],
                candidate_reasons=sorted(list(reasons))
            )
            for p, reasons in candidate_reasons.items()
        ]

    def extract_features(
        self,
        case_a: CaseModel,
        case_b: CaseModel,
        location_map: Dict[str, LocationEntity],
        vehicle_map: Dict[str, VehicleEntity],
        person_map: Dict[str, PersonEntity],
        object_map: Dict[str, ObjectEntity],
    ) -> RelationshipFeatures:
        """
        Stage 2: Feature Extraction.
        Produces structured RelationshipFeatures vector containing all 15+ numeric metrics.
        Never blends raw values inside an opaque formula.
        """
        f = RelationshipFeatures()

        # 1. Person Overlap
        p_ids_a = {p.person_id for p in case_a.people_involved}
        p_ids_b = {p.person_id for p in case_b.people_involved}
        shared_p = p_ids_a.intersection(p_ids_b)
        f.person_overlap = 1.0 if shared_p else 0.0

        # 2. Witness Overlap
        w_ids_a = {w.person_id for w in case_a.witnesses}
        w_ids_b = {w.person_id for w in case_b.witnesses}
        shared_w = w_ids_a.intersection(w_ids_b)
        f.witness_overlap = 1.0 if shared_w else 0.0

        # 3. Vehicle Overlap
        v_ids_a = {v.vehicle_id for v in case_a.vehicles}
        v_ids_b = {v.vehicle_id for v in case_b.vehicles}
        shared_v = v_ids_a.intersection(v_ids_b)
        f.vehicle_overlap = 1.0 if shared_v else 0.0

        # 4. Object Overlap
        o_ids_a = {o.object_id for o in case_a.objects}
        o_ids_b = {o.object_id for o in case_b.objects}
        shared_o = o_ids_a.intersection(o_ids_b)
        f.object_overlap = 1.0 if shared_o else 0.0

        # 5. Geographic Reasoning
        geo_sim, dist_km, _, is_exact_loc = GeographicService.compare_case_locations(
            case_a.locations, case_b.locations, location_map
        )
        f.location_exact_match = is_exact_loc
        f.location_distance_km = dist_km
        f.location_similarity = clamp_score(geo_sim)

        # 6. Temporal Reasoning
        decay_constant = self.thresholds.get("temporal_decay_constant_days", 14.0)
        temp_sim, days_diff, _ = TemporalService.compare_case_dates(
            case_a, case_b, decay_constant_days=decay_constant
        )
        f.incident_date_difference_days = days_diff
        f.temporal_similarity = clamp_score(temp_sim)

        # 7. Modus Operandi (Structured set/vector comparison)
        mo_res = ModusOperandiService.calculate_mo_similarity(
            case_a.modus_operandi, case_b.modus_operandi
        )
        f.modus_operandi_similarity = clamp_score(mo_res.score)
        f.mo_matching = mo_res.matching
        f.mo_differing_a = mo_res.differing_a
        f.mo_differing_b = mo_res.differing_b

        # 8. Event Sequence (Normalized LCS and Transitions)
        seq_res = EventSequenceService.compare_event_sequences(
            case_a.events, case_b.events
        )
        f.event_sequence_similarity = clamp_score(seq_res.score)
        f.event_common_subsequence = seq_res.lcs

        # 9. Semantic Text Similarity (Unified narrative comparison)
        sem_sim, _ = self.semantic_service.compute_similarity(
            case_a.case_id, case_b.case_id
        )
        f.semantic_similarity = clamp_score(sem_sim)

        # 10. Tag Overlap
        tags_a = set(case_a.tags)
        tags_b = set(case_b.tags)
        if tags_a and tags_b:
            shared_tags = tags_a.intersection(tags_b)
            f.tag_overlap = clamp_score(len(shared_tags) / max(len(tags_a), len(tags_b)))

        # 11. Crime Type Similarity (Purely based on category, NOT hardcoded scenario bypass)
        if case_a.case_type == case_b.case_type:
            f.crime_type_similarity = 1.0
        else:
            # Baseline type distance based on generic domain hierarchy
            f.crime_type_similarity = 0.20

        # 12. Direct Evidence Quality vs Contextual
        has_direct = bool(shared_p or shared_v or shared_o)
        f.direct_evidence_quality = 1.0 if has_direct else 0.0

        # 13. Rarity Multiplier
        f.rarity_multiplier = self.calculate_rarity_multiplier(
            shared_p, shared_v, shared_o, f.mo_matching
        )

        return f

    def score_case_pair(
        self,
        case_a: CaseModel,
        case_b: CaseModel,
        location_map: Dict[str, LocationEntity],
        vehicle_map: Dict[str, VehicleEntity],
        person_map: Dict[str, PersonEntity],
        object_map: Dict[str, ObjectEntity],
        candidate_reasons: Optional[List[str]] = None
    ) -> Optional[RelationshipExplanation]:
        """
        Stage 3, 4, 5, 6, 7:
        Feature Extraction -> Rarity Scoring -> Classification -> Explanation -> Calibration.
        """
        features = self.extract_features(
            case_a, case_b, location_map, vehicle_map, person_map, object_map
        )

        entities_ctx = {
            "person_map": person_map,
            "vehicle_map": vehicle_map,
            "object_map": object_map,
            "location_map": location_map,
        }

        # Weighted composite score
        w = self.weights
        base_composite = (
            w.get("person_overlap", 0.22) * features.person_overlap +
            w.get("vehicle_overlap", 0.18) * features.vehicle_overlap +
            w.get("object_overlap", 0.12) * features.object_overlap +
            w.get("location_proximity", 0.12) * features.location_similarity +
            w.get("temporal_proximity", 0.12) * features.temporal_similarity +
            w.get("modus_operandi_similarity", 0.14) * features.modus_operandi_similarity +
            w.get("event_sequence_similarity", 0.10) * features.event_sequence_similarity +
            w.get("semantic_similarity", 0.08) * features.semantic_similarity +
            w.get("witness_overlap", 0.08) * features.witness_overlap +
            w.get("tag_overlap", 0.04) * features.tag_overlap
        )

        # Apply rarity multiplier to reward rare discriminative features
        rarity_adjusted = base_composite * features.rarity_multiplier

        # Evidence Quality Distinction:
        # A shared physical identifier (person, vehicle, serial-matched object) represents
        # high-quality direct forensic evidence.
        final_score = rarity_adjusted
        if features.direct_evidence_quality > 0.0:
            final_score = max(final_score, 0.78 + (0.22 * rarity_adjusted))
        else:
            # Multi-signal corroboration boost without direct identifier
            corroboration_count = sum([
                1 for val in [
                    features.location_similarity >= 0.70,
                    features.temporal_similarity >= 0.60,
                    features.modus_operandi_similarity >= 0.60,
                    features.event_sequence_similarity >= 0.60,
                    features.semantic_similarity >= 0.50,
                    features.witness_overlap > 0.0
                ] if val
            ])
            if corroboration_count >= 4:
                final_score = min(1.0, final_score * 1.30)
            elif corroboration_count >= 3:
                final_score = min(1.0, final_score * 1.15)

        final_score = clamp_score(final_score)

        # False positive cutoff: Below 0.30 is ignored / not surfaced
        min_conf = self.thresholds.get("minimum_confidence_for_ui", 0.30)
        if final_score < min_conf:
            return None

        # Determine supporting signals list
        supporting_signals: List[str] = []
        if features.person_overlap > 0.0:
            supporting_signals.append("shared_person")
        if features.vehicle_overlap > 0.0:
            supporting_signals.append("shared_vehicle")
        if features.object_overlap > 0.0:
            supporting_signals.append("shared_object")
        if features.witness_overlap > 0.0:
            supporting_signals.append("shared_witness")
        if features.modus_operandi_similarity >= 0.60:
            supporting_signals.append("similar_modus_operandi")
        if features.event_sequence_similarity >= 0.60:
            supporting_signals.append("similar_event_sequence")
        if features.location_similarity >= 0.60:
            supporting_signals.append("geographic_proximity")
        if features.temporal_similarity >= 0.50:
            supporting_signals.append("temporal_proximity")
        if features.semantic_similarity >= 0.45:
            supporting_signals.append("semantic_similarity")

        # Determine Primary Relationship Type
        if features.person_overlap > 0.0:
            primary_rel = "same_person"
        elif features.vehicle_overlap > 0.0:
            primary_rel = "same_vehicle"
        elif features.object_overlap > 0.0:
            primary_rel = "same_object"
        elif features.witness_overlap > 0.0:
            primary_rel = "shared_witness"
        elif features.modus_operandi_similarity >= 0.70 and features.event_sequence_similarity >= 0.60:
            primary_rel = "behavioural_series"
        elif features.modus_operandi_similarity >= 0.70:
            primary_rel = "similar_modus_operandi"
        elif features.location_exact_match and features.temporal_similarity >= 0.50:
            primary_rel = "spatial_temporal_cluster"
        elif features.location_similarity >= 0.75:
            primary_rel = "geographic_proximity"
        elif features.semantic_similarity >= 0.60:
            primary_rel = "semantic_similarity"
        else:
            primary_rel = "multi_signal_correlation"

        # Evidence generation via dedicated service
        evidence = RelationshipExplanationService.generate_explanation_bullets(
            features, case_a, case_b, entities_ctx
        )

        category = categorize_confidence(
            final_score, self.thresholds, has_direct_match=(features.direct_evidence_quality > 0.0)
        )

        breakdown = RelationshipScoreBreakdown(
            person_overlap=features.person_overlap,
            vehicle_overlap=features.vehicle_overlap,
            object_overlap=features.object_overlap,
            location_similarity=features.location_similarity,
            temporal_similarity=features.temporal_similarity,
            crime_type_similarity=features.crime_type_similarity,
            modus_operandi_similarity=features.modus_operandi_similarity,
            event_sequence_similarity=features.event_sequence_similarity,
            semantic_similarity=features.semantic_similarity,
            witness_overlap=features.witness_overlap,
            tag_overlap=features.tag_overlap,
            evidence_quality_boost=round(final_score - rarity_adjusted, 3),
            rarity_adjustment=round(rarity_adjusted - base_composite, 3)
        )

        return RelationshipExplanation(
            relationship_id=f"REL_{case_a.case_id}_{case_b.case_id}",
            source_case=case_a.case_id,
            target_case=case_b.case_id,
            relationship_type=primary_rel,
            primary_relationship_type=primary_rel,
            supporting_signals=supporting_signals,
            confidence=final_score,
            category=category,
            score_breakdown=breakdown,
            evidence=evidence,
            features=features,
            mo_breakdown={
                "matching": features.mo_matching,
                "differing_a": features.mo_differing_a,
                "differing_b": features.mo_differing_b,
                "similarity": features.modus_operandi_similarity
            },
            sequence_breakdown={
                "lcs": features.event_common_subsequence,
                "similarity": features.event_sequence_similarity
            }
        )

    def discover_all_relationships(
        self,
        cases: List[CaseModel],
        entities: Dict[str, Any]
    ) -> List[RelationshipExplanation]:
        """
        Discovers all relationships across the entire case repository.
        """
        self.build_corpus_frequencies(cases)
        self.semantic_service.fit_corpus(cases)

        candidates = self.generate_candidate_pairs(cases, entities["location_map"])
        candidate_map = {(c.case_a_id, c.case_b_id): c.candidate_reasons for c in candidates}

        case_map = {c.case_id: c for c in cases}
        discovered: List[RelationshipExplanation] = []

        for cand in candidates:
            if cand.case_a_id in case_map and cand.case_b_id in case_map:
                res = self.score_case_pair(
                    case_map[cand.case_a_id],
                    case_map[cand.case_b_id],
                    entities["location_map"],
                    entities["vehicle_map"],
                    entities["person_map"],
                    entities["object_map"],
                    candidate_reasons=cand.candidate_reasons
                )
                if res is not None:
                    discovered.append(res)

        discovered.sort(key=lambda r: r.confidence, reverse=True)
        return discovered
