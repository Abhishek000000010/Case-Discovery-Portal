import { CaseDetailResponse } from '../types/case';
import {
  RelationshipExplanation,
  RelationshipExplanationResponse,
  RelationshipDebugResponse,
  CasePattern,
  AnomalyItem,
} from '../types/relationship';
import { GraphData } from '../types/graph';
import { CityEntity, CrimeDescriptionEntity, WeaponEntity, CrimeDomainEntity } from '../types/entity';
import {
  IntelligenceCaseSummary,
  CaseIntelligenceGraphResponse,
} from '../types/intelligenceGraph';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to load portal statistics');
  return res.json();
}

export async function fetchAnalytics() {
  const res = await fetch(`${API_BASE}/analytics`);
  if (!res.ok) throw new Error('Failed to load analytics breakdown');
  return res.json();
}

export async function fetchCases(params: {
  q?: string;
  city?: string;
  crime_description?: string;
  crime_domain?: string;
  weapon?: string;
  status?: string;
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

export async function fetchCaseRelationships(
  caseId: string,
  minConfidence: number = 0.35,
  limit: number = 20
): Promise<RelationshipExplanation[]> {
  const res = await fetch(
    `${API_BASE}/cases/${encodeURIComponent(caseId)}/relationships?min_confidence=${minConfidence}&limit=${limit}`
  );
  if (!res.ok) throw new Error(`Failed to load relationships for case ${caseId}`);
  return res.json();
}

export async function fetchCaseGraph(
  caseId: string,
  maxRelated: number = 10,
  minConfidence: number = 0.35
): Promise<GraphData> {
  const res = await fetch(
    `${API_BASE}/cases/${encodeURIComponent(caseId)}/graph?max_related=${maxRelated}&min_confidence=${minConfidence}`
  );
  if (!res.ok) throw new Error(`Failed to load graph for case ${caseId}`);
  return res.json();
}

export async function fetchGraph(params: {
  center_id?: string;
  max_related?: number;
  min_confidence?: number;
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

export async function fetchCities(): Promise<CityEntity[]> {
  const res = await fetch(`${API_BASE}/entities/cities`);
  if (!res.ok) throw new Error('Failed to load cities');
  return res.json();
}

export async function fetchCrimes(): Promise<CrimeDescriptionEntity[]> {
  const res = await fetch(`${API_BASE}/entities/crimes`);
  if (!res.ok) throw new Error('Failed to load crime types');
  return res.json();
}

export async function fetchWeapons(): Promise<WeaponEntity[]> {
  const res = await fetch(`${API_BASE}/entities/weapons`);
  if (!res.ok) throw new Error('Failed to load weapons');
  return res.json();
}

export async function fetchDomains(): Promise<CrimeDomainEntity[]> {
  const res = await fetch(`${API_BASE}/entities/domains`);
  if (!res.ok) throw new Error('Failed to load domains');
  return res.json();
}

export async function fetchEntities() {
  const res = await fetch(`${API_BASE}/entities`);
  if (!res.ok) throw new Error('Failed to load entity summary');
  return res.json();
}

export async function fetchPatterns(): Promise<CasePattern[]> {
  const res = await fetch(`${API_BASE}/patterns`);
  if (!res.ok) throw new Error('Failed to load discovered patterns');
  return res.json();
}

export async function fetchAnomalies(): Promise<AnomalyItem[]> {
  const res = await fetch(`${API_BASE}/anomalies`);
  if (!res.ok) throw new Error('Failed to load anomalies');
  return res.json();
}

export async function fetchEvaluation() {
  const res = await fetch(`${API_BASE}/evaluation`);
  if (!res.ok) throw new Error('Failed to load dataset quality verification');
  return res.json();
}

export async function rebuildRelationships() {
  const res = await fetch(`${API_BASE}/analysis/rebuild`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to rebuild relationships');
  return res.json();
}

export async function fetchRelationshipDebug(caseId: string, targetCaseId: string): Promise<RelationshipDebugResponse> {
  const res = await fetch(
    `${API_BASE}/cases/${encodeURIComponent(caseId)}/relationship-debug/${encodeURIComponent(targetCaseId)}`
  );
  if (!res.ok) throw new Error(`Failed to load relationship debug for ${caseId} <-> ${targetCaseId}`);
  return res.json();
}

export async function fetchRelationshipExplanation(
  sourceCaseId: string,
  targetCaseId: string
): Promise<RelationshipExplanationResponse> {
  const res = await fetch(
    `${API_BASE}/relationships/${encodeURIComponent(sourceCaseId)}/${encodeURIComponent(targetCaseId)}/explanation`
  );
  if (!res.ok) {
    throw new Error(`Failed to load relationship explanation for ${sourceCaseId} <-> ${targetCaseId}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// GRAPH 2: CASE INTELLIGENCE GRAPH API (Entity-Level Single-Case Intelligence)
// ---------------------------------------------------------------------------

export async function fetchIntelligenceCases(): Promise<IntelligenceCaseSummary[]> {
  const res = await fetch(`${API_BASE}/intelligence-cases`);
  if (!res.ok) throw new Error('Failed to load synthetic intelligence cases');
  return res.json();
}

export async function fetchCaseIntelligenceGraph(
  caseId: string,
  depth: string = 'full'
): Promise<CaseIntelligenceGraphResponse> {
  const res = await fetch(
    `${API_BASE}/intelligence-cases/${encodeURIComponent(caseId)}/graph?depth=${encodeURIComponent(depth)}`
  );
  if (!res.ok) throw new Error(`Failed to load intelligence graph for case ${caseId}`);
  return res.json();
}
