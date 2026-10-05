from typing import List, Dict, Any
from collections import Counter
from backend.app.models.case_models import CaseModel
from backend.app.models.relationship_models import RelationshipExplanation
from backend.app.services.anomaly_service import AnomalyService


class AnalysisService:
    """
    Computes global intelligence metrics, detects crime clusters, MO trends,
    and formats investigative intelligence briefs dynamically.
    """

    @staticmethod
    def get_summary_stats(
        cases: List[CaseModel],
        entities: Dict[str, Any],
        relationships: List[RelationshipExplanation]
    ) -> Dict[str, Any]:
        total_cases = len(cases)
        persons = len(entities.get("persons", []))
        locations = len(entities.get("locations", []))
        vehicles = len(entities.get("vehicles", []))
        objects = len(entities.get("objects", []))

        total_relationships = len(relationships)
        high_conf = len([r for r in relationships if r.confidence >= 0.75])
        moderate_conf = len([r for r in relationships if 0.55 <= r.confidence < 0.75])
        weak_conf = len([r for r in relationships if r.confidence < 0.55])

        anomalies = AnomalyService.get_all_anomalies(cases, entities)

        crime_types = dict(Counter([c.case_type for c in cases]))
        severity_dist = dict(Counter([c.severity for c in cases]))
        status_dist = dict(Counter([c.status for c in cases]))

        return {
            "total_cases": total_cases,
            "total_persons": persons,
            "total_locations": locations,
            "total_vehicles": vehicles,
            "total_objects": objects,
            "total_relationships": total_relationships,
            "high_confidence_relationships": high_conf,
            "moderate_confidence_relationships": moderate_conf,
            "weak_confidence_relationships": weak_conf,
            "potential_anomalies_count": len(anomalies),
            "crime_type_distribution": crime_types,
            "severity_distribution": severity_dist,
            "status_distribution": status_dist
        }

    @staticmethod
    def detect_patterns(
        cases: List[CaseModel],
        relationships: List[RelationshipExplanation],
        entities: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        patterns = []

        # 1. MO Patterns: Find recurring combinations of modus operandi
        mo_counter: Dict[str, List[str]] = {}
        for c in cases:
            if c.modus_operandi:
                mo_key = " + ".join(sorted(c.modus_operandi[:3]))
                mo_counter.setdefault(mo_key, []).append(c.case_id)

        for mo_key, cids in mo_counter.items():
            if len(cids) >= 3 and mo_key:
                patterns.append({
                    "pattern_id": f"PAT_MO_{len(patterns) + 1}",
                    "category": "Modus Operandi Pattern",
                    "title": f"Repeated Modus Operandi ({len(cids)} incidents)",
                    "description": f"Multiple cases exhibit signature behavioral technique: {mo_key}",
                    "case_ids": cids,
                    "confidence": 0.88,
                    "tags": ["modus_operandi", "behavioral_series"]
                })

        # 2. Location & Crime Type Clusters
        loc_map = entities.get("location_map", {})
        loc_crime_counter: Dict[Tuple[str, str], List[str]] = {}
        for c in cases:
            for l in c.locations:
                loc_crime_counter.setdefault((l.location_id, c.case_type), []).append(c.case_id)

        for (loc_id, ctype), cids in loc_crime_counter.items():
            if len(cids) >= 4:
                loc_name = loc_map[loc_id].name if loc_id in loc_map else loc_id
                patterns.append({
                    "pattern_id": f"PAT_LOC_{len(patterns) + 1}",
                    "category": "Geographic Cluster",
                    "title": f"Spatial Concentration: {ctype.replace('_', ' ').title()}",
                    "description": f"Cluster of {len(cids)} {ctype} incidents recorded in jurisdiction '{loc_name}'",
                    "case_ids": cids,
                    "confidence": 0.82,
                    "tags": ["geographic_cluster", ctype, loc_name.lower()]
                })

        # 3. High-Confidence Cross-Incident Links (e.g. Missing person to Unidentified body or Same Vehicle Series)
        top_cross_links = [
            r for r in relationships
            if r.confidence >= 0.80 and any("missing person" in ev.lower() or "same vehicle" in ev.lower() for ev in r.evidence)
        ][:5]

        for rel in top_cross_links:
            patterns.append({
                "pattern_id": f"PAT_LINK_{len(patterns) + 1}",
                "category": "Investigative Link",
                "title": f"Cross-Case Link: {rel.source_case} ↔ {rel.target_case}",
                "description": "; ".join(rel.evidence[:3]),
                "case_ids": [rel.source_case, rel.target_case],
                "confidence": rel.confidence,
                "tags": [rel.relationship_type, rel.category.lower()]
            })

        return patterns
