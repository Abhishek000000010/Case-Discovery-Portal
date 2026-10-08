from typing import List
from backend.app.models.case_models import CaseModel


class DataNormalizer:
    """
    Normalizes case records, sanitizes tag tokens, cleans summaries,
    and standardizes date and string formats.
    """

    @staticmethod
    def normalize_case(case: CaseModel) -> CaseModel:
        if case.tags:
            case.tags = sorted(list(set(t.strip().lower() for t in case.tags if t)))
        return case

    @staticmethod
    def normalize_all(cases: List[CaseModel]) -> List[CaseModel]:
        return [DataNormalizer.normalize_case(c) for c in cases]
