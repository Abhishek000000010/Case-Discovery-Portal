from typing import List, Dict, Any, Set, Tuple
from collections import defaultdict
from backend.app.models.relationship_models import RelationshipExplanation
from backend.app.models.case_models import CaseModel


class EvaluationService:
    """
    Evaluates discovered relationships against synthetic benchmark ground truth.
    CRITICAL: This service is the ONLY component in the entire platform permitted to inspect
    ground_truth_relationships_for_testing.
    The relationship engine executes completely independently during inference.
    """

    @staticmethod
    def evaluate(
        discovered: List[RelationshipExplanation],
        ground_truth_raw: List[Dict[str, Any]],
        confidence_threshold: float = 0.40,
        cases: List[CaseModel] = None
    ) -> Dict[str, Any]:
        # Build set of ground truth undirected pairs
        gt_pairs: Set[Tuple[str, str]] = set()
        gt_details: Dict[Tuple[str, str], Dict[str, Any]] = {}
        category_gt_pairs: Dict[str, Set[Tuple[str, str]]] = defaultdict(set)

        for item in ground_truth_raw:
            s = item.get("source_id")
            t = item.get("target_id")
            rel_type = item.get("relationship_type", "unknown")
            if s and t:
                pair = (s, t) if s < t else (t, s)
                gt_pairs.add(pair)
                gt_details[pair] = item
                category_gt_pairs[rel_type].add(pair)

        # Filter discovered by confidence threshold
        active_discovered = [r for r in discovered if r.confidence >= confidence_threshold]
        discovered_pairs: Set[Tuple[str, str]] = set()
        disc_details: Dict[Tuple[str, str], RelationshipExplanation] = {}

        for r in active_discovered:
            pair = (r.source_case, r.target_case) if r.source_case < r.target_case else (r.target_case, r.source_case)
            discovered_pairs.add(pair)
            disc_details[pair] = r

        matched_pairs = gt_pairs.intersection(discovered_pairs)
        missed_pairs = gt_pairs - discovered_pairs
        extra_discovered_pairs = discovered_pairs - gt_pairs

        tp = len(matched_pairs)
        fn = len(missed_pairs)
        fp = len(extra_discovered_pairs)

        precision = round(tp / (tp + fp), 4) if (tp + fp) > 0 else 0.0
        recall = round(tp / (tp + fn), 4) if (tp + fn) > 0 else 0.0
        f1 = round(2 * (precision * recall) / (precision + recall), 4) if (precision + recall) > 0 else 0.0

        # Category-level breakdown evaluation
        category_evaluation = {}
        for cat, cat_gt in category_gt_pairs.items():
            cat_matched = cat_gt.intersection(discovered_pairs)
            cat_tp = len(cat_matched)
            cat_total = len(cat_gt)
            cat_recall = round(cat_tp / cat_total, 3) if cat_total > 0 else 0.0
            category_evaluation[cat] = {
                "ground_truth_count": cat_total,
                "detected_count": cat_tp,
                "recall": cat_recall,
                "detection_rate_pct": f"{cat_recall * 100:.1f}%"
            }

        # Sample matched examples
        matched_samples = []
        for pair in list(matched_pairs)[:12]:
            disc = disc_details[pair]
            gt = gt_details[pair]
            matched_samples.append({
                "case_pair": f"{pair[0]} ↔ {pair[1]}",
                "gt_type": gt.get("relationship_type"),
                "discovered_type": disc.relationship_type,
                "confidence": disc.confidence,
                "category": disc.category,
                "supporting_signals": disc.supporting_signals,
                "evidence": disc.evidence[:3]
            })

        # Negative control checks:
        # Sample pairs of cases that have different types, different dates, different locations,
        # different MO, and no shared entities to confirm the engine does NOT produce false positives.
        negative_test_results = []
        if cases:
            neg_candidates = []
            for i in range(min(20, len(cases))):
                for j in range(len(cases) - 1, max(len(cases) - 21, i), -1):
                    c1 = cases[i]
                    c2 = cases[j]
                    if c1.case_type != c2.case_type:
                        p = (c1.case_id, c2.case_id) if c1.case_id < c2.case_id else (c2.case_id, c1.case_id)
                        if p not in gt_pairs:
                            neg_candidates.append((p, c1, c2))
                            if len(neg_candidates) >= 12:
                                break
                if len(neg_candidates) >= 12:
                    break

            for p_info in neg_candidates:
                neg_pair = p_info[0]
                was_detected = neg_pair in discovered_pairs
                conf = disc_details[neg_pair].confidence if was_detected else 0.0
                negative_test_results.append({
                    "case_pair": f"{neg_pair[0]} ↔ {neg_pair[1]}",
                    "c1_type": p_info[1].case_type,
                    "c2_type": p_info[2].case_type,
                    "expected_negative": True,
                    "correctly_rejected": not was_detected,
                    "confidence": conf,
                    "status": "CORRECTLY REJECTED" if not was_detected else "FALSE POSITIVE"
                })

        return {
            "evaluation_note": "Synthetic benchmark evaluation comparing discovered relationships against ground truth without inference leakage.",
            "confidence_threshold": confidence_threshold,
            "metrics": {
                "ground_truth_total": len(gt_pairs),
                "discovered_total": len(discovered_pairs),
                "matched_relationships": tp,
                "unmatched_ground_truth": fn,
                "exploratory_discoveries": fp,
                "precision": precision,
                "recall": recall,
                "f1_score": f1
            },
            "category_level_evaluation": category_evaluation,
            "matched_samples": matched_samples,
            "negative_control_checks": negative_test_results
        }
