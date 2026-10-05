from typing import List, Tuple, Set, Dict, Any, Optional
from backend.app.utils.text_normalization import normalize_text, fuzzy_string_similarity


class MoComparisonResult(tuple):
    def __new__(cls, score: float, evidence: List[str], breakdown: Optional[Dict[str, Any]] = None):
        obj = super().__new__(cls, (score, evidence))
        obj.score = score
        obj.evidence = evidence
        obj.breakdown = breakdown or {}
        obj.matching = obj.breakdown.get("matching", [])
        obj.differing_a = obj.breakdown.get("differing_a", [])
        obj.differing_b = obj.breakdown.get("differing_b", [])
        return obj


class ModusOperandiService:
    """
    Evaluates behavioural and Modus Operandi (MO) overlap between crime incidents.
    Uses multi-granularity tokenized set comparison, semantic sub-token alignment,
    and returns exact matching vs differing components for transparent explainability.
    """

    @staticmethod
    def _tokenize_mo_item(item: str) -> Set[str]:
        cleaned = normalize_text(item).replace("-", "_")
        tokens = set(cleaned.split("_"))
        tokens.discard("")
        return tokens

    @staticmethod
    def calculate_mo_similarity(
        mo_list_a: List[str],
        mo_list_b: List[str]
    ) -> MoComparisonResult:
        """
        Computes set/vector style comparison of normalized MO attributes.
        Returns MoComparisonResult (unpacks as (score, evidence), and exposes .breakdown, .matching, .differing_a, .differing_b)
        """
        if not mo_list_a or not mo_list_b:
            breakdown = {"matching": [], "differing_a": mo_list_a or [], "differing_b": mo_list_b or []}
            return MoComparisonResult(0.0, [], breakdown)

        norm_a: Dict[str, str] = {normalize_text(m): m for m in mo_list_a if m}
        norm_b: Dict[str, str] = {normalize_text(m): m for m in mo_list_b if m}

        set_a = set(norm_a.keys())
        set_b = set(norm_b.keys())

        # 1. Exact matches
        exact_matched = set_a.intersection(set_b)
        remaining_a = set_a - exact_matched
        remaining_b = set_b - exact_matched

        # 2. Sub-token & fuzzy semantic matching for remaining
        soft_matched_a = set()
        soft_matched_b = set()
        soft_matches: List[Tuple[str, str, float]] = []

        for a_item in remaining_a:
            tokens_a = ModusOperandiService._tokenize_mo_item(a_item)
            best_match = None
            best_sim = 0.0

            for b_item in remaining_b:
                if b_item in soft_matched_b:
                    continue
                tokens_b = ModusOperandiService._tokenize_mo_item(b_item)

                # Sub-token Jaccard
                token_jaccard = (
                    len(tokens_a.intersection(tokens_b)) / len(tokens_a.union(tokens_b))
                    if tokens_a.union(tokens_b) else 0.0
                )
                fuzzy_sim = fuzzy_string_similarity(a_item, b_item)
                composite_sim = max(token_jaccard, fuzzy_sim)

                if composite_sim >= 0.70 and composite_sim > best_sim:
                    best_sim = composite_sim
                    best_match = b_item

            if best_match and best_sim >= 0.70:
                soft_matched_a.add(a_item)
                soft_matched_b.add(best_match)
                soft_matches.append((norm_a[a_item], norm_b[best_match], round(best_sim, 2)))

        differing_a = [norm_a[item] for item in (remaining_a - soft_matched_a)]
        differing_b = [norm_b[item] for item in (remaining_b - soft_matched_b)]

        matching_display = [norm_a[item] for item in exact_matched]
        for a_disp, b_disp, _ in soft_matches:
            matching_display.append(f"{a_disp} ~ {b_disp}")

        # Compute continuous Jaccard with soft match weight
        effective_intersection = len(exact_matched) + sum(sim for _, _, sim in soft_matches)
        total_unique = len(set_a.union(set_b))

        jaccard = round(min(1.0, effective_intersection / total_unique), 3) if total_unique > 0 else 0.0

        evidence: List[str] = []
        if jaccard >= 0.99 and len(exact_matched) == len(set_a) == len(set_b):
            matched_items_str = ", ".join(sorted(matching_display))
            evidence.append(f"Identical modus operandi pattern ({len(exact_matched)} techniques): [{matched_items_str}]")
        elif exact_matched:
            matched_items_str = ", ".join(sorted(matching_display[:4]))
            evidence.append(f"Shared modus operandi elements ({len(exact_matched)}): [{matched_items_str}]")

        for a_disp, b_disp, sim in soft_matches:
            evidence.append(f"Sub-pattern MO alignment: '{a_disp}' resembles '{b_disp}' (similarity: {sim})")

        if differing_a and differing_b and jaccard >= 0.50:
            evidence.append(
                f"MO Variations: [{', '.join(differing_a[:2])}] vs [{', '.join(differing_b[:2])}]"
            )

        breakdown = {
            "similarity": jaccard,
            "matching": matching_display,
            "differing_a": differing_a,
            "differing_b": differing_b,
        }

        return MoComparisonResult(jaccard, evidence, breakdown)
