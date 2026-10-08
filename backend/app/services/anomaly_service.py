from typing import List, Dict, Any, Optional
from backend.app.models.case_models import CaseModel
from backend.app.models.relationship_models import AnomalyItem


class AnomalyService:
    """
    Detects statistical outliers, prolonged investigation durations, reporting delays,
    and high-resource deployments across real crime incident records.
    
    STRICT SAFETY PROTOCOL:
    Adheres strictly to neutral investigative terminology.
    Never characterizes recurrence or outliers as proof of criminality, guilt, or bias.
    Uses: 'potential anomaly', 'statistical outlier', 'requires administrative review'.
    """

    @classmethod
    def get_all_anomalies(cls, cases: List[CaseModel], limit_per_type: int = 8) -> List[Dict[str, Any]]:
        anomalies: List[Dict[str, Any]] = []

        # 1. Prolonged Investigation Closure Duration (Outliers > 500 days)
        long_closures = [
            c for c in cases
            if c.investigation.closure_duration_days and c.investigation.closure_duration_days >= 500.0
        ]
        long_closures.sort(key=lambda c: c.investigation.closure_duration_days or 0, reverse=True)
        for c in long_closures[:limit_per_type]:
            dur = c.investigation.closure_duration_days
            anomalies.append({
                "anomaly_id": f"ANOM::CLOSURE::{c.case_id}",
                "case_id": c.case_id,
                "anomaly_type": "Prolonged Closure Duration",
                "severity": "HIGH",
                "score": round(min(1.0, dur / 730.0), 2),
                "reason": f"Case resolution required {int(dur)} days (>99th percentile across corpus).",
                "city": c.location.city,
                "crime": c.incident.crime_description,
                "details": {
                    "closure_duration_days": dur,
                    "date_closed": c.investigation.date_case_closed,
                    "date_occurred": c.incident.date_of_occurrence or c.incident.time_of_occurrence,
                },
            })

        # 2. Maximum Police Deployment Surges (>= 18 officers)
        high_police = [
            c for c in cases
            if c.investigation.police_deployed and c.investigation.police_deployed >= 18
        ]
        high_police.sort(key=lambda c: c.investigation.police_deployed or 0, reverse=True)
        for c in high_police[:limit_per_type]:
            deployed = c.investigation.police_deployed
            anomalies.append({
                "anomaly_id": f"ANOM::DEPLOY::{c.case_id}",
                "case_id": c.case_id,
                "anomaly_type": "High Police Deployment Surge",
                "severity": "MEDIUM",
                "score": round(deployed / 19.0, 2),
                "reason": f"Exceptional tactical mobilization: {deployed} officers deployed to incident scene.",
                "city": c.location.city,
                "crime": c.incident.crime_description,
                "details": {
                    "police_deployed": deployed,
                    "weapon": c.weapon.used or "Unspecified",
                },
            })

        # 3. Delayed Case Reporting Delay (>= 60 hours)
        delayed_reports = [
            c for c in cases
            if c.derived_features.report_delay_hours and c.derived_features.report_delay_hours >= 60.0
        ]
        delayed_reports.sort(key=lambda c: c.derived_features.report_delay_hours or 0, reverse=True)
        for c in delayed_reports[:limit_per_type]:
            delay = c.derived_features.report_delay_hours
            anomalies.append({
                "anomaly_id": f"ANOM::DELAY::{c.case_id}",
                "case_id": c.case_id,
                "anomaly_type": "Prolonged Reporting Delay",
                "severity": "MEDIUM",
                "score": round(min(1.0, delay / 72.0), 2),
                "reason": f"Significant lag of {delay:.1f} hours between incident occurrence and official report registration.",
                "city": c.location.city,
                "crime": c.incident.crime_description,
                "details": {
                    "report_delay_hours": delay,
                    "date_occurred": c.incident.date_of_occurrence or c.incident.time_of_occurrence,
                    "date_reported": c.incident.date_reported,
                },
            })

        # 4. High-Resource Unresolved Cases
        open_high_resource = [
            c for c in cases
            if not c.investigation.case_closed and (c.investigation.police_deployed or 0) >= 16
        ]
        open_high_resource.sort(key=lambda c: c.investigation.police_deployed or 0, reverse=True)
        for c in open_high_resource[:limit_per_type]:
            deployed = c.investigation.police_deployed
            anomalies.append({
                "anomaly_id": f"ANOM::OPEN_RESOURCE::{c.case_id}",
                "case_id": c.case_id,
                "anomaly_type": "Unresolved High-Resource Case",
                "severity": "HIGH",
                "score": 0.88,
                "reason": f"Active open status despite substantial mobilization ({deployed} officers deployed).",
                "city": c.location.city,
                "crime": c.incident.crime_description,
                "details": {
                    "police_deployed": deployed,
                    "status": "Open",
                    "year": c.derived_features.occurrence_year,
                },
            })

        return anomalies
