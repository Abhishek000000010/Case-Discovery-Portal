from typing import List, Tuple, Dict, Any, Optional, Set
from backend.app.models.case_models import CaseEvent
from backend.app.utils.text_normalization import normalize_text


class EventSequenceResult(tuple):
    def __new__(cls, score: float, evidence: List[str], breakdown: Optional[Dict[str, Any]] = None):
        obj = super().__new__(cls, (score, evidence))
        obj.score = score
        obj.evidence = evidence
        obj.breakdown = breakdown or {}
        obj.lcs = obj.breakdown.get("lcs", [])
        obj.shared_transitions = obj.breakdown.get("shared_transitions", [])
        return obj


class EventSequenceService:
    """
    Evaluates behavioural event sequences, temporal ordering, and transition patterns
    across distinct crime incidents using normalized Longest Common Subsequence (LCS)
    and Markovian transition-chain alignment.
    """

    @staticmethod
    def _extract_ordered_event_types(events: List[CaseEvent]) -> List[str]:
        sorted_events = sorted(
            events,
            key=lambda e: (e.timestamp or "")
        )
        return [normalize_text(e.type) for e in sorted_events if e.type]

    @staticmethod
    def _longest_common_subsequence(seq1: List[str], seq2: List[str]) -> List[str]:
        """
        Computes the Longest Common Subsequence (LCS) preserving chronological order.
        """
        m, n = len(seq1), len(seq2)
        dp = [[0] * (n + 1) for _ in range(m + 1)]

        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if seq1[i - 1] == seq2[j - 1]:
                    dp[i][j] = dp[i - 1][j - 1] + 1
                else:
                    dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])

        # Backtrack to reconstruct the LCS sequence
        lcs = []
        i, j = m, n
        while i > 0 and j > 0:
            if seq1[i - 1] == seq2[j - 1]:
                lcs.append(seq1[i - 1])
                i -= 1
                j -= 1
            elif dp[i - 1][j] >= dp[i][j - 1]:
                i -= 1
            else:
                j -= 1

        lcs.reverse()
        return lcs

    @staticmethod
    def _extract_transitions(seq: List[str]) -> Set[Tuple[str, str]]:
        transitions = set()
        for i in range(len(seq) - 1):
            transitions.add((seq[i], seq[i + 1]))
        return transitions

    @staticmethod
    def compare_event_sequences(
        events_a: List[CaseEvent],
        events_b: List[CaseEvent]
    ) -> EventSequenceResult:
        """
        Evaluates behavioural event-chain concordance.
        Returns EventSequenceResult (unpacks as (score, evidence), and exposes .breakdown, .lcs)
        """
        seq_a = EventSequenceService._extract_ordered_event_types(events_a)
        seq_b = EventSequenceService._extract_ordered_event_types(events_b)

        if not seq_a or not seq_b:
            return EventSequenceResult(0.0, [], {"lcs": [], "shared_transitions": []})

        # 1. Normalized Longest Common Subsequence (LCS)
        lcs = EventSequenceService._longest_common_subsequence(seq_a, seq_b)
        lcs_len = len(lcs)

        # Harmonic normalization
        lcs_score = (2.0 * lcs_len) / (len(seq_a) + len(seq_b)) if (len(seq_a) + len(seq_b)) > 0 else 0.0

        # 2. Directed Transition Bigram Overlap (order preservation)
        trans_a = EventSequenceService._extract_transitions(seq_a)
        trans_b = EventSequenceService._extract_transitions(seq_b)
        shared_transitions = trans_a.intersection(trans_b)

        total_trans = trans_a.union(trans_b)
        trans_score = len(shared_transitions) / len(total_trans) if total_trans else 0.0

        # Weighted combination: 60% LCS, 40% Transition Bigrams
        if total_trans:
            composite = 0.60 * lcs_score + 0.40 * trans_score
        else:
            composite = lcs_score

        composite = round(min(1.0, max(0.0, composite)), 3)

        evidence: List[str] = []
        if lcs_len >= 2:
            chain_str = " → ".join(lcs)
            if composite >= 0.80:
                evidence.append(f"High behavioural event-chain concordance ({composite * 100:.0f}%): [{chain_str}]")
            else:
                evidence.append(f"Shared sequential action stages: [{chain_str}]")
        elif lcs_len == 1 and composite >= 0.50:
            evidence.append(f"Single shared event stage: [{lcs[0]}]")

        if shared_transitions:
            formatted_trans = [f"{t[0]} → {t[1]}" for t in list(shared_transitions)[:3]]
            evidence.append(f"Matching tactical transitions: ({', '.join(formatted_trans)})")

        breakdown = {
            "similarity": composite,
            "seq_a": seq_a,
            "seq_b": seq_b,
            "lcs": lcs,
            "shared_transitions": [f"{t[0]} -> {t[1]}" for t in shared_transitions]
        }

        return EventSequenceResult(composite, evidence, breakdown)
