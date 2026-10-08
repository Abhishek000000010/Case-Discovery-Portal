from typing import List, Dict, Any, Optional
from collections import Counter
import numpy as np
from backend.app.models.case_models import CaseModel
from backend.app.models.entity_models import EntityListResponse
from backend.app.services.anomaly_service import AnomalyService
from backend.app.services.clustering_service import ClusteringService


class AnalysisService:
    """
    Computes global intelligence metrics, empirical crime distributions,
    temporal trends, victim demographics, and investigative anomaly summaries
    strictly from the real Indian Crime dataset.
    """

    @staticmethod
    def get_summary_stats(
        cases: List[CaseModel],
        entities: EntityListResponse,
        anomalies_count: int = 0,
    ) -> Dict[str, Any]:
        total_cases = len(cases)
        if total_cases == 0:
            return {}

        closed_cases = sum(1 for c in cases if c.investigation.case_closed)
        open_cases = total_cases - closed_cases
        closure_rate = round((closed_cases / total_cases) * 100, 1)

        city_counts = Counter(c.location.city for c in cases)
        crime_counts = Counter(c.incident.crime_description for c in cases)
        domain_counts = Counter(c.incident.crime_domain for c in cases)
        weapon_counts = Counter(c.weapon.used or "None Specified" for c in cases)
        month_counts = Counter(c.derived_features.occurrence_month_name for c in cases if c.derived_features.occurrence_month_name)

        durations = [c.investigation.closure_duration_days for c in cases if c.investigation.closure_duration_days is not None]
        delays = [c.derived_features.report_delay_hours for c in cases if c.derived_features.report_delay_hours is not None]

        most_common_crime = crime_counts.most_common(1)[0] if crime_counts else ("None", 0)
        most_active_city = city_counts.most_common(1)[0] if city_counts else ("None", 0)
        highest_crime_month = month_counts.most_common(1)[0] if month_counts else ("None", 0)

        return {
            "total_cases": total_cases,
            "total_cities": len(entities.cities),
            "total_crime_types": len(entities.crime_descriptions),
            "total_crime_codes": len(entities.crime_codes),
            "total_crime_domains": len(entities.crime_domains),
            "total_weapons": len(entities.weapons),
            "cases_closed": closed_cases,
            "open_cases": open_cases,
            "closure_rate_percent": closure_rate,
            "most_common_crime": {
                "name": most_common_crime[0],
                "count": most_common_crime[1],
            },
            "most_active_city": {
                "name": most_active_city[0],
                "count": most_active_city[1],
            },
            "highest_crime_month": {
                "name": highest_crime_month[0],
                "count": highest_crime_month[1],
            },
            "average_closure_duration_days": round(float(np.mean(durations)), 1) if durations else 0.0,
            "average_report_delay_hours": round(float(np.mean(delays)), 1) if delays else 0.0,
            "potential_anomalies_count": anomalies_count,
            "provenance": {
                "dataset": "Indian Crimes Dataset",
                "source_file": "crime_dataset_india.csv",
                "data_type": "Public Dataset Record",
                "synthetic_records": 0,
                "note": "Cleaned public dataset from Kaggle/NCRB data. Zero synthetic records.",
            },
        }

    @staticmethod
    def get_analytics_breakdown(cases: List[CaseModel]) -> Dict[str, Any]:
        """
        Deep analytical distributions for the visual dashboard:
        - Crime by city
        - Crime by domain
        - Crime by month & year
        - Weapon distribution
        - Time-of-day distribution
        - Victim age & gender distribution
        """
        city_counts = Counter(c.location.city for c in cases)
        crime_counts = Counter(c.incident.crime_description for c in cases)
        domain_counts = Counter(c.incident.crime_domain for c in cases)
        weapon_counts = Counter(c.weapon.used or "Unspecified" for c in cases)

        year_counts = Counter(c.derived_features.occurrence_year for c in cases if c.derived_features.occurrence_year)
        month_order = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ]
        raw_month_counts = Counter(c.derived_features.occurrence_month_name for c in cases if c.derived_features.occurrence_month_name)
        month_distribution = [{"month": m, "count": raw_month_counts.get(m, 0)} for m in month_order]

        # Time of day (hourly 0-23)
        hourly_counts = Counter(c.derived_features.occurrence_hour for c in cases if c.derived_features.occurrence_hour is not None)
        hour_distribution = [{"hour": h, "count": hourly_counts.get(h, 0)} for h in range(24)]

        # Victim demographics
        gender_counts = Counter(c.victim.gender for c in cases if c.victim.gender)
        age_band_counts = Counter(c.victim.age_band for c in cases if c.victim.age_band)

        return {
            "top_cities": [{"city": k, "count": v} for k, v in city_counts.most_common(12)],
            "crime_domains": [{"domain": k, "count": v} for k, v in domain_counts.most_common()],
            "top_crimes": [{"crime": k, "count": v} for k, v in crime_counts.most_common(10)],
            "weapons": [{"weapon": k, "count": v} for k, v in weapon_counts.most_common()],
            "yearly_trend": [{"year": k, "count": v} for k, v in sorted(year_counts.items())],
            "monthly_distribution": month_distribution,
            "hourly_distribution": hour_distribution,
            "victim_genders": [{"gender": k, "count": v} for k, v in gender_counts.most_common()],
            "victim_age_bands": [{"age_band": k, "count": v} for k, v in age_band_counts.most_common()],
        }
