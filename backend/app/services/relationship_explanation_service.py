from typing import List, Dict, Any, Optional
from backend.app.models.relationship_models import RelationshipFeatures
from backend.app.models.case_models import CaseModel
from backend.app.models.entity_models import PersonEntity, LocationEntity, VehicleEntity, ObjectEntity


class RelationshipExplanationService:
    """
    Dedicated explanation engine that transforms structured numeric/vector features
    into clear, defensible, human-readable investigative evidence statements.
    Ensures zero hardcoded scenario conclusions.
    """

    @staticmethod
    def generate_explanation_bullets(
        features: RelationshipFeatures,
        case_a: CaseModel,
        case_b: CaseModel,
        entities: Dict[str, Any]
    ) -> List[str]:
        evidence: List[str] = []
        person_map = entities.get("person_map", {})
        vehicle_map = entities.get("vehicle_map", {})
        object_map = entities.get("object_map", {})
        location_map = entities.get("location_map", {})

        # 1. Direct People
        p_ids_a = {p.person_id for p in case_a.people_involved}
        p_ids_b = {p.person_id for p in case_b.people_involved}
        shared_persons = p_ids_a.intersection(p_ids_b)
        for pid in sorted(list(shared_persons)):
            p_name = person_map[pid].name if pid in person_map else pid
            evidence.append(f"Identical individual documented in both incident reports: {p_name} ({pid})")

        # 2. Witnesses
        w_ids_a = {w.person_id for w in case_a.witnesses}
        w_ids_b = {w.person_id for w in case_b.witnesses}
        shared_witnesses = w_ids_a.intersection(w_ids_b)
        for wid in sorted(list(shared_witnesses)):
            w_name = person_map[wid].name if wid in person_map else wid
            evidence.append(f"Witness statement overlap: {w_name} ({wid}) gave statements across both cases")

        # 3. Direct Vehicles
        v_ids_a = {v.vehicle_id for v in case_a.vehicles}
        v_ids_b = {v.vehicle_id for v in case_b.vehicles}
        shared_vehicles = v_ids_a.intersection(v_ids_b)
        for vid in sorted(list(shared_vehicles)):
            v_obj = vehicle_map.get(vid)
            reg = v_obj.registration if v_obj else vid
            vtype = v_obj.type if v_obj else "vehicle"
            evidence.append(f"Same vehicle identified across incidents: {reg} ({vtype}, ID: {vid})")

        # 4. Direct Objects
        o_ids_a = {o.object_id for o in case_a.objects}
        o_ids_b = {o.object_id for o in case_b.objects}
        shared_objects = o_ids_a.intersection(o_ids_b)
        for oid in sorted(list(shared_objects)):
            o_obj = object_map.get(oid)
            desc = o_obj.description if o_obj else oid
            evidence.append(f"Matched physical evidence item / stolen property: {desc} ({oid})")

        # 5. Geographic Proximity
        if features.location_exact_match:
            evidence.append("Occurred at the exact same physical scene / address")
        elif features.location_distance_km is not None and features.location_distance_km >= 0:
            dist = features.location_distance_km
            if dist <= 3.0:
                evidence.append(f"Immediate geographic proximity: incident locations are within {dist:.1f} km")
            elif dist <= 10.0:
                evidence.append(f"Localized geographic proximity: incident locations are {dist:.1f} km apart")
            elif dist <= 25.0:
                evidence.append(f"Corridor proximity: incidents occurred {dist:.1f} km apart")

        # 6. Temporal Proximity
        if features.incident_date_difference_days is not None:
            days = features.incident_date_difference_days
            if days == 0:
                evidence.append("Incidents occurred on the exact same date")
            elif days == 1:
                evidence.append("Incidents occurred 1 day apart")
            elif days <= 7:
                evidence.append(f"Incidents occurred within a 7-day operational window ({days} days apart)")
            elif days <= 21:
                evidence.append(f"Incidents occurred within 3 weeks of each other ({days} days apart)")
            elif features.temporal_similarity >= 0.20:
                evidence.append(f"Incidents occurred {days} days apart")

        # 7. Modus Operandi
        if features.mo_matching:
            mo_str = ", ".join(sorted(features.mo_matching[:4]))
            pct = int(features.modus_operandi_similarity * 100)
            evidence.append(f"Modus operandi overlap ({pct}% concordance): matching techniques [{mo_str}]")

        # 8. Event Sequence LCS & Transitions
        if features.event_common_subsequence and len(features.event_common_subsequence) >= 2:
            chain_str = " → ".join(features.event_common_subsequence)
            pct = int(features.event_sequence_similarity * 100)
            evidence.append(f"Matching sequential action progression ({pct}% concordance): [{chain_str}]")

        # 9. Crime Classifications
        if case_a.case_type == case_b.case_type:
            evidence.append(f"Identical crime classification: '{case_a.case_type.replace('_', ' ')}'")

        # 10. Semantic Narrative Overlap
        if features.semantic_similarity >= 0.45:
            pct = int(features.semantic_similarity * 100)
            evidence.append(f"Corroborating narrative vocabulary and context overlap ({pct}%)")

        # 11. Thematic Tags
        tags_a = set(case_a.tags)
        tags_b = set(case_b.tags)
        shared_tags = tags_a.intersection(tags_b)
        if shared_tags and len(shared_tags) >= 2:
            evidence.append(f"Shared investigative tags: [{', '.join(sorted(list(shared_tags)))}]")

        return evidence
