from typing import List, Tuple, Dict, Any, Optional
from backend.app.models.entity_models import PersonEntity, VehicleEntity, LocationEntity, ObjectEntity
from backend.app.utils.text_normalization import (
    normalize_text,
    clean_identifier,
    fuzzy_string_similarity,
    normalize_vehicle_registration,
    compare_person_names,
)


class EntityComparisonResult(tuple):
    def __new__(cls, score: float, evidence: List[str], breakdown: Optional[Dict[str, Any]] = None):
        obj = super().__new__(cls, (score, evidence))
        obj.score = score
        obj.evidence = evidence
        obj.breakdown = breakdown or {}
        return obj


class EntityResolver:
    """
    Entity Resolution layer designed for robust disambiguation of individuals,
    vehicles, locations, and objects across diverse representations.
    Never blindly merges records; produces match_confidence and match_reasons.
    """

    @staticmethod
    def compare_persons(
        p1: PersonEntity,
        p2: PersonEntity
    ) -> EntityComparisonResult:
        evidence = []
        if p1.person_id == p2.person_id:
            return EntityComparisonResult(1.0, [f"Identical authoritative ID: {p1.person_id}"], {"match_confidence": 1.0, "match_type": "exact_id"})

        # Compare primary names with initials / abbreviation support
        name_sim, name_ev = compare_person_names(p1.name, p2.name)
        if name_ev:
            evidence.extend(name_ev)

        # Compare aliases
        alias_matches = []
        all_p1_names = [p1.name] + list(p1.aliases)
        all_p2_names = [p2.name] + list(p2.aliases)

        max_alias_sim = 0.0
        for a1 in all_p1_names:
            for a2 in all_p2_names:
                sim, a_ev = compare_person_names(a1, a2)
                if sim > max_alias_sim:
                    max_alias_sim = sim
                if a_ev and sim >= 0.85:
                    alias_matches.extend(a_ev)

        base_score = max(name_sim, max_alias_sim)
        if alias_matches or (p1.aliases and p2.aliases and set(p1.aliases).intersection(set(p2.aliases))):
            evidence.append(f"Matching alias/name variation: aliases or normalized forms align")
            evidence.extend(alias_matches)

        # Contextual boosts
        if p1.home_location_id and p2.home_location_id and p1.home_location_id == p2.home_location_id:
            base_score = min(1.0, base_score + 0.12)
            evidence.append(f"Shared residential location code: {p1.home_location_id}")

        if p1.occupation and p2.occupation and normalize_text(p1.occupation) == normalize_text(p2.occupation):
            base_score = min(1.0, base_score + 0.08)
            evidence.append(f"Matching reported occupation: {p1.occupation}")

        final_score = round(min(1.0, base_score), 4)
        breakdown = {
            "match_confidence": final_score,
            "match_reasons": evidence,
            "name_sim": name_sim,
            "alias_sim": max_alias_sim,
        }
        return EntityComparisonResult(final_score, evidence, breakdown)

    @staticmethod
    def compare_vehicles(
        v1: VehicleEntity,
        v2: VehicleEntity
    ) -> EntityComparisonResult:
        evidence = []
        if v1.vehicle_id == v2.vehicle_id:
            return EntityComparisonResult(1.0, [f"Identical authoritative vehicle ID: {v1.vehicle_id}"], {"match_confidence": 1.0, "match_type": "exact_id"})

        norm_reg1 = normalize_vehicle_registration(v1.registration)
        norm_reg2 = normalize_vehicle_registration(v2.registration)

        plate_matched = False
        reg_sim = 0.0
        if norm_reg1 and norm_reg2:
            if norm_reg1 == norm_reg2:
                plate_matched = True
                reg_sim = 1.0
                evidence.append(f"Exact vehicle registration match: '{v1.registration}'")
            else:
                reg_sim = fuzzy_string_similarity(norm_reg1, norm_reg2)
                if reg_sim >= 0.88:
                    evidence.append(f"Closely matching license plates: '{v1.registration}' ~ '{v2.registration}' ({reg_sim:.2f})")

        type_match = False
        if v1.type and v2.type and normalize_text(v1.type) == normalize_text(v2.type):
            type_match = True
            evidence.append(f"Matching vehicle category: {v1.type}")

        color_match = False
        if v1.color and v2.color and normalize_text(v1.color) == normalize_text(v2.color):
            color_match = True
            evidence.append(f"Matching vehicle color: {v1.color}")

        owner_match = False
        if v1.owner_person_id and v2.owner_person_id and v1.owner_person_id == v2.owner_person_id:
            owner_match = True
            evidence.append(f"Same registered vehicle owner: {v1.owner_person_id}")

        if plate_matched:
            final_score = 1.0
        else:
            final_score = (
                reg_sim * 0.55 +
                (0.18 if type_match else 0.0) +
                (0.12 if color_match else 0.0) +
                (0.15 if owner_match else 0.0)
            )

        final_score = round(min(1.0, final_score), 4)
        breakdown = {
            "match_confidence": final_score,
            "match_reasons": evidence,
            "plate_matched": plate_matched,
            "reg_sim": reg_sim
        }
        return EntityComparisonResult(final_score, evidence, breakdown)
