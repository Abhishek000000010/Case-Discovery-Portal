import re
from typing import Optional, Tuple, List, Dict, Any
from rapidfuzz import fuzz


def normalize_text(text: Optional[str]) -> str:
    if not text:
        return ""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def clean_identifier(val: Optional[str]) -> str:
    if not val:
        return ""
    return re.sub(r"[\s\-_.]", "", val).upper()


def normalize_vehicle_registration(val: Optional[str]) -> str:
    """
    Standardizes vehicle registration plate numbers:
    'MH-04-AB-2187', 'MH04AB2187', 'mh-04-ab-2187' -> 'MH04AB2187'
    """
    if not val:
        return ""
    return re.sub(r"[\s\-_.:/]", "", val).upper()


def parse_name_components(name: str) -> Dict[str, Any]:
    norm = normalize_text(name)
    parts = norm.split()
    if not parts:
        return {"full": "", "first": "", "last": "", "first_initial": "", "last_initial": "", "parts": []}
    
    first = parts[0]
    last = parts[-1] if len(parts) > 1 else ""
    return {
        "full": norm,
        "first": first,
        "last": last,
        "first_initial": first[0] if first else "",
        "last_initial": last[0] if last else "",
        "parts": parts,
    }


def compare_person_names(name1: str, name2: str) -> Tuple[float, List[str]]:
    """
    Compares two person name representations, detecting:
    - Exact full name match ('Rohan Mehta' == 'Rohan Mehta') -> 1.0
    - Initial + Last Name match ('R. Mehta' vs 'Rohan Mehta') -> 0.88
    - First Name + Initial match ('Rohan M.' vs 'Rohan Mehta') -> 0.88
    - Token sort / phonetic fuzzy similarity
    """
    p1 = parse_name_components(name1)
    p2 = parse_name_components(name2)

    if not p1["full"] or not p2["full"]:
        return 0.0, []

    if p1["full"] == p2["full"]:
        return 1.0, [f"Exact full name match: '{name1}'"]

    evidence = []

    # Check: "R. Mehta" vs "Rohan Mehta"
    if p1["last"] and p2["last"] and p1["last"] == p2["last"]:
        # Both share the same surname
        if len(p1["first"]) == 1 or len(p2["first"]) == 1:
            if p1["first_initial"] == p2["first_initial"]:
                evidence.append(f"Matching surname with compatible first-name initial: '{name1}' ~ '{name2}'")
                return 0.90, evidence

    # Check: "Rohan M." vs "Rohan Mehta"
    if p1["first"] and p2["first"] and p1["first"] == p2["first"]:
        # Both share the same first name
        if len(p1["last"]) == 1 or len(p2["last"]) == 1:
            if p1["last_initial"] == p2["last_initial"]:
                evidence.append(f"Matching first name with compatible surname initial: '{name1}' ~ '{name2}'")
                return 0.90, evidence

    # Fuzzy token ratio
    fuzz_ratio = fuzz.token_sort_ratio(p1["full"], p2["full"]) / 100.0
    if fuzz_ratio >= 0.85:
        evidence.append(f"High token similarity between name representations: '{name1}' ~ '{name2}' ({fuzz_ratio:.2f})")
        return float(fuzz_ratio), evidence

    return float(fuzz_ratio), []


def fuzzy_string_similarity(s1: str, s2: str) -> float:
    n1 = normalize_text(s1)
    n2 = normalize_text(s2)
    if not n1 or not n2:
        return 0.0
    if n1 == n2:
        return 1.0
    ratio = fuzz.token_sort_ratio(n1, n2) / 100.0
    return float(ratio)
