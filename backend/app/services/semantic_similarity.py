from abc import ABC, abstractmethod
from typing import List, Dict, Tuple, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from backend.app.models.case_models import CaseModel
from backend.app.utils.text_normalization import normalize_text


class BaseSemanticSimilarityService(ABC):
    @abstractmethod
    def fit_corpus(self, cases: List[CaseModel]):
        pass

    @abstractmethod
    def compute_similarity(self, case_a_id: str, case_b_id: str) -> Tuple[float, List[str]]:
        pass


class SemanticSimilarityService(BaseSemanticSimilarityService):
    """
    Local, fully-explainable TF-IDF + Cosine Similarity text comparison engine.
    Extracts top overlapping high-tfidf keywords to provide explainability.
    Designed with a clean interface so an embedding-based model can replace it seamlessly.
    """

    def __init__(self):
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.tfidf_matrix: Optional[np.ndarray] = None
        self.case_id_to_idx: Dict[str, int] = {}
        self.feature_names: List[str] = []
        self.case_texts: Dict[str, str] = {}

    def _build_case_document(self, case: CaseModel) -> str:
        tokens = [
            case.summary or "",
            case.case_type.replace("_", " ") if case.case_type else "",
            " ".join(case.tags),
            " ".join(case.modus_operandi)
        ]

        for ev in case.events:
            if ev.description:
                tokens.append(ev.description)
            if ev.type:
                tokens.append(ev.type.replace("_", " "))

        for evi in case.evidence:
            if evi.description:
                tokens.append(evi.description)
            if evi.type:
                tokens.append(evi.type.replace("_", " "))

        full_text = " ".join(tokens)
        return normalize_text(full_text)

    def fit_corpus(self, cases: List[CaseModel]):
        self.case_texts = {c.case_id: self._build_case_document(c) for c in cases}
        case_ids = list(self.case_texts.keys())
        self.case_id_to_idx = {cid: idx for idx, cid in enumerate(case_ids)}

        documents = [self.case_texts[cid] for cid in case_ids]

        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            max_df=0.90,
            min_df=1,
            ngram_range=(1, 2)
        )
        self.tfidf_matrix = self.vectorizer.fit_transform(documents)
        self.feature_names = self.vectorizer.get_feature_names_out()

    def compute_similarity(self, case_a_id: str, case_b_id: str) -> Tuple[float, List[str]]:
        if self.tfidf_matrix is None or case_a_id not in self.case_id_to_idx or case_b_id not in self.case_id_to_idx:
            return 0.0, []

        idx_a = self.case_id_to_idx[case_a_id]
        idx_b = self.case_id_to_idx[case_b_id]

        vec_a = self.tfidf_matrix[idx_a]
        vec_b = self.tfidf_matrix[idx_b]

        sim_matrix = cosine_similarity(vec_a, vec_b)
        sim = float(sim_matrix[0][0])
        sim = round(max(0.0, min(1.0, sim)), 3)

        evidence = []
        if sim >= 0.25:
            # Find common salient words with non-zero weights
            row_a = vec_a.toarray().flatten()
            row_b = vec_b.toarray().flatten()
            prod = row_a * row_b
            top_indices = np.argsort(prod)[::-1][:4]

            salient_terms = [
                self.feature_names[i]
                for i in top_indices
                if prod[i] > 0.01
            ]

            if salient_terms:
                evidence.append(f"Semantic narrative overlap (keywords: '{', '.join(salient_terms)}')")
            elif sim >= 0.40:
                evidence.append(f"Strong contextual vocabulary overlap ({sim * 100:.0f}%)")

        return sim, evidence
