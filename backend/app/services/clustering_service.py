from typing import List, Dict, Any, Tuple, Optional
from collections import Counter
import numpy as np
from sklearn.cluster import AgglomerativeClustering
from sklearn.feature_extraction.text import TfidfVectorizer

from backend.app.models.case_models import CaseModel
from backend.app.models.relationship_models import CaseCluster, NextSignal
from backend.app.models.entity_models import LocationEntity
from backend.app.utils.text_normalization import normalize_text


class ClusteringService:
    """
    Case Clustering and Probabilistic Next-Signal Intelligence Engine.
    Discovers multi-case behavioral series and spatial-temporal clusters using
    feature vector aggregation, and derives probabilistic historical transition signals.
    """

    @staticmethod
    def cluster_cases(
        cases: List[CaseModel],
        location_map: Dict[str, LocationEntity]
    ) -> List[CaseCluster]:
        """
        Clusters cases based on unified MO, crime category, and event sequence features.
        Surfaces explainable crime series clusters.
        """
        if len(cases) < 4:
            return []

        # Build feature text for each case
        case_features = []
        for c in cases:
            text_tokens = [
                c.case_type,
                " ".join(c.modus_operandi),
                " ".join([ev.type for ev in c.events]),
                " ".join(c.tags)
            ]
            case_features.append(" ".join(text_tokens))

        vectorizer = TfidfVectorizer(max_features=120, stop_words="english")
        tfidf_mat = vectorizer.fit_transform(case_features).toarray()

        # Agglomerative clustering with distance threshold
        # metric='cosine' with average linkage to group behavioral profiles
        clustering = AgglomerativeClustering(
            n_clusters=None,
            distance_threshold=0.72,
            metric="cosine",
            linkage="average"
        )
        labels = clustering.fit_predict(tfidf_mat)

        # Group cases by cluster label
        clusters_dict: Dict[int, List[CaseModel]] = {}
        for idx, lbl in enumerate(labels):
            clusters_dict.setdefault(lbl, []).append(cases[idx])

        discovered_clusters: List[CaseCluster] = []

        for cid_int, cluster_cases in clusters_dict.items():
            # Only consider clusters with 3 or more cases
            if len(cluster_cases) < 3:
                continue

            case_ids = [c.case_id for c in cluster_cases]
            dominant_type = Counter([c.case_type for c in cluster_cases]).most_common(1)[0][0]

            # Extract common MO items appearing in >= 40% of cluster cases
            all_mos: Counter = Counter()
            for c in cluster_cases:
                for mo in set(c.modus_operandi):
                    all_mos[mo] += 1

            min_mo_count = max(2, int(len(cluster_cases) * 0.40))
            common_mo = [mo for mo, count in all_mos.most_common(5) if count >= min_mo_count]
            if not common_mo:
                common_mo = [mo for mo, _ in all_mos.most_common(3)]

            # Locations involved
            loc_names = set()
            for c in cluster_cases:
                for l in c.locations:
                    if l.location_id in location_map:
                        loc_names.add(location_map[l.location_id].name)

            # Dates
            dates = [c.incident_date or c.reported_date for c in cluster_cases if c.incident_date or c.reported_date]
            dates.sort()
            time_period = f"{dates[0]} to {dates[-1]}" if dates else "Ongoing"

            # Generate descriptive cluster name
            mo_preview = common_mo[0].replace("_", " ").title() if common_mo else dominant_type.replace("_", " ").title()
            name = f"{mo_preview} Series ({dominant_type.replace('_', ' ').title()})"

            summary = (
                f"Statistical cluster of {len(case_ids)} incidents exhibiting dominant '{dominant_type.replace('_', ' ')}' "
                f"classification with recurring MO techniques: [{', '.join(common_mo[:3])}]."
            )

            discovered_clusters.append(
                CaseCluster(
                    cluster_id=f"CLUSTER_{cid_int + 1:03d}",
                    name=name,
                    dominant_crime_type=dominant_type,
                    case_count=len(case_ids),
                    case_ids=case_ids,
                    common_mo=common_mo,
                    locations=sorted(list(loc_names))[:5],
                    time_period=time_period,
                    narrative_summary=summary
                )
            )

        discovered_clusters.sort(key=lambda cl: cl.case_count, reverse=True)
        return discovered_clusters

    @staticmethod
    def infer_next_signals(
        case: CaseModel,
        all_cases: List[CaseModel],
        location_map: Dict[str, LocationEntity]
    ) -> List[NextSignal]:
        """
        Derives probabilistic investigative next signals based on historical patterns.
        STRICT: Always framed as 'POTENTIAL NEXT SIGNAL', never declaring certainty.
        """
        signals: List[NextSignal] = []

        # Find historical cases sharing similar crime type and MO
        c_mo = set(case.modus_operandi)
        similar_history: List[Tuple[CaseModel, float]] = []

        for other in all_cases:
            if other.case_id == case.case_id:
                continue
            if other.case_type == case.case_type:
                o_mo = set(other.modus_operandi)
                mo_overlap = len(c_mo.intersection(o_mo))
                if mo_overlap >= 2:
                    similar_history.append((other, float(mo_overlap)))

        # 1. Spatial Movement Signal
        # Check what locations subsequent events occurred in for similar cases
        target_locations: Counter = Counter()
        history_cids: List[str] = []

        current_loc_ids = {l.location_id for l in case.locations}

        for hist_case, _ in similar_history:
            history_cids.append(hist_case.case_id)
            for l in hist_case.locations:
                if l.location_id not in current_loc_ids:
                    target_locations[l.location_id] += 1

        if target_locations:
            top_loc_id, count = target_locations.most_common(1)[0]
            if count >= 2:
                loc_name = location_map[top_loc_id].name if top_loc_id in location_map else top_loc_id
                confidence = round(min(0.85, 0.45 + (0.10 * count)), 2)

                signals.append(
                    NextSignal(
                        signal_id=f"SIG_LOC_{case.case_id}",
                        case_id=case.case_id,
                        signal_type="location_pattern",
                        target_value=loc_name,
                        confidence=confidence,
                        reason=(
                            f"Historically, {count} related incidents with matching MO [{', '.join(list(c_mo)[:2])}] "
                            f"involved activity or secondary rendezvous at '{loc_name}'."
                        ),
                        historical_support_cases=history_cids[:4]
                    )
                )

        # 2. Event Sequence Transition Signal
        # If the case's last event is an escape or burglary, what was the typical next stage historically?
        if case.events:
            last_event = case.events[-1].type
            next_events: Counter = Counter()

            for hist_case, _ in similar_history:
                ev_types = [e.type for e in hist_case.events]
                if last_event in ev_types:
                    idx = ev_types.index(last_event)
                    if idx + 1 < len(ev_types):
                        next_events[ev_types[idx + 1]] += 1

            if next_events:
                top_next, ev_count = next_events.most_common(1)[0]
                conf = round(min(0.80, 0.40 + (0.12 * ev_count)), 2)
                signals.append(
                    NextSignal(
                        signal_id=f"SIG_EV_{case.case_id}",
                        case_id=case.case_id,
                        signal_type="mo_transition",
                        target_value=top_next.replace("_", " ").title(),
                        confidence=conf,
                        reason=(
                            f"In historical cases following stage '{last_event.replace('_', ' ')}', "
                            f"the typical subsequent event stage was '{top_next.replace('_', ' ')}' ({ev_count} historical occurrences)."
                        ),
                        historical_support_cases=history_cids[:3]
                    )
                )

        return signals
