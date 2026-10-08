import json
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Set
from datetime import datetime

from backend.app.config import get_synthetic_dataset_path
from backend.app.models.intelligence_graph_models import (
    EntityCounts,
    IntelligenceCaseSummary,
    CaseEntityNode,
    CaseEntityEdge,
    TimelineEvent,
    CaseIntelligenceGraphResponse,
)


class CaseEntityGraphProvider(ABC):
    """
    Abstract interface for case entity-level intelligence graph providers.
    Supports both synthetic demonstration records and future DocumentExtractionService output.
    """

    @abstractmethod
    def get_cases(self) -> List[IntelligenceCaseSummary]:
        """List summaries of all available cases."""
        pass

    @abstractmethod
    def get_case_graph(
        self, case_id: str, depth: str = "full"
    ) -> Optional[CaseIntelligenceGraphResponse]:
        """
        Build and return the entity-level graph, timeline, and node/edge metadata for a case.
        depth: 'direct' | 'two_levels' | 'full'
        """
        pass


class JsonSyntheticCaseEntityGraphProvider(CaseEntityGraphProvider):
    """
    Implementation of CaseEntityGraphProvider that reads structured case entity data
    from indian_detailed_case_entity_dataset.json.
    """

    def __init__(self):
        self._dataset: Dict[str, Any] = {}
        self._cases_by_id: Dict[str, Dict[str, Any]] = {}
        self._load_dataset()

    def _load_dataset(self) -> None:
        path = get_synthetic_dataset_path()
        with open(path, "r", encoding="utf-8") as f:
            self._dataset = json.load(f)
        for c in self._dataset.get("cases", []):
            self._cases_by_id[c["case_id"]] = c

    def get_cases(self) -> List[IntelligenceCaseSummary]:
        summaries: List[IntelligenceCaseSummary] = []
        for c in self._dataset.get("cases", []):
            summaries.append(self._build_case_summary(c))
        return summaries

    def _build_case_summary(self, c: Dict[str, Any]) -> IntelligenceCaseSummary:
        case_info = c.get("case", {})
        locations = c.get("locations", [])
        primary_loc = ""
        if locations:
            primary_loc = locations[0].get("name", "")
            city = locations[0].get("city", "")
            if city:
                primary_loc = f"{primary_loc}, {city}"

        counts = EntityCounts(
            persons=len(c.get("persons") or []),
            locations=len(c.get("locations") or []),
            weapons=len(c.get("weapons") or []),
            vehicles=len(c.get("vehicles") or []),
            objects=len(c.get("objects") or []),
            events=len(c.get("events") or []),
            evidence=len(c.get("evidence") or []),
        )

        return IntelligenceCaseSummary(
            case_id=c["case_id"],
            crime_type=case_info.get("crime_type", "Unknown"),
            status=case_info.get("status", "Active"),
            severity=case_info.get("severity", "Medium"),
            reported_date=case_info.get("reported_date"),
            incident_date=case_info.get("incident_date"),
            incident_time=case_info.get("incident_time"),
            police_station=case_info.get("police_station"),
            investigating_unit=case_info.get("investigating_unit"),
            summary=case_info.get("summary"),
            location=primary_loc or None,
            counts=counts,
            is_synthetic_demo=True,
        )

    def get_case_graph(
        self, case_id: str, depth: str = "full"
    ) -> Optional[CaseIntelligenceGraphResponse]:
        c = self._cases_by_id.get(case_id)
        if not c:
            return None

        case_summary = self._build_case_summary(c)
        case_info = c.get("case", {})

        nodes: List[CaseEntityNode] = []
        edges: List[CaseEntityEdge] = []
        timeline: List[TimelineEvent] = []

        seen_nodes: Set[str] = set()
        seen_edges: Set[str] = set()

        def add_node(node: CaseEntityNode):
            if node.id not in seen_nodes:
                seen_nodes.add(node.id)
                nodes.append(node)

        def add_edge(edge: CaseEntityEdge):
            edge_key = f"{edge.source}->{edge.target}:{edge.relationship_type}"
            rev_key = f"{edge.target}->{edge.source}:{edge.relationship_type}"
            if edge_key not in seen_edges and rev_key not in seen_edges:
                seen_edges.add(edge_key)
                edges.append(edge)

        # 1. Root CASE Node
        root_node = CaseEntityNode(
            id=case_id,
            type="CASE",
            label=f"{case_id}: {case_summary.crime_type}",
            sublabel=f"{case_summary.status} • {case_summary.severity}",
            role="root_case",
            depth=0,
            properties={
                "case_id": case_id,
                "crime_type": case_summary.crime_type,
                "status": case_summary.status,
                "severity": case_summary.severity,
                "reported_date": case_summary.reported_date,
                "incident_date": case_summary.incident_date,
                "incident_time": case_summary.incident_time,
                "police_station": case_summary.police_station,
                "investigating_unit": case_summary.investigating_unit,
                "summary": case_summary.summary,
                "location": case_summary.location,
            },
        )
        add_node(root_node)

        # Lookup maps for labels/names
        person_map: Dict[str, Dict[str, Any]] = {}
        for p in c.get("persons", []):
            person_map[p["person_id"]] = p

        location_map: Dict[str, Dict[str, Any]] = {}
        for loc in c.get("locations", []):
            location_map[loc["location_id"]] = loc

        weapon_map: Dict[str, Dict[str, Any]] = {}
        for w in c.get("weapons", []):
            weapon_map[w["weapon_id"]] = w

        vehicle_map: Dict[str, Dict[str, Any]] = {}
        for v in c.get("vehicles", []):
            vehicle_map[v["vehicle_id"]] = v

        object_map: Dict[str, Dict[str, Any]] = {}
        for obj in c.get("objects", []):
            object_map[obj["object_id"]] = obj

        # 2. Persons
        for p in c.get("persons", []):
            pid = p["person_id"]
            role = p.get("role", "person").lower()
            formatted_role = role.replace("_", " ").title()
            node = CaseEntityNode(
                id=pid,
                type="PERSON",
                label=p.get("name", pid),
                sublabel=f"{formatted_role} • {p.get('age', 'N/A')}y, {p.get('gender', 'N/A')}",
                role=role,
                depth=1,
                properties={
                    "person_id": pid,
                    "name": p.get("name"),
                    "role": formatted_role,
                    "age": p.get("age"),
                    "gender": p.get("gender"),
                    "relationship_to_case": f"Formally identified as {formatted_role} in case file",
                },
            )
            add_node(node)

            # Edge to CASE
            add_edge(
                CaseEntityEdge(
                    id=f"edge-{pid}-{case_id}",
                    source=pid,
                    target=case_id,
                    relationship_type=role,
                    label=role.replace("_", " "),
                    relationship_mode="explicit",
                    explanation=f"The case record explicitly identifies this person with the role '{formatted_role}'.",
                    source_detail="Case entity relationship data",
                    properties={"role": role},
                )
            )

        # 3. Locations
        for loc in c.get("locations", []):
            lid = loc["location_id"]
            role = loc.get("role", "crime_scene").lower()
            formatted_role = role.replace("_", " ").title()
            node = CaseEntityNode(
                id=lid,
                type="LOCATION",
                label=loc.get("name", lid),
                sublabel=f"{formatted_role} • {loc.get('city', '')}",
                role=role,
                depth=1,
                properties={
                    "location_id": lid,
                    "name": loc.get("name"),
                    "city": loc.get("city"),
                    "state": loc.get("state"),
                    "role": formatted_role,
                },
            )
            add_node(node)

            add_edge(
                CaseEntityEdge(
                    id=f"edge-{case_id}-{lid}",
                    source=case_id,
                    target=lid,
                    relationship_type=role,
                    label=role.replace("_", " "),
                    relationship_mode="explicit",
                    explanation=f"The incident occurred or was tracked at '{loc.get('name')}', catalogued as '{formatted_role}'.",
                    source_detail="Police jurisdiction and incident location log",
                    properties={"role": role},
                )
            )

        # 4. Weapons
        for w in c.get("weapons", []):
            wid = w["weapon_id"]
            wtype = w.get("type", "weapon").replace("_", " ").title()
            wstatus = w.get("status", "recorded").title()
            node = CaseEntityNode(
                id=wid,
                type="WEAPON",
                label=f"{wtype}",
                sublabel=f"Status: {wstatus}",
                role=w.get("status", "weapon"),
                depth=1,
                properties={
                    "weapon_id": wid,
                    "type": wtype,
                    "description": w.get("description"),
                    "status": wstatus,
                    "related_case": case_id,
                },
            )
            add_node(node)

            add_edge(
                CaseEntityEdge(
                    id=f"edge-{wid}-{case_id}",
                    source=wid,
                    target=case_id,
                    relationship_type="case_related_weapon",
                    label="case_related_weapon",
                    relationship_mode="explicit",
                    explanation=f"The case file explicitly registers this weapon ({wtype}, status: {wstatus}) as tied to the incident.",
                    source_detail="Case evidence and weapons register",
                    properties={"status": w.get("status")},
                )
            )

        # 5. Vehicles
        for v in c.get("vehicles", []):
            vid = v["vehicle_id"]
            vreg = v.get("registration", vid)
            vtype = v.get("type", "vehicle").title()
            vrole = v.get("role", "associated_vehicle").replace("_", " ").title()
            owner_id = v.get("owner_person_id")
            owner_name = person_map.get(owner_id, {}).get("name") if owner_id else None

            node = CaseEntityNode(
                id=vid,
                type="VEHICLE",
                label=vreg,
                sublabel=f"{vtype} • {vrole}",
                role=v.get("role", "vehicle"),
                depth=1,
                properties={
                    "vehicle_id": vid,
                    "registration": vreg,
                    "type": vtype,
                    "role": vrole,
                    "owner_person_id": owner_id,
                    "owner_name": owner_name,
                },
            )
            add_node(node)

            # Link vehicle to Case
            add_edge(
                CaseEntityEdge(
                    id=f"edge-{vid}-{case_id}",
                    source=vid,
                    target=case_id,
                    relationship_type="case_vehicle",
                    label=v.get("role", "case_vehicle").replace("_", " "),
                    relationship_mode="explicit",
                    explanation=f"Vehicle registration {vreg} ({vtype}) is logged as {vrole} in this case.",
                    source_detail="Vehicle identification database",
                )
            )

            # Link vehicle to owner person if present
            if owner_id and owner_id in person_map:
                add_edge(
                    CaseEntityEdge(
                        id=f"edge-{owner_id}-{vid}",
                        source=owner_id,
                        target=vid,
                        relationship_type="associated_with",
                        label="associated_with",
                        relationship_mode="explicit",
                        explanation=f"Person '{owner_name or owner_id}' is documented as the registered owner/user of vehicle {vreg}.",
                        source_detail="Vehicle ownership records",
                    )
                )

        # 6. Objects
        for obj in c.get("objects", []):
            oid = obj["object_id"]
            otype = obj.get("type", "object").replace("_", " ").title()
            odesc = obj.get("description", "")
            node = CaseEntityNode(
                id=oid,
                type="OBJECT",
                label=otype,
                sublabel=odesc[:30] + ("..." if len(odesc) > 30 else ""),
                role=obj.get("type", "object"),
                depth=1,
                properties={
                    "object_id": oid,
                    "type": otype,
                    "description": odesc,
                    "related_case": case_id,
                },
            )
            add_node(node)

            add_edge(
                CaseEntityEdge(
                    id=f"edge-{oid}-{case_id}",
                    source=oid,
                    target=case_id,
                    relationship_type="evidence_for",
                    label="evidence_for",
                    relationship_mode="explicit",
                    explanation=f"Object '{otype}' ({oid}) is logged as material evidence recovered in this case.",
                    source_detail="Physical evidence inventory",
                )
            )

        # 7. Evidence
        for evd in c.get("evidence", []):
            eid = evd["evidence_id"]
            etype = evd.get("type", "evidence").replace("_", " ").title()
            edesc = evd.get("description") or f"Forensic item linked to {evd.get('linked_entity', 'case')}"
            linked_entity = evd.get("linked_entity")

            node = CaseEntityNode(
                id=eid,
                type="EVIDENCE",
                label=f"EVD: {etype}",
                sublabel=edesc[:30] + ("..." if len(edesc) > 30 else ""),
                role=evd.get("type", "evidence"),
                depth=1,
                properties={
                    "evidence_id": eid,
                    "type": etype,
                    "description": edesc,
                    "linked_entity": linked_entity,
                    "related_case": case_id,
                },
            )
            add_node(node)

            add_edge(
                CaseEntityEdge(
                    id=f"edge-{eid}-{case_id}",
                    source=eid,
                    target=case_id,
                    relationship_type="evidence_for",
                    label="evidence_for",
                    relationship_mode="explicit",
                    explanation=f"Evidence item {eid} ({etype}) was formally submitted into case records.",
                    source_detail="Chain of custody register",
                )
            )

            # Link to physical entity if referenced (e.g. WPN-001 or OBJ-001)
            if linked_entity and (linked_entity in weapon_map or linked_entity in object_map):
                target_label = (
                    weapon_map.get(linked_entity, {}).get("type", "weapon").title()
                    if linked_entity in weapon_map
                    else object_map.get(linked_entity, {}).get("type", "object").title()
                )
                add_edge(
                    CaseEntityEdge(
                        id=f"edge-{eid}-{linked_entity}",
                        source=eid,
                        target=linked_entity,
                        relationship_type="linked_to",
                        label="linked_to",
                        relationship_mode="explicit",
                        explanation=f"Forensic evidence {eid} directly corresponds to physical entity {linked_entity} ({target_label}).",
                        source_detail="Forensic evidence correlation log",
                    )
                )

        # 8. Events & Chronology
        raw_events = c.get("events", [])
        sorted_events = sorted(raw_events, key=lambda x: x.get("timestamp", ""))

        for evt in sorted_events:
            evtid = evt["event_id"]
            etype = evt.get("type", "event").replace("_", " ").title()
            raw_ts = evt.get("timestamp", "")

            # Formatted time & date
            time_display = "N/A"
            date_display = "N/A"
            if raw_ts:
                try:
                    dt = datetime.fromisoformat(raw_ts)
                    time_display = dt.strftime("%H:%M")
                    date_display = dt.strftime("%Y-%m-%d")
                except Exception:
                    parts = raw_ts.split("T")
                    date_display = parts[0]
                    time_display = parts[1][:5] if len(parts) > 1 else ""

            loc_id = evt.get("location_id")
            loc_name = location_map.get(loc_id, {}).get("name") if loc_id else None

            pids = evt.get("person_ids", [])
            pnames = [
                f"{person_map[pid].get('name', pid)} ({person_map[pid].get('role', 'person')})"
                for pid in pids
                if pid in person_map
            ]

            w_id = evt.get("weapon_id")
            w_name = weapon_map.get(w_id, {}).get("type", "").title() if w_id else None

            v_id = evt.get("vehicle_id")
            v_reg = vehicle_map.get(v_id, {}).get("registration") if v_id else None

            # Add Timeline Event
            timeline.append(
                TimelineEvent(
                    event_id=evtid,
                    type=evt.get("type", "event"),
                    timestamp=raw_ts,
                    time_display=time_display,
                    date_display=date_display,
                    title=etype,
                    location_id=loc_id,
                    location_name=loc_name,
                    person_ids=pids,
                    person_names=pnames,
                    weapon_id=w_id,
                    weapon_name=w_name,
                    vehicle_id=v_id,
                    vehicle_registration=v_reg,
                    description=f"{etype} logged at {time_display} near {loc_name or 'incident area'}.",
                )
            )

            # Add Event Node
            node = CaseEntityNode(
                id=evtid,
                type="EVENT",
                label=f"{time_display} {etype}",
                sublabel=f"Loc: {loc_name or 'N/A'}",
                role=evt.get("type", "event"),
                depth=1,
                properties={
                    "event_id": evtid,
                    "event_type": etype,
                    "timestamp": raw_ts,
                    "time": time_display,
                    "date": date_display,
                    "location": loc_name,
                    "involved_persons": pnames,
                    "weapon": w_name,
                    "vehicle": v_reg,
                },
            )
            add_node(node)

            # Edge to CASE
            add_edge(
                CaseEntityEdge(
                    id=f"edge-{evtid}-{case_id}",
                    source=evtid,
                    target=case_id,
                    relationship_type="case_event",
                    label="case_event",
                    relationship_mode="explicit",
                    explanation=f"Incident timeline: event '{etype}' took place at {time_display} on {date_display}.",
                    source_detail="Investigative chronology record",
                )
            )

            # Edge to Location
            if loc_id and loc_id in location_map:
                add_edge(
                    CaseEntityEdge(
                        id=f"edge-{evtid}-{loc_id}",
                        source=evtid,
                        target=loc_id,
                        relationship_type="occurred_at",
                        label="occurred_at",
                        relationship_mode="explicit",
                        explanation=f"Event '{etype}' occurred specifically at '{loc_name}'.",
                        source_detail="Event scene geolocation",
                    )
                )

            # Edges to Involved Persons
            for pid in pids:
                if pid in person_map:
                    pname = person_map[pid].get("name", pid)
                    prole = person_map[pid].get("role", "person").replace("_", " ")
                    add_edge(
                        CaseEntityEdge(
                            id=f"edge-{pid}-{evtid}",
                            source=pid,
                            target=evtid,
                            relationship_type="involved_in",
                            label="involved_in",
                            relationship_mode="explicit",
                            explanation=f"Person '{pname}' ({prole}) is explicitly recorded as present or active in event '{etype}'.",
                            source_detail="Eyewitness and forensic event reconstruction",
                        )
                    )

            # Edge to Weapon
            if w_id and w_id in weapon_map:
                add_edge(
                    CaseEntityEdge(
                        id=f"edge-{evtid}-{w_id}",
                        source=evtid,
                        target=w_id,
                        relationship_type="involved_weapon",
                        label="involved_weapon",
                        relationship_mode="explicit",
                        explanation=f"Event '{etype}' involved weapon '{w_name}' ({w_id}).",
                        source_detail="Ballistics & weapons recovered at event locus",
                    )
                )

            # Edge to Vehicle
            if v_id and v_id in vehicle_map:
                add_edge(
                    CaseEntityEdge(
                        id=f"edge-{evtid}-{v_id}",
                        source=evtid,
                        target=v_id,
                        relationship_type="used_in",
                        label="used_in",
                        relationship_mode="explicit",
                        explanation=f"Vehicle registration {v_reg} was recorded as used during '{etype}'.",
                        source_detail="CCTV and witness tracking",
                    )
                )

        # 9. Explicit Custom Relationships in dataset
        for r in c.get("relationships", []):
            src = case_id if r["source"] == "CASE" else r["source"]
            tgt = case_id if r["target"] == "CASE" else r["target"]
            rel_name = r["relation"]

            if src in seen_nodes and tgt in seen_nodes:
                src_node = next((n for n in nodes if n.id == src), None)
                tgt_node = next((n for n in nodes if n.id == tgt), None)
                src_label = src_node.label if src_node else src
                tgt_label = tgt_node.label if tgt_node else tgt

                add_edge(
                    CaseEntityEdge(
                        id=f"edge-{src}-{tgt}-{rel_name}",
                        source=src,
                        target=tgt,
                        relationship_type=rel_name,
                        label=rel_name.replace("_", " "),
                        relationship_mode="explicit",
                        explanation=f"The case record explicitly defines this relationship '{rel_name.replace('_', ' ')}' between {src_label} and {tgt_label}.",
                        source_detail="Case entity relationship data",
                    )
                )

        # 10. Derived Chronological Progression (next_event) between Events
        for i in range(len(sorted_events) - 1):
            curr_evt = sorted_events[i]
            next_evt = sorted_events[i + 1]
            e1_id = curr_evt["event_id"]
            e2_id = next_evt["event_id"]
            t1 = curr_evt.get("timestamp", "").split("T")[-1][:5]
            t2 = next_evt.get("timestamp", "").split("T")[-1][:5]

            add_edge(
                CaseEntityEdge(
                    id=f"edge-seq-{e1_id}-{e2_id}",
                    source=e1_id,
                    target=e2_id,
                    relationship_type="next_event",
                    label="next_event",
                    relationship_mode="derived",
                    explanation=f"Derived chronological progression: Event '{curr_evt.get('type')}' ({t1}) preceded '{next_evt.get('type')}' ({t2}).",
                    source_detail="Derived: Chronological event sequence engine",
                )
            )

        # 11. Handle Depth Control
        # Depth options: "direct" | "two_levels" | "full"
        if depth == "direct":
            # Direct only: Keep CASE and nodes directly connected to CASE
            direct_node_ids = {case_id}
            for e in edges:
                if e.source == case_id:
                    direct_node_ids.add(e.target)
                elif e.target == case_id:
                    direct_node_ids.add(e.source)

            filtered_nodes = [n for n in nodes if n.id in direct_node_ids]
            filtered_edges = [
                e
                for e in edges
                if (e.source in direct_node_ids and e.target in direct_node_ids)
                and (e.source == case_id or e.target == case_id)
            ]
            return CaseIntelligenceGraphResponse(
                case=case_summary,
                nodes=filtered_nodes,
                edges=filtered_edges,
                timeline=timeline,
            )

        elif depth == "two_levels":
            # 2 levels: Keep nodes within 2 hops of CASE
            lvl1_ids = {case_id}
            for e in edges:
                if e.source == case_id:
                    lvl1_ids.add(e.target)
                elif e.target == case_id:
                    lvl1_ids.add(e.source)

            lvl2_ids = set(lvl1_ids)
            for e in edges:
                if e.source in lvl1_ids:
                    lvl2_ids.add(e.target)
                elif e.target in lvl1_ids:
                    lvl2_ids.add(e.source)

            filtered_nodes = [n for n in nodes if n.id in lvl2_ids]
            filtered_edges = [
                e
                for e in edges
                if e.source in lvl2_ids
                and e.target in lvl2_ids
                # filter out event-to-event sequence in 2 levels to keep it simpler
                and e.relationship_type != "next_event"
            ]
            return CaseIntelligenceGraphResponse(
                case=case_summary,
                nodes=filtered_nodes,
                edges=filtered_edges,
                timeline=timeline,
            )

        # "full" returns all nodes and edges
        return CaseIntelligenceGraphResponse(
            case=case_summary,
            nodes=nodes,
            edges=edges,
            timeline=timeline,
        )


# Singleton provider instance
intelligence_provider = JsonSyntheticCaseEntityGraphProvider()
