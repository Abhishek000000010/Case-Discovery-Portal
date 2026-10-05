import { CaseDetailResponse } from '../types/case';
import { RelationshipExplanation } from '../types/relationship';
import { GraphData } from '../types/graph';
import { PersonEntity, VehicleEntity, LocationEntity, ObjectEntity } from '../types/entity';

const API_BASE = '/api';

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to load portal statistics');
  return res.json();
}

export async function fetchCases(params: {
  q?: string;
  crime_type?: string;
  severity?: string;
  status?: string;
  location_id?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  page_size?: number;
}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, String(val));
    }
  });
  const res = await fetch(`${API_BASE}/cases?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to load cases');
  return res.json();
}

export async function fetchCaseDetail(caseId: string): Promise<CaseDetailResponse> {
  const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}`);
  if (!res.ok) throw new Error(`Failed to load details for case ${caseId}`);
  return res.json();
}

export async function fetchCaseRelationships(caseId: string, minConfidence: number = 0.40): Promise<RelationshipExplanation[]> {
  const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}/relationships?min_confidence=${minConfidence}`);
  if (!res.ok) throw new Error(`Failed to load relationships for case ${caseId}`);
  return res.json();
}

export async function fetchCaseGraph(caseId: string, depth: number = 1, minConfidence: number = 0.40): Promise<GraphData> {
  const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}/graph?depth=${depth}&min_confidence=${minConfidence}`);
  if (!res.ok) throw new Error(`Failed to load graph for case ${caseId}`);
  return res.json();
}

export async function fetchGraph(params: {
  center_id?: string;
  depth?: number;
  min_confidence?: number;
  node_types?: string;
  rel_types?: string;
}): Promise<GraphData> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, String(val));
    }
  });
  const res = await fetch(`${API_BASE}/graph?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to load knowledge graph');
  return res.json();
}

export async function fetchGlobalSearch(q: string) {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function fetchPersons(onlyRecurring: boolean = false, minCases: number = 1): Promise<PersonEntity[]> {
  const res = await fetch(`${API_BASE}/entities/persons?only_recurring=${onlyRecurring}&min_cases=${minCases}`);
  if (!res.ok) throw new Error('Failed to load persons');
  return res.json();
}

export async function fetchPersonDetail(personId: string) {
  const res = await fetch(`${API_BASE}/entities/persons/${encodeURIComponent(personId)}`);
  if (!res.ok) throw new Error(`Failed to load details for person ${personId}`);
  return res.json();
}

export async function fetchVehicles(): Promise<VehicleEntity[]> {
  const res = await fetch(`${API_BASE}/entities/vehicles`);
  if (!res.ok) throw new Error('Failed to load vehicles');
  return res.json();
}

export async function fetchLocations(): Promise<LocationEntity[]> {
  const res = await fetch(`${API_BASE}/entities/locations`);
  if (!res.ok) throw new Error('Failed to load locations');
  return res.json();
}

export async function fetchObjects(): Promise<ObjectEntity[]> {
  const res = await fetch(`${API_BASE}/entities/objects`);
  if (!res.ok) throw new Error('Failed to load objects');
  return res.json();
}

export async function fetchPatterns() {
  const res = await fetch(`${API_BASE}/patterns`);
  if (!res.ok) throw new Error('Failed to load discovered patterns');
  return res.json();
}

export async function fetchAnomalies() {
  const res = await fetch(`${API_BASE}/anomalies`);
  if (!res.ok) throw new Error('Failed to load anomalies');
  return res.json();
}

export async function fetchEvaluation(minConfidence: number = 0.45) {
  const res = await fetch(`${API_BASE}/evaluation?min_confidence=${minConfidence}`);
  if (!res.ok) throw new Error('Failed to run benchmark evaluation');
  return res.json();
}

export async function rebuildRelationships() {
  const res = await fetch(`${API_BASE}/analysis/rebuild`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to rebuild relationships');
  return res.json();
}

export async function fetchRelationshipDebug(caseId: string, targetCaseId: string) {
  const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}/relationship-debug/${encodeURIComponent(targetCaseId)}`);
  if (!res.ok) throw new Error(`Failed to load relationship debug for ${caseId} <-> ${targetCaseId}`);
  return res.json();
}

export async function fetchIndirectPaths(caseId: string, targetCaseId: string) {
  const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}/indirect-paths/${encodeURIComponent(targetCaseId)}`);
  if (!res.ok) throw new Error(`Failed to load indirect paths for ${caseId} <-> ${targetCaseId}`);
  return res.json();
}

export async function fetchIndirectConnections(caseId: string, maxHops: number = 3) {
  const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}/indirect-connections?max_hops=${maxHops}`);
  if (!res.ok) throw new Error(`Failed to load indirect connections for ${caseId}`);
  return res.json();
}

export async function fetchNextSignals(caseId: string) {
  const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}/next-signals`);
  if (!res.ok) throw new Error(`Failed to load next signals for ${caseId}`);
  return res.json();
}

export async function fetchCaseIntelligenceSummary(caseId: string) {
  const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}/intelligence-summary`);
  if (!res.ok) throw new Error(`Failed to load intelligence summary for ${caseId}`);
  return res.json();
}

export async function fetchClusters() {
  const res = await fetch(`${API_BASE}/clusters`);
  if (!res.ok) throw new Error('Failed to load case clusters');
  return res.json();
}
