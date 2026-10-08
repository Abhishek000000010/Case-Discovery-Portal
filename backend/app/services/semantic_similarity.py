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
    Extracts top overlapping salient keywords to provide explainability.
    Built on top of real incident structured profile texts.
    """

    def __init__(self):
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.tfidf_matrix: Optional[np.ndarray] = None
        self.case_id_to_idx: Dict[str, int] = {}
        self.feature_names: List[str] = []
        self.case_texts: Dict[str, str] = {}

    def _build_case_document(self, case: CaseModel) -> str:
        if case.derived_features and case.derived_features.semantic_text:
            text = case.derived_features.semantic_text.replace("|", " ")
        else:
            tokens = [
                case.incident.crime_description,
                case.incident.crime_domain,
                case.location.city,
                case.weapon.used or "",
                f"age_{case.victim.age_band or ''}",
                f"gender_{case.victim.gender or ''}",
                " ".join(case.tags),
            ]
            text = " ".join(t for t in tokens if t)
        return normalize_text(text)

    def fit_corpus(self, cases: List[CaseModel]):
        self.case_texts = {c.case_id: self._build_case_document(c) for c in cases}
        case_ids = list(self.case_texts.keys())
        self.case_id_to_idx = {cid: idx for idx, cid in enumerate(case_ids)}

        documents = [self.case_texts[cid] for cid in case_ids]

        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            max_df=0.95,
            min_df=2,
            ngram_range=(1, 2),
            max_features=500
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
        if sim >= 0.30:
            row_a = vec_a.toarray().flatten()
            row_b = vec_b.toarray().flatten()
            prod = row_a * row_b
            top_indices = np.argsort(prod)[::-1][:3]

            salient_terms = [
                self.feature_names[i]
                for i in top_indices
                if prod[i] > 0.01
            ]

            if salient_terms:
                evidence.append(f"Semantic profile alignment on descriptors: '{', '.join(salient_terms)}'")
            else:
                evidence.append(f"Contextual profile concordance ({int(sim * 100)}%)")

        return sim, evidence
