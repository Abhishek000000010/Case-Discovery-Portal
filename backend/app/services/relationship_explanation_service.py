import math
from typing import List, Dict, Any, Optional, Tuple
from backend.app.models.case_models import CaseModel
from backend.app.models.relationship_models import (
    RelationshipFeatures,
    RelationshipSignal,
    CaseComparisonRow,
    RelationshipExplanationDetail,
    RelationshipExplanationResponse,
)


class RelationshipExplanationService:
    """
    Dedicated Explainable Relationship Investigation Layer for real Indian crime cases.
    Transforms raw empirical comparison features into fully explainable, auditable,
    and defensible forensic evidence dossiers with clear supporting and weakening signals.
    """

    DEFAULT_WEIGHTS = {
        "crime_code": 0.25,
        "weapon": 0.18,
        "city": 0.20,
        "temporal_proximity": 0.15,
        "time_of_day_proximity": 0.10,
        "victim_profile": 0.10,
        "crime_domain": 0.08,
        "semantic_similarity": 0.12,
    }

    @staticmethod
    def classify_confidence(confidence: float) -> str:
        """
        Calibrated relationship classification according to project requirements:
        0.85 - 1.00 -> VERY HIGH
        0.70 - 0.84 -> HIGH
        0.50 - 0.69 -> MODERATE
        0.30 - 0.49 -> WEAK
        below 0.30 -> NOT SURFACED
        """
        if confidence >= 0.85:
            return "VERY HIGH"
        elif confidence >= 0.70:
            return "HIGH"
        elif confidence >= 0.50:
            return "MODERATE"
        elif confidence >= 0.30:
            return "WEAK"
        return "NOT SURFACED"

    @classmethod
    def get_relationship_labels(
        cls,
        features: RelationshipFeatures,
        confidence: float,
        case_a: CaseModel,
        case_b: CaseModel,
    ) -> Tuple[str, str]:
        """
        Determines dynamic Relationship Type Label and concise Graph Edge Label
        based on the dominant empirical signals.
        """
        pct = int(round(confidence * 100))

        # 1. Determine Relationship Type Label from dominant signals
        if features.same_city and features.crime_code_match:
            rel_type = "SHARED LOCATION + CRIME"
        elif features.same_city and (features.temporal_similarity >= 0.75):
            rel_type = "LOCAL TEMPORAL CLUSTER"
        elif features.crime_code_match and features.weapon_match:
            rel_type = "SHARED CRIME CHARACTERISTICS"
        elif features.temporal_similarity >= 0.80 and features.time_of_day_similarity >= 0.70:
            rel_type = "TEMPORAL RELATIONSHIP"
        elif features.weapon_match and (features.victim_profile_similarity >= 0.50):
            rel_type = "BEHAVIOURAL SIMILARITY"
        elif features.crime_domain_match and features.same_city:
            rel_type = "REGIONAL DOMAIN CONCORDANCE"
        else:
            rel_type = "SIMILAR INCIDENT PROFILE"

        # 2. Determine concise Graph Edge Label
        dominant_reasons: List[str] = []
        if features.crime_code_match:
            dominant_reasons.append("Crime")
        elif features.crime_domain_match:
            dominant_reasons.append("Domain")

        if features.same_city:
            dominant_reasons.append("City")

        if features.weapon_match:
            dominant_reasons.append("Weapon")

        if features.temporal_similarity >= 0.75:
            dominant_reasons.append("Time")
        elif features.time_of_day_similarity >= 0.75:
            dominant_reasons.append("Hour")

        if len(dominant_reasons) == 0 and features.victim_profile_similarity >= 0.5:
            dominant_reasons.append("Victim")

        if dominant_reasons:
            reasons_str = " + ".join(dominant_reasons[:3])
            edge_label = f"{pct}% • {reasons_str}"
        else:
            edge_label = f"{pct}% • Incident Concordance"

        return rel_type, edge_label

    @classmethod
    def generate_explanation_bullets(
        cls,
        features: RelationshipFeatures,
        case_a: CaseModel,
        case_b: CaseModel,
    ) -> List[str]:
        """
        Backward-compatible helper returning factual bullet evidence statements.
        """
        evidence: List[str] = []

        if features.same_city:
            evidence.append(f"Both cases occurred in {case_a.location.city}")

        if features.crime_code_match:
            evidence.append(
                f"Same statutory crime code: Code {case_a.incident.crime_code} ({case_a.incident.crime_description})"
            )
        elif features.crime_description_match:
            evidence.append(f"Matching crime description: {case_a.incident.crime_description}")
        elif features.crime_domain_match:
            evidence.append(f"Same crime domain: {case_a.incident.crime_domain}")

        if features.weapon_match and case_a.weapon.used:
            evidence.append(f"Same weapon category deployed: {case_a.weapon.used}")

        if features.incident_date_difference_days is not None:
            days = features.incident_date_difference_days
            if days == 0:
                evidence.append("Occurred on the exact same date")
            elif days <= 7:
                evidence.append(f"Occurred within {days} days of each other")
            elif days <= 30:
                evidence.append(f"Occurred {days} days apart within 1 month")

        if features.hour_difference is not None and features.hour_difference <= 2:
            evidence.append(f"Similar time of day: {features.hour_difference} hr difference")

        if features.victim_gender_match and case_a.victim.gender:
            evidence.append(f"Matching victim gender: {case_a.victim.gender}")

        return evidence

    @classmethod
    def explain_relationship(
        cls,
        case_a: CaseModel,
        case_b: CaseModel,
        features: RelationshipFeatures,
        confidence: float,
        weights: Optional[Dict[str, float]] = None,
        path: Optional[List[str]] = None,
    ) -> RelationshipExplanationResponse:
        """
        Constructs a complete, auditable RelationshipExplanationResponse
        strictly using actual Indian Crime Dataset attributes.
        """
        w = weights or cls.DEFAULT_WEIGHTS
        classification = cls.classify_confidence(confidence)
        rel_type, edge_label = cls.get_relationship_labels(features, confidence, case_a, case_b)

        supporting_signals: List[RelationshipSignal] = []
        weakening_signals: List[RelationshipSignal] = []
        neutral_signals: List[RelationshipSignal] = []

        # -------------------------------------------------------------------------
        # Signal 1: Crime Code / Classification
        # -------------------------------------------------------------------------
        w_crime = w.get("crime_code_match", w.get("crime_code", 0.25))
        code_a = case_a.incident.crime_code
        code_b = case_b.incident.crime_code
        if features.crime_code_match:
            raw_sim = 1.0
            contrib = round(raw_sim * w_crime, 4)
            supporting_signals.append(
                RelationshipSignal(
                    signal_name="crime_code",
                    label="Crime Code",
                    case_a_value=f"Code {code_a} ({case_a.incident.crime_description})",
                    case_b_value=f"Code {code_b} ({case_b.incident.crime_description})",
                    raw_similarity=raw_sim,
                    weight=w_crime,
                    weighted_contribution=contrib,
                    result="supporting",
                    explanation=f"Both cases share the exact same statutory crime code ({code_a}) and description.",
                )
            )
        elif features.crime_description_match:
            raw_sim = 0.75
            contrib = round(raw_sim * w_crime, 4)
            supporting_signals.append(
                RelationshipSignal(
                    signal_name="crime_code",
                    label="Crime Classification",
                    case_a_value=f"Code {code_a} ({case_a.incident.crime_description})",
                    case_b_value=f"Code {code_b} ({case_b.incident.crime_description})",
                    raw_similarity=raw_sim,
                    weight=w_crime,
                    weighted_contribution=contrib,
                    result="supporting",
                    explanation=f"Both cases have matching incident descriptions ({case_a.incident.crime_description}) despite different internal codes.",
                )
            )
        else:
            raw_sim = 0.0
            weakening_signals.append(
                RelationshipSignal(
                    signal_name="crime_code",
                    label="Crime Code",
                    case_a_value=f"Code {code_a} ({case_a.incident.crime_description})",
                    case_b_value=f"Code {code_b} ({case_b.incident.crime_description})",
                    raw_similarity=raw_sim,
                    weight=w_crime,
                    weighted_contribution=0.0,
                    result="weakening",
                    explanation=f"Different statutory crime classifications (Code {code_a} vs Code {code_b}).",
                )
            )

        # -------------------------------------------------------------------------
        # Signal 2: Weapon Category
        # -------------------------------------------------------------------------
        w_weapon = w.get("weapon_match", w.get("weapon", 0.18))
        weap_a = case_a.weapon.used or "None specified"
        weap_b = case_b.weapon.used or "None specified"

        if features.weapon_match and case_a.weapon.used:
            raw_sim = 1.0
            contrib = round(raw_sim * w_weapon, 4)
            supporting_signals.append(
                RelationshipSignal(
                    signal_name="weapon",
                    label="Weapon Deployment",
                    case_a_value=weap_a,
                    case_b_value=weap_b,
                    raw_similarity=raw_sim,
                    weight=w_weapon,
                    weighted_contribution=contrib,
                    result="supporting",
                    explanation=f"Both cases involved the deployment of {weap_a}.",
                )
            )
        elif not case_a.weapon.used and not case_b.weapon.used:
            raw_sim = 0.5
            neutral_signals.append(
                RelationshipSignal(
                    signal_name="weapon",
                    label="Weapon Deployment",
                    case_a_value="None specified",
                    case_b_value="None specified",
                    raw_similarity=raw_sim,
                    weight=w_weapon,
                    weighted_contribution=round(raw_sim * w_weapon, 4),
                    result="neutral",
                    explanation="Neither case had a weapon identified in the incident record.",
                )
            )
        else:
            raw_sim = 0.0
            weakening_signals.append(
                RelationshipSignal(
                    signal_name="weapon",
                    label="Weapon Deployment",
                    case_a_value=weap_a,
                    case_b_value=weap_b,
                    raw_similarity=raw_sim,
                    weight=w_weapon,
                    weighted_contribution=0.0,
                    result="weakening",
                    explanation=f"Weapon category does not match ({weap_a} vs {weap_b}).",
                )
            )

        # -------------------------------------------------------------------------
        # Signal 3: Municipal Jurisdiction / City
        # -------------------------------------------------------------------------
        w_city = w.get("same_city", w.get("city", 0.20))
        city_a = case_a.location.city
        city_b = case_b.location.city

        if features.same_city:
            raw_sim = 1.0
            contrib = round(raw_sim * w_city, 4)
            supporting_signals.append(
                RelationshipSignal(
                    signal_name="city",
                    label="Municipal Jurisdiction",
                    case_a_value=city_a,
                    case_b_value=city_b,
                    raw_similarity=raw_sim,
                    weight=w_city,
                    weighted_contribution=contrib,
                    result="supporting",
                    explanation=f"Both cases occurred in {city_a}.",
                )
            )
        else:
            raw_sim = 0.0
            weakening_signals.append(
                RelationshipSignal(
                    signal_name="city",
                    label="Municipal Jurisdiction",
                    case_a_value=city_a,
                    case_b_value=city_b,
                    raw_similarity=raw_sim,
                    weight=w_city,
                    weighted_contribution=0.0,
                    result="weakening",
                    explanation=f"Different municipal jurisdictions ({city_a} vs {city_b}).",
                )
            )

        # -------------------------------------------------------------------------
        # Signal 4: Temporal Proximity (Incident Dates)
        # -------------------------------------------------------------------------
        w_temp = w.get("temporal_proximity", 0.15)
        date_a = case_a.incident.date_of_occurrence or "Unknown"
        date_b = case_b.incident.date_of_occurrence or "Unknown"
        days_diff = features.incident_date_difference_days

        if days_diff is not None:
            raw_sim = features.temporal_similarity
            contrib = round(raw_sim * w_temp, 4)
            if days_diff == 0:
                supporting_signals.append(
                    RelationshipSignal(
                        signal_name="occurrence_date",
                        label="Occurrence Date",
                        case_a_value=date_a,
                        case_b_value=date_b,
                        raw_similarity=1.0,
                        weight=w_temp,
                        weighted_contribution=contrib,
                        result="supporting",
                        explanation="Both incidents occurred on the exact same calendar date.",
                    )
                )
            elif days_diff <= 7:
                supporting_signals.append(
                    RelationshipSignal(
                        signal_name="occurrence_date",
                        label="Temporal Proximity",
                        case_a_value=date_a,
                        case_b_value=date_b,
                        raw_similarity=raw_sim,
                        weight=w_temp,
                        weighted_contribution=contrib,
                        result="supporting",
                        explanation=f"High temporal proximity: incidents occurred {days_diff} days apart (within 1 week).",
                    )
                )
            elif days_diff <= 30:
                supporting_signals.append(
                    RelationshipSignal(
                        signal_name="occurrence_date",
                        label="Temporal Proximity",
                        case_a_value=date_a,
                        case_b_value=date_b,
                        raw_similarity=raw_sim,
                        weight=w_temp,
                        weighted_contribution=contrib,
                        result="supporting",
                        explanation=f"Moderate temporal proximity: incidents occurred {days_diff} days apart (within 1 month).",
                    )
                )
            elif days_diff <= 90:
                neutral_signals.append(
                    RelationshipSignal(
                        signal_name="occurrence_date",
                        label="Temporal Separation",
                        case_a_value=date_a,
                        case_b_value=date_b,
                        raw_similarity=raw_sim,
                        weight=w_temp,
                        weighted_contribution=contrib,
                        result="neutral",
                        explanation=f"Incidents occurred {days_diff} days apart (within 90-day investigative horizon).",
                    )
                )
            else:
                weakening_signals.append(
                    RelationshipSignal(
                        signal_name="occurrence_date",
                        label="Temporal Separation",
                        case_a_value=date_a,
                        case_b_value=date_b,
                        raw_similarity=0.0,
                        weight=w_temp,
                        weighted_contribution=0.0,
                        result="weakening",
                        explanation=f"Significant time difference: occurrences are {days_diff} days apart ({date_a} vs {date_b}).",
                    )
                )

        # -------------------------------------------------------------------------
        # Signal 5: Time of Day Proximity
        # -------------------------------------------------------------------------
        w_tod = w.get("time_of_day_proximity", 0.10)
        time_a = case_a.incident.time_of_occurrence or "Unknown"
        time_b = case_b.incident.time_of_occurrence or "Unknown"
        hr_diff = features.hour_difference

        if hr_diff is not None:
            raw_sim = features.time_of_day_similarity
            contrib = round(raw_sim * w_tod, 4)
            if hr_diff == 0:
                supporting_signals.append(
                    RelationshipSignal(
                        signal_name="occurrence_time",
                        label="Occurrence Time",
                        case_a_value=time_a,
                        case_b_value=time_b,
                        raw_similarity=1.0,
                        weight=w_tod,
                        weighted_contribution=contrib,
                        result="supporting",
                        explanation=f"Incidents occurred during the same hour window ({time_a} vs {time_b}).",
                    )
                )
            elif hr_diff <= 2:
                supporting_signals.append(
                    RelationshipSignal(
                        signal_name="occurrence_time",
                        label="Time of Day",
                        case_a_value=time_a,
                        case_b_value=time_b,
                        raw_similarity=raw_sim,
                        weight=w_tod,
                        weighted_contribution=contrib,
                        result="supporting",
                        explanation=f"Close time of day: occurrences differ by approximately {hr_diff} hours.",
                    )
                )
            elif hr_diff <= 6:
                neutral_signals.append(
                    RelationshipSignal(
                        signal_name="occurrence_time",
                        label="Time of Day",
                        case_a_value=time_a,
                        case_b_value=time_b,
                        raw_similarity=raw_sim,
                        weight=w_tod,
                        weighted_contribution=contrib,
                        result="neutral",
                        explanation=f"Occurred {hr_diff} hours apart in daily schedule.",
                    )
                )
            else:
                weakening_signals.append(
                    RelationshipSignal(
                        signal_name="occurrence_time",
                        label="Time of Day",
                        case_a_value=time_a,
                        case_b_value=time_b,
                        raw_similarity=0.0,
                        weight=w_tod,
                        weighted_contribution=0.0,
                        result="weakening",
                        explanation=f"Substantially different time of day ({time_a} vs {time_b}, {hr_diff} hours apart).",
                    )
                )

        # -------------------------------------------------------------------------
        # Signal 6: Broad Crime Domain
        # -------------------------------------------------------------------------
        w_dom = w.get("crime_domain_match", w.get("crime_domain", 0.08))
        dom_a = case_a.incident.crime_domain
        dom_b = case_b.incident.crime_domain
        if features.crime_domain_match:
            raw_sim = 1.0
            contrib = round(raw_sim * w_dom, 4)
            supporting_signals.append(
                RelationshipSignal(
                    signal_name="crime_domain",
                    label="Crime Domain",
                    case_a_value=dom_a,
                    case_b_value=dom_b,
                    raw_similarity=raw_sim,
                    weight=w_dom,
                    weighted_contribution=contrib,
                    result="supporting",
                    explanation=f"Both incidents belong to the broad crime domain: '{dom_a}'.",
                )
            )
        else:
            weakening_signals.append(
                RelationshipSignal(
                    signal_name="crime_domain",
                    label="Crime Domain",
                    case_a_value=dom_a,
                    case_b_value=dom_b,
                    raw_similarity=0.0,
                    weight=w_dom,
                    weighted_contribution=0.0,
                    result="weakening",
                    explanation=f"Broad crime domain mismatch ('{dom_a}' vs '{dom_b}').",
                )
            )

        # -------------------------------------------------------------------------
        # Signal 7: Victim Profile (Gender & Age Band)
        # -------------------------------------------------------------------------
        w_vic = w.get("victim_profile_similarity", w.get("victim_profile", 0.10))
        gen_a = case_a.victim.gender or "Unspecified"
        gen_b = case_b.victim.gender or "Unspecified"
        age_a = f"{case_a.victim.age} ({case_a.victim.age_band or 'N/A'})" if case_a.victim.age is not None else "Unspecified"
        age_b = f"{case_b.victim.age} ({case_b.victim.age_band or 'N/A'})" if case_b.victim.age is not None else "Unspecified"

        vic_val_a = f"{gen_a}, Age {age_a}"
        vic_val_b = f"{gen_b}, Age {age_b}"

        if features.victim_gender_match and features.victim_age_band_match:
            raw_sim = 1.0
            contrib = round(raw_sim * w_vic, 4)
            supporting_signals.append(
                RelationshipSignal(
                    signal_name="victim_profile",
                    label="Victim Demographics",
                    case_a_value=vic_val_a,
                    case_b_value=vic_val_b,
                    raw_similarity=raw_sim,
                    weight=w_vic,
                    weighted_contribution=contrib,
                    result="supporting",
                    explanation=f"Identical victim profile category ({gen_a}, age band {case_a.victim.age_band}).",
                )
            )
        elif features.victim_gender_match:
            raw_sim = 0.5
            neutral_signals.append(
                RelationshipSignal(
                    signal_name="victim_profile",
                    label="Victim Demographics",
                    case_a_value=vic_val_a,
                    case_b_value=vic_val_b,
                    raw_similarity=raw_sim,
                    weight=w_vic,
                    weighted_contribution=round(raw_sim * w_vic, 4),
                    result="neutral",
                    explanation=f"Matching victim gender ({gen_a}) with differing age brackets.",
                )
            )
        elif features.victim_age_band_match:
            raw_sim = 0.5
            neutral_signals.append(
                RelationshipSignal(
                    signal_name="victim_profile",
                    label="Victim Demographics",
                    case_a_value=vic_val_a,
                    case_b_value=vic_val_b,
                    raw_similarity=raw_sim,
                    weight=w_vic,
                    weighted_contribution=round(raw_sim * w_vic, 4),
                    result="neutral",
                    explanation=f"Matching victim age bracket ({case_a.victim.age_band}) with differing genders.",
                )
            )
        else:
            weakening_signals.append(
                RelationshipSignal(
                    signal_name="victim_profile",
                    label="Victim Demographics",
                    case_a_value=vic_val_a,
                    case_b_value=vic_val_b,
                    raw_similarity=0.0,
                    weight=w_vic,
                    weighted_contribution=0.0,
                    result="weakening",
                    explanation=f"Different victim demographic profile ({vic_val_a} vs {vic_val_b}).",
                )
            )

        # -------------------------------------------------------------------------
        # Signal 8: Semantic Modus Operandi
        # -------------------------------------------------------------------------
        w_sem = w.get("semantic_similarity", 0.12)
        raw_sem = features.semantic_similarity
        if raw_sem >= 0.70:
            supporting_signals.append(
                RelationshipSignal(
                    signal_name="semantic_text",
                    label="Semantic Modus Operandi",
                    case_a_value=case_a.incident.crime_description,
                    case_b_value=case_b.incident.crime_description,
                    raw_similarity=round(raw_sem, 3),
                    weight=w_sem,
                    weighted_contribution=round(raw_sem * w_sem, 4),
                    result="supporting",
                    explanation="High semantic similarity in incident narrative and modus operandi context.",
                )
            )
        elif raw_sem >= 0.40:
            neutral_signals.append(
                RelationshipSignal(
                    signal_name="semantic_text",
                    label="Semantic Similarity",
                    case_a_value=case_a.incident.crime_description,
                    case_b_value=case_b.incident.crime_description,
                    raw_similarity=round(raw_sem, 3),
                    weight=w_sem,
                    weighted_contribution=round(raw_sem * w_sem, 4),
                    result="neutral",
                    explanation="Moderate baseline semantic similarity across incident descriptions.",
                )
            )

        # -------------------------------------------------------------------------
        # Build Score Breakdown
        # -------------------------------------------------------------------------
        all_signals = supporting_signals + neutral_signals + weakening_signals
        score_breakdown: Dict[str, Any] = {}
        for sig in all_signals:
            score_breakdown[sig.signal_name] = {
                "label": sig.label,
                "weight": sig.weight,
                "raw_similarity": sig.raw_similarity,
                "weighted_contribution": sig.weighted_contribution,
                "result": sig.result,
                "percentage_share": round((sig.weighted_contribution / max(confidence, 0.01)) * 100, 1) if confidence > 0 else 0.0,
            }

        # -------------------------------------------------------------------------
        # Build Factual Comparison Data
        # -------------------------------------------------------------------------
        comparison: Dict[str, CaseComparisonRow] = {
            "crime_description": CaseComparisonRow(
                field_name="crime_description",
                label="Crime Description",
                case_a_value=case_a.incident.crime_description,
                case_b_value=case_b.incident.crime_description,
                match_status="match" if features.crime_description_match else "different",
            ),
            "crime_code": CaseComparisonRow(
                field_name="crime_code",
                label="Statutory Crime Code",
                case_a_value=code_a,
                case_b_value=code_b,
                match_status="match" if features.crime_code_match else "different",
            ),
            "city": CaseComparisonRow(
                field_name="city",
                label="Municipal Jurisdiction",
                case_a_value=city_a,
                case_b_value=city_b,
                match_status="match" if features.same_city else "different",
            ),
            "weapon": CaseComparisonRow(
                field_name="weapon",
                label="Weapon Category",
                case_a_value=weap_a,
                case_b_value=weap_b,
                match_status="match" if features.weapon_match and case_a.weapon.used else ("n/a" if not case_a.weapon.used and not case_b.weapon.used else "different"),
            ),
            "occurrence_date": CaseComparisonRow(
                field_name="occurrence_date",
                label="Occurrence Date",
                case_a_value=date_a,
                case_b_value=date_b,
                match_status="match" if days_diff == 0 else ("close" if days_diff is not None and days_diff <= 14 else "different"),
                note=f"{days_diff} days difference" if days_diff is not None else None,
            ),
            "occurrence_time": CaseComparisonRow(
                field_name="occurrence_time",
                label="Occurrence Time",
                case_a_value=time_a,
                case_b_value=time_b,
                match_status="match" if hr_diff == 0 else ("close" if hr_diff is not None and hr_diff <= 2 else "different"),
                note=f"{hr_diff} hours difference" if hr_diff is not None else None,
            ),
            "crime_domain": CaseComparisonRow(
                field_name="crime_domain",
                label="Crime Domain",
                case_a_value=dom_a,
                case_b_value=dom_b,
                match_status="match" if features.crime_domain_match else "different",
            ),
            "victim_gender": CaseComparisonRow(
                field_name="victim_gender",
                label="Victim Gender",
                case_a_value=gen_a,
                case_b_value=gen_b,
                match_status="match" if features.victim_gender_match else "different",
            ),
            "victim_age": CaseComparisonRow(
                field_name="victim_age",
                label="Victim Age Band",
                case_a_value=age_a,
                case_b_value=age_b,
                match_status="match" if features.victim_age_band_match else "different",
                note=f"Age difference: {features.victim_age_difference} yrs" if features.victim_age_difference is not None else None,
            ),
            "case_closed": CaseComparisonRow(
                field_name="case_closed",
                label="Investigation Status",
                case_a_value="Closed" if case_a.investigation.case_closed else "Open",
                case_b_value="Closed" if case_b.investigation.case_closed else "Open",
                match_status="match" if case_a.investigation.case_closed == case_b.investigation.case_closed else "different",
            ),
        }

        # -------------------------------------------------------------------------
        # Construct Human-Readable Summary
        # -------------------------------------------------------------------------
        support_names = [s.label.lower() for s in supporting_signals]
        if support_names:
            if len(support_names) == 1:
                support_str = support_names[0]
            elif len(support_names) == 2:
                support_str = f"{support_names[0]} and {support_names[1]}"
            else:
                support_str = f"{', '.join(support_names[:-1])}, and {support_names[-1]}"

            summary = (
                f"These cases have a {classification.lower()} similarity ({int(round(confidence * 100))}%) because "
                f"they share {support_str}."
            )
            if days_diff is not None and days_diff <= 14:
                summary += f" Their occurrence dates are also close ({days_diff} days apart)."
        else:
            summary = (
                f"These cases exhibit an indicative exploratory correlation ({int(round(confidence * 100))}%) "
                f"derived from contextual profile similarities."
            )

        if weakening_signals:
            weak_names = [w.label.lower() for w in weakening_signals[:2]]
            summary += f" Key distinguishing factors include different {', and '.join(weak_names)}."

        # -------------------------------------------------------------------------
        # Build Connection Path (Direct or Indirect)
        # -------------------------------------------------------------------------
        connection_path = path or []
        if not connection_path:
            # Generate default 2-hop or 3-hop path through shared dimensions
            if features.same_city and features.weapon_match and case_a.weapon.used:
                connection_path = [
                    case_a.case_id,
                    f"CITY::{city_a.lower()}",
                    f"WEAPON::{case_a.weapon.used.lower()}",
                    case_b.case_id,
                ]
            elif features.same_city:
                connection_path = [
                    case_a.case_id,
                    f"CITY::{city_a.lower()}",
                    case_b.case_id,
                ]
            elif features.crime_code_match:
                connection_path = [
                    case_a.case_id,
                    f"CRIME::{code_a}",
                    case_b.case_id,
                ]
            elif features.weapon_match and case_a.weapon.used:
                connection_path = [
                    case_a.case_id,
                    f"WEAPON::{case_a.weapon.used.lower()}",
                    case_b.case_id,
                ]
            else:
                connection_path = [
                    case_a.case_id,
                    f"DOMAIN::{dom_a.lower()}",
                    case_b.case_id,
                ]

        return RelationshipExplanationResponse(
            source_case_id=case_a.case_id,
            target_case_id=case_b.case_id,
            source_case=case_a.model_dump(),
            target_case=case_b.model_dump(),
            relationship=RelationshipExplanationDetail(
                type=rel_type,
                confidence=confidence,
                classification=classification,
            ),
            summary=summary,
            supporting_signals=supporting_signals,
            weakening_signals=weakening_signals,
            neutral_signals=neutral_signals,
            score_breakdown=score_breakdown,
            comparison=comparison,
            path=connection_path,
            edge_label=edge_label,
        )
