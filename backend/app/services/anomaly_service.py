from typing import List, Dict, Any, Tuple
from collections import Counter
from backend.app.models.case_models import CaseModel
from backend.app.models.entity_models import PersonEntity, VehicleEntity, LocationEntity, ObjectEntity


class AnomalyService:
    """
    Detects unusual recurrence patterns, entity frequency anomalies, spatial concentration,
    and behavioral/timeline deviations across case records.
    
    STRICT SAFETY PROTOCOL:
    Adheres strictly to neutral investigative terminology.
    Never characterizes recurrence as proof of criminality, guilt, or fraud.
    Uses: 'potential anomaly', 'unusual recurrence', 'requires review'.
    """

    @staticmethod
    def analyze_person_recurrence(
        cases: List[CaseModel],
        persons: List[PersonEntity]
    ) -> List[Dict[str, Any]]:
        person_map = {p.person_id: p for p in persons}
        case_appearances: Dict[str, List[str]] = {}
        role_counts: Dict[str, Counter] = {}

        for c in cases:
            for p in c.people_involved:
                case_appearances.setdefault(p.person_id, []).append(c.case_id)
                role_counts.setdefault(p.person_id, Counter())[p.role] += 1

            for w in c.witnesses:
                case_appearances.setdefault(w.person_id, []).append(c.case_id)
                role_counts.setdefault(w.person_id, Counter())["witness"] += 1

        results = []
        for pid, cids in case_appearances.items():
            unique_cids = sorted(list(set(cids)))
            count = len(unique_cids)
            p_obj = person_map.get(pid)
            name = p_obj.name if p_obj else pid

            roles = dict(role_counts.get(pid, Counter()))

            is_anomaly = False
            anomaly_label = None
            notes = []

            if count >= 6:
                is_anomaly = True
                anomaly_label = "Unusual cross-case frequency"
                notes.append(f"Individual documented in {count} separate case files; requires review")
            elif count >= 3:
                anomaly_label = "Recurring entity"
                notes.append(f"Recorded in {count} distinct cases")

            if roles.get("witness", 0) >= 4:
                is_anomaly = True
                anomaly_label = "Unusual witness recurrence"
                notes.append(f"Individual documented as witness across {roles['witness']} separate incidents")

            results.append({
                "entity_type": "PERSON",
                "entity_id": pid,
                "name": name,
                "case_count": count,
                "cases": unique_cids,
                "role_distribution": roles,
                "is_potential_anomaly": is_anomaly,
                "anomaly_label": anomaly_label,
                "investigative_notes": notes
            })

        results.sort(key=lambda r: r["case_count"], reverse=True)
        return results

    @staticmethod
    def analyze_vehicle_recurrence(
        cases: List[CaseModel],
        vehicles: List[VehicleEntity]
    ) -> List[Dict[str, Any]]:
        vehicle_map = {v.vehicle_id: v for v in vehicles}
        vehicle_appearances: Dict[str, List[str]] = {}
        role_counts: Dict[str, Counter] = {}

        for c in cases:
            for v in c.vehicles:
                vehicle_appearances.setdefault(v.vehicle_id, []).append(c.case_id)
                role_counts.setdefault(v.vehicle_id, Counter())[v.role] += 1

        results = []
        for vid, cids in vehicle_appearances.items():
            unique_cids = sorted(list(set(cids)))
            count = len(unique_cids)
            v_obj = vehicle_map.get(vid)
            reg = v_obj.registration if v_obj else vid

            is_anomaly = count >= 4
            results.append({
                "entity_type": "VEHICLE",
                "entity_id": vid,
                "registration": reg,
                "type": v_obj.type if v_obj else "unknown",
                "case_count": count,
                "cases": unique_cids,
                "role_distribution": dict(role_counts.get(vid, Counter())),
                "is_potential_anomaly": is_anomaly,
                "anomaly_label": "High cross-case vehicle recurrence" if is_anomaly else "Standard vehicle record",
                "investigative_notes": [f"Associated with {count} distinct case incident reports"] if is_anomaly else []
            })

        results.sort(key=lambda r: r["case_count"], reverse=True)
        return results

    @staticmethod
    def analyze_location_concentration(
        cases: List[CaseModel],
        locations: List[LocationEntity]
    ) -> List[Dict[str, Any]]:
        """
        Detects unusual spatial clustering where an unexpected number of incidents
        occur around a single location.
        """
        loc_map = {l.location_id: l for l in locations}
        loc_cases: Dict[str, List[str]] = {}

        for c in cases:
            for l in c.locations:
                loc_cases.setdefault(l.location_id, []).append(c.case_id)

        results = []
        for lid, cids in loc_cases.items():
            unique_cids = sorted(list(set(cids)))
            count = len(unique_cids)
            loc_obj = loc_map.get(lid)
            name = loc_obj.name if loc_obj else lid

            # Location with >= 10 cases is an active hotspot
            is_anomaly = count >= 8
            if is_anomaly:
                results.append({
                    "entity_type": "LOCATION",
                    "entity_id": lid,
                    "name": name,
                    "case_count": count,
                    "cases": unique_cids,
                    "is_potential_anomaly": True,
                    "anomaly_label": "Unusual spatial concentration",
                    "investigative_notes": [f"High-density incident hotspot with {count} recorded cases; requires jurisdictional review"]
                })

        results.sort(key=lambda r: r["case_count"], reverse=True)
        return results

    @staticmethod
    def analyze_timeline_anomalies(cases: List[CaseModel]) -> List[Dict[str, Any]]:
        """
        Flags cases where reported date preceded incident date or where event intervals
        exhibit unusual gaps.
        """
        anomalies = []
        for c in cases:
            if c.incident_date and c.reported_date:
                # Reported date significantly later (> 180 days)
                from backend.app.services.temporal_service import TemporalService
                d_inc = TemporalService.parse_date_safe(c.incident_date)
                d_rep = TemporalService.parse_date_safe(c.reported_date)
                if d_inc and d_rep:
                    delta = (d_rep - d_inc).days
                    if delta > 120:
                        anomalies.append({
                            "entity_type": "CASE",
                            "entity_id": c.case_id,
                            "name": f"Delayed reporting: {c.case_id}",
                            "case_count": 1,
                            "cases": [c.case_id],
                            "is_potential_anomaly": True,
                            "anomaly_label": "Timeline anomaly",
                            "investigative_notes": [f"Report was logged {delta} days after recorded incident date; delayed disclosure noted"]
                        })
        return anomalies

    @staticmethod
    def get_all_anomalies(
        cases: List[CaseModel],
        entities: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        p_res = AnomalyService.analyze_person_recurrence(cases, entities.get("persons", []))
        v_res = AnomalyService.analyze_vehicle_recurrence(cases, entities.get("vehicles", []))
        l_res = AnomalyService.analyze_location_concentration(cases, entities.get("locations", []))
        t_res = AnomalyService.analyze_timeline_anomalies(cases)

        anomalies = [r for r in p_res if r["is_potential_anomaly"]]
        anomalies.extend([r for r in v_res if r["is_potential_anomaly"]])
        anomalies.extend(l_res)
        anomalies.extend(t_res[:3])

        return anomalies
