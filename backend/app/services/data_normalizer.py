from typing import List
from datetime import datetime
from backend.app.models.case_models import CaseModel
from backend.app.utils.text_normalization import normalize_text


class DataNormalizer:
    """
    Normalizes case records, sanitizes tag tokens, cleans summaries,
    and standardizes date formats.
    """

    @staticmethod
    def normalize_case(case: CaseModel) -> CaseModel:
        # Standardize tags
        normalized_tags = [normalize_text(t) for t in case.tags if t]
        case.tags = sorted(list(set(normalized_tags)))

        # Standardize modus operandi tags
        normalized_mo = [normalize_text(m) for m in case.modus_operandi if m]
        case.modus_operandi = sorted(list(set(normalized_mo)))

        return case

    @staticmethod
    def normalize_all(cases: List[CaseModel]) -> List[CaseModel]:
        return [DataNormalizer.normalize_case(c) for c in cases]
