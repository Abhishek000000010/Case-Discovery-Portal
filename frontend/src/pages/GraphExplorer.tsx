import React, { useEffect, useState } from 'react';
import {
  Share2,
  Network,
  RefreshCw,
  Search,
  Fingerprint,
  Clock,
  User,
  MapPin,
  Shield,
  Car,
  Package,
  Calendar,
  FileText,
} from 'lucide-react';
import { GraphData } from '../types/graph';
import {
  fetchGraph,
  fetchCases,
  fetchIntelligenceCases,
  fetchCaseIntelligenceGraph,
} from '../services/api';
import { GraphViewer } from '../components/GraphViewer';
import { CaseIntelligenceGraphViewer } from '../components/CaseIntelligenceGraphViewer';
import { CaseTimelinePanel } from '../components/CaseTimelinePanel';
import {
  IntelligenceCaseSummary,
  CaseIntelligenceGraphResponse,
  EntityType,
} from '../types/intelligenceGraph';

export type GraphMode = 'network' | 'intelligence';

interface GraphExplorerProps {
  initialCenterId?: string;
  initialMode?: GraphMode;
  onSelectCase: (caseId: string) => void;
}

const DEFAULT_INTEL_CASES: IntelligenceCaseSummary[] = [
  { case_id: 'DETAIL-CASE-001', crime_type: 'Murder', status: 'Under Investigation', severity: 'Critical', counts: { persons: 4, locations: 2, weapons: 1, vehicles: 1, objects: 2, events: 4, evidence: 3 }, is_synthetic_demo: true },
  { case_id: 'DETAIL-CASE-002', crime_type: 'Robbery', status: 'Court Proceedings', severity: 'High', counts: { persons: 4, locations: 2, weapons: 1, vehicles: 1, objects: 2, events: 4, evidence: 2 }, is_synthetic_demo: true },
  { case_id: 'DETAIL-CASE-003', crime_type: 'Kidnapping', status: 'Under Investigation', severity: 'High', counts: { persons: 4, locations: 2, weapons: 1, vehicles: 1, objects: 2, events: 4, evidence: 2 }, is_synthetic_demo: true },
  { case_id: 'DETAIL-CASE-004', crime_type: 'Vehicle Theft', status: 'Under Investigation', severity: 'Medium', counts: { persons: 4, locations: 2, weapons: 0, vehicles: 1, objects: 2, events: 4, evidence: 2 }, is_synthetic_demo: true },
  { case_id: 'DETAIL-CASE-005', crime_type: 'Burglary', status: 'Court Proceedings', severity: 'High', counts: { persons: 4, locations: 2, weapons: 1, vehicles: 1, objects: 2, events: 4, evidence: 2 }, is_synthetic_demo: true },
  { case_id: 'DETAIL-CASE-006', crime_type: 'Fraud', status: 'Under Investigation', severity: 'Medium', counts: { persons: 4, locations: 2, weapons: 0, vehicles: 1, objects: 2, events: 4, evidence: 2 }, is_synthetic_demo: true },
  { case_id: 'DETAIL-CASE-007', crime_type: 'Murder', status: 'Under Investigation', severity: 'Critical', counts: { persons: 4, locations: 2, weapons: 1, vehicles: 1, objects: 2, events: 4, evidence: 2 }, is_synthetic_demo: true },
  { case_id: 'DETAIL-CASE-008', crime_type: 'Missing Person', status: 'Under Investigation', severity: 'High', counts: { persons: 4, locations: 2, weapons: 0, vehicles: 1, objects: 2, events: 4, evidence: 2 }, is_synthetic_demo: true },
  { case_id: 'DETAIL-CASE-009', crime_type: 'Assault', status: 'Court Proceedings', severity: 'Medium', counts: { persons: 4, locations: 2, weapons: 1, vehicles: 1, objects: 2, events: 4, evidence: 2 }, is_synthetic_demo: true },
  { case_id: 'DETAIL-CASE-010', crime_type: 'Cyber Fraud', status: 'Under Investigation', severity: 'High', counts: { persons: 4, locations: 2, weapons: 0, vehicles: 1, objects: 2, events: 4, evidence: 2 }, is_synthetic_demo: true },
  { case_id: 'DETAIL-CASE-011', crime_type: 'Extortion', status: 'Under Investigation', severity: 'High', counts: { persons: 4, locations: 2, weapons: 1, vehicles: 1, objects: 2, events: 4, evidence: 2 }, is_synthetic_demo: true },
  { case_id: 'DETAIL-CASE-012', crime_type: 'Robbery', status: 'Court Proceedings', severity: 'High', counts: { persons: 4, locations: 2, weapons: 1, vehicles: 1, objects: 2, events: 4, evidence: 2 }, is_synthetic_demo: true },
  { case_id: 'DETAIL-CASE-013', crime_type: 'Drug Possession', status: 'Court Proceedings', severity: 'High', counts: { persons: 4, locations: 2, weapons: 1, vehicles: 1, objects: 2, events: 4, evidence: 2 }, is_synthetic_demo: true },
  { case_id: 'DETAIL-CASE-014', crime_type: 'Arson', status: 'Under Investigation', severity: 'High', counts: { persons: 4, locations: 2, weapons: 1, vehicles: 1, objects: 2, events: 4, evidence: 2 }, is_synthetic_demo: true },
  { case_id: 'DETAIL-CASE-015', crime_type: 'Document Fraud', status: 'Under Investigation', severity: 'Medium', counts: { persons: 4, locations: 2, weapons: 0, vehicles: 1, objects: 2, events: 4, evidence: 2 }, is_synthetic_demo: true },
];

export const GraphExplorer: React.FC<GraphExplorerProps> = ({
  initialCenterId,
  initialMode,
  onSelectCase,
}) => {
  // Determine starting mode based on initialCenterId or initialMode
  const isInitialIntel =
    initialMode === 'intelligence' ||
    (initialCenterId && initialCenterId.startsWith('DETAIL-CASE-'));

  const [graphMode, setGraphMode] = useState<GraphMode>(
    isInitialIntel ? 'intelligence' : 'network'
  );

  // ---------------------------------------------------------------------------
  // GRAPH 1 STATE: CASE NETWORK (Real dataset, 40,160 cases)
  // ---------------------------------------------------------------------------
  const [networkCenterId, setNetworkCenterId] = useState<string>(
    !isInitialIntel && initialCenterId ? initialCenterId : 'IND-CASE-00001'
  );
  const [minConfidence, setMinConfidence] = useState<number>(0.25);
  const [networkGraphData, setNetworkGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [availableNetworkCases, setAvailableNetworkCases] = useState<string[]>([]);
  const [networkSearchFilter, setNetworkSearchFilter] = useState<string>('');
  const [networkLoading, setNetworkLoading] = useState<boolean>(true);

  // ---------------------------------------------------------------------------
  // GRAPH 2 STATE: CASE INTELLIGENCE (Synthetic demo dataset, 15 cases)
  // ---------------------------------------------------------------------------
  const [intelCases, setIntelCases] = useState<IntelligenceCaseSummary[]>(DEFAULT_INTEL_CASES);
  const [selectedIntelCaseId, setSelectedIntelCaseId] = useState<string>(
    isInitialIntel && initialCenterId ? initialCenterId : 'DETAIL-CASE-001'
  );
  const [intelGraphResponse, setIntelGraphResponse] = useState<CaseIntelligenceGraphResponse | null>(null);
  const [intelDepth, setIntelDepth] = useState<'direct' | 'two_levels' | 'full'>('direct');
  const [intelSearchTerm, setIntelSearchTerm] = useState<string>('');
  const [selectedTimelineEventId, setSelectedTimelineEventId] = useState<string | null>(null);
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState<boolean>(false);
  const [intelLoading, setIntelLoading] = useState<boolean>(false);

  // Active entity type filters for Case Intelligence
  const [activeEntityTypes, setActiveEntityTypes] = useState<Record<EntityType, boolean>>({
    CASE: true,
    PERSON: true,
    LOCATION: true,
    WEAPON: true,
    VEHICLE: true,
    OBJECT: true,
    EVENT: true,
    EVIDENCE: true,
  });

  const toggleEntityType = (type: EntityType) => {
    setActiveEntityTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  // ---------------------------------------------------------------------------
  // SYNC PROPS TO STATE ON CHANGES
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (initialCenterId) {
      if (initialCenterId.startsWith('DETAIL-CASE')) {
        setGraphMode('intelligence');
        setSelectedIntelCaseId(initialCenterId);
      } else {
        setGraphMode('network');
        setNetworkCenterId(initialCenterId);
      }
    }
  }, [initialCenterId]);

  // ---------------------------------------------------------------------------
  // LOADERS FOR CASE NETWORK (GRAPH 1)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function loadNetworkCaseList() {
      try {
        const res = await fetchCases({ page: 1, page_size: 50 });
        const ids = (res.cases || []).map((c: any) => c.case_id);
        setAvailableNetworkCases(ids);
      } catch (err) {
        console.error(err);
      }
    }
    loadNetworkCaseList();
  }, []);

  useEffect(() => {
    if (graphMode === 'network' && networkCenterId) {
      loadNetworkGraph();
    }
  }, [graphMode, networkCenterId, minConfidence]);

  async function loadNetworkGraph() {
    try {
      setNetworkLoading(true);
      const data = await fetchGraph({
        center_id: networkCenterId,
        min_confidence: minConfidence,
        max_related: 15,
      });
      setNetworkGraphData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setNetworkLoading(false);
    }
  }

  const handleNetworkSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (networkSearchFilter.trim()) {
      let target = networkSearchFilter.trim().toUpperCase();
      if (!target.startsWith('IND-CASE-') && /^\d+$/.test(target)) {
        target = `IND-CASE-${target.padStart(5, '0')}`;
      }
      setNetworkCenterId(target);
    }
  };

  // ---------------------------------------------------------------------------
  // LOADERS FOR CASE INTELLIGENCE (GRAPH 2)
  // ---------------------------------------------------------------------------
  const [intelError, setIntelError] = useState<string | null>(null);

  async function loadIntelCaseList() {
    try {
      setIntelError(null);
      const cases = await fetchIntelligenceCases();
      setIntelCases(cases);
      if (cases.length > 0) {
        const nextId = selectedIntelCaseId || cases[0].case_id;
        setSelectedIntelCaseId(nextId);
      }
    } catch (err: any) {
      console.error('Failed to load intelligence case list:', err);
      setIntelError('Could not reach backend API to load cases. Please verify backend is running.');
    }
  }

  useEffect(() => {
    loadIntelCaseList();
  }, []);

  useEffect(() => {
    if (graphMode === 'intelligence' && selectedIntelCaseId) {
      loadIntelGraph();
    }
  }, [graphMode, selectedIntelCaseId, intelDepth]);

  async function loadIntelGraph() {
    if (!selectedIntelCaseId) return;
    try {
      setIntelLoading(true);
      setIntelError(null);
      const res = await fetchCaseIntelligenceGraph(selectedIntelCaseId, intelDepth);
      setIntelGraphResponse(res);
      setSelectedTimelineEventId(null);
    } catch (err: any) {
      console.error('Failed to load case intelligence graph:', err);
      setIntelError(`Failed to load intelligence graph for ${selectedIntelCaseId}.`);
    } finally {
      setIntelLoading(false);
    }
  }

  const activeCaseSummary = intelGraphResponse?.case;
  const counts = activeCaseSummary?.counts || {
    persons: 0,
    locations: 0,
    weapons: 0,
    vehicles: 0,
    objects: 0,
    events: 0,
    evidence: 0,
  };

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Header & Graph Mode Navigation (Section 3) */}
      <div
        className="page-header"
        style={{
          marginBottom: '20px',
          alignItems: 'center',
          gap: '20px',
          paddingTop: '4px',
        }}
      >
        <div style={{ flex: 1, minWidth: '320px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-muted)',
              }}
            >
              Graph Explorer
            </span>
          </div>
          <h1 className="page-title" style={{ margin: 0 }}>
            <Share2 size={24} color="#0284c7" />
            <span>
              {graphMode === 'network'
                ? 'Case Relationship Network'
                : 'Case Intelligence & Entity Graph'}
            </span>
          </h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
            {graphMode === 'network'
              ? 'Explore multi-signal relationships between multiple crime cases (40,160 real records).'
              : 'Explore people, locations, objects, weapons, vehicles, evidence and events within an individual case.'}
          </p>
        </div>

        {/* Prominent Mode Switcher Tabs */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: '#e2e8f0',
            padding: '4px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setGraphMode('network')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: graphMode === 'network' ? 700 : 500,
              backgroundColor: graphMode === 'network' ? '#ffffff' : 'transparent',
              color: graphMode === 'network' ? '#0284c7' : '#475569',
              boxShadow: graphMode === 'network' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Network size={16} />
            <span>Case Network</span>
          </button>

          <button
            onClick={() => setGraphMode('intelligence')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: graphMode === 'intelligence' ? 700 : 500,
              backgroundColor: graphMode === 'intelligence' ? '#ffffff' : 'transparent',
              color: graphMode === 'intelligence' ? '#0284c7' : '#475569',
              boxShadow: graphMode === 'intelligence' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Fingerprint size={16} />
            <span>Case Intelligence</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MODE 1: CASE NETWORK (EXISTING GRAPH 1 - UNCHANGED AND PRESERVED)
         ========================================================================= */}
      {graphMode === 'network' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Controls Bar */}
          <div
            className="glass-panel"
            style={{
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Center Case Search Input */}
              <form onSubmit={handleNetworkSearch} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Center Case:</span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. IND-CASE-00001"
                  value={networkSearchFilter || networkCenterId}
                  onChange={(e) => setNetworkSearchFilter(e.target.value)}
                  style={{ width: '160px', fontFamily: 'var(--font-mono)', fontSize: '12px', padding: '5px 8px' }}
                />
                <button type="submit" className="btn btn-secondary" style={{ padding: '5px 9px', fontSize: '11px' }}>
                  <Search size={12} />
                </button>
              </form>

              {/* Quick Dropdown */}
              {availableNetworkCases.length > 0 && (
                <select
                  className="form-input"
                  value={networkCenterId}
                  onChange={(e) => {
                    setNetworkCenterId(e.target.value);
                    setNetworkSearchFilter(e.target.value);
                  }}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', padding: '5px 8px' }}
                >
                  {availableNetworkCases.map((cid) => (
                    <option key={cid} value={cid}>
                      {cid}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={loadNetworkGraph}
                className="btn btn-secondary"
                style={{ padding: '6px 12px' }}
                title="Refresh Graph"
              >
                <RefreshCw size={13} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Graph Canvas */}
          {networkLoading ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '640px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-accent)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Constructing incident ego-subgraph and projecting dimensional relationships...
            </div>
          ) : (
            <GraphViewer
              data={networkGraphData}
              centerNodeId={networkCenterId}
              onSelectCase={onSelectCase}
              minConfidence={minConfidence}
              onConfidenceChange={setMinConfidence}
              height="680px"
            />
          )}

          {/* Legend */}
          <div
            className="glass-panel"
            style={{
              padding: '16px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '20px',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', fontSize: '12px' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Case Network Dimensions:
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6366f1' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#6366f1', borderRadius: '3px' }} /> Case Incident
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '50%' }} /> City / Jurisdiction
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#06b6d4' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#06b6d4', borderRadius: '3px' }} /> Crime Code / Type
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0ea5e9' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#0ea5e9', borderRadius: '3px' }} /> Crime Domain
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8b5cf6' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#8b5cf6', borderRadius: '50%' }} /> Weapon Category
              </span>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Dataset: 40,160 Cleaned Real Cases • Multi-Case Relationship Engine
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODE 2: CASE INTELLIGENCE GRAPH (NEW GRAPH 2 - ENTITY LEVEL FOR ONE CASE)
         ========================================================================= */}
      {graphMode === 'intelligence' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* IMPORTANT DEMO DATA BANNER (Section 25) */}
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  backgroundColor: '#f59e0b',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  letterSpacing: '0.05em',
                }}
              >
                DEMO DATA
              </div>
              <span style={{ fontSize: '12px', color: '#92400e', fontWeight: 600 }}>
                Synthetic case records for entity-graph demonstration.
              </span>
              <span style={{ fontSize: '12px', color: '#b45309' }}>
                Simulates output produced by future document upload & entity extraction pipeline (FIR/Case Report PDF → Text Extraction → Entity Recognition → Structured Graph).
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#b45309', fontFamily: 'var(--font-mono)' }}>
              15 Synthetic Cases
            </div>
          </div>

          {/* Primary Controls & Case Selector (Section 4, 20, 21) */}
          <div
            className="glass-panel"
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            {/* Left: Case Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Select Case:
              </span>
              <select
                className="form-input"
                value={selectedIntelCaseId}
                onChange={(e) => setSelectedIntelCaseId(e.target.value)}
                style={{
                  minWidth: '280px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '6px 10px',
                  border: '1.5px solid #0284c7',
                }}
              >
                {intelCases.length === 0 ? (
                  <option value="">{intelLoading ? 'Loading 15 cases...' : 'No cases loaded'}</option>
                ) : (
                  intelCases.map((c) => (
                    <option key={c.case_id} value={c.case_id}>
                      {c.case_id} — {c.crime_type} ({c.severity})
                    </option>
                  ))
                )}
              </select>
              {intelCases.length === 0 && (
                <button
                  type="button"
                  onClick={loadIntelCaseList}
                  className="btn btn-secondary"
                  style={{ padding: '5px 9px', fontSize: '11px' }}
                >
                  Reload
                </button>
              )}
            </div>

            {/* Middle: Search within case (Section 21) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={14}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search this case (e.g. knife, Nitin)..."
                  value={intelSearchTerm}
                  onChange={(e) => setIntelSearchTerm(e.target.value)}
                  style={{
                    paddingLeft: '30px',
                    width: '260px',
                    fontSize: '12px',
                    paddingTop: '6px',
                    paddingBottom: '6px',
                  }}
                />
              </div>
              {intelSearchTerm && (
                <button
                  onClick={() => setIntelSearchTerm('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Right: Depth Control (Section 20) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Graph Depth:
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '6px',
                  padding: '2px',
                }}
              >
                {(
                  [
                    { id: 'direct', label: 'Direct only' },
                    { id: 'two_levels', label: '2 levels' },
                    { id: 'full', label: 'Full case network' },
                  ] as const
                ).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setIntelDepth(d.id)}
                    style={{
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: intelDepth === d.id ? 700 : 500,
                      backgroundColor: intelDepth === d.id ? '#ffffff' : 'transparent',
                      color: intelDepth === d.id ? '#0284c7' : 'var(--text-secondary)',
                      boxShadow: intelDepth === d.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <button
                onClick={loadIntelGraph}
                className="btn btn-secondary"
                style={{ padding: '6px 12px' }}
                title="Reload graph"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          </div>

          {/* Case Summary Bar & Entity Counts (Section 17 & 18) */}
          {activeCaseSummary && (
            <div
              className="glass-panel"
              style={{
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                backgroundColor: '#ffffff',
              }}
            >
              {/* Row 1: Case Incident Highlights */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Case:
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#0284c7', fontSize: '14px' }}>
                      {activeCaseSummary.case_id}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Crime:
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
                      {activeCaseSummary.crime_type}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Status:
                    </span>
                    <span
                      style={{
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                      }}
                    >
                      {activeCaseSummary.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Severity:
                    </span>
                    <span
                      style={{
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor:
                          activeCaseSummary.severity.toLowerCase() === 'critical'
                            ? '#fee2e2'
                            : '#fef3c7',
                        color:
                          activeCaseSummary.severity.toLowerCase() === 'critical'
                            ? '#991b1b'
                            : '#92400e',
                      }}
                    >
                      {activeCaseSummary.severity}
                    </span>
                  </div>

                  {activeCaseSummary.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#475569' }}>
                      <MapPin size={13} color="#10b981" />
                      <span>{activeCaseSummary.location}</span>
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Unit: {activeCaseSummary.investigating_unit || 'Crime Investigation Unit'}
                </div>
              </div>

              {/* Row 2: Entity Statistics & Filter Checkboxes (Section 18 & 19) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Filter Entities:
                  </span>

                  {/* People */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 8px',
                      borderRadius: '5px',
                      backgroundColor: activeEntityTypes.PERSON ? '#f0fdf4' : '#f8fafc',
                      border: activeEntityTypes.PERSON ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: activeEntityTypes.PERSON ? '#166534' : 'var(--text-muted)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={activeEntityTypes.PERSON}
                      onChange={() => toggleEntityType('PERSON')}
                      style={{ cursor: 'pointer' }}
                    />
                    <User size={12} color="#059669" />
                    <span>People ({counts.persons})</span>
                  </label>

                  {/* Locations */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 8px',
                      borderRadius: '5px',
                      backgroundColor: activeEntityTypes.LOCATION ? '#ecfdf5' : '#f8fafc',
                      border: activeEntityTypes.LOCATION ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: activeEntityTypes.LOCATION ? '#065f46' : 'var(--text-muted)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={activeEntityTypes.LOCATION}
                      onChange={() => toggleEntityType('LOCATION')}
                      style={{ cursor: 'pointer' }}
                    />
                    <MapPin size={12} color="#10b981" />
                    <span>Locations ({counts.locations})</span>
                  </label>

                  {/* Weapons */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 8px',
                      borderRadius: '5px',
                      backgroundColor: activeEntityTypes.WEAPON ? '#fef2f2' : '#f8fafc',
                      border: activeEntityTypes.WEAPON ? '1px solid #fecaca' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: activeEntityTypes.WEAPON ? '#991b1b' : 'var(--text-muted)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={activeEntityTypes.WEAPON}
                      onChange={() => toggleEntityType('WEAPON')}
                      style={{ cursor: 'pointer' }}
                    />
                    <Shield size={12} color="#dc2626" />
                    <span>Weapons ({counts.weapons})</span>
                  </label>

                  {/* Vehicles */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 8px',
                      borderRadius: '5px',
                      backgroundColor: activeEntityTypes.VEHICLE ? '#fff7ed' : '#f8fafc',
                      border: activeEntityTypes.VEHICLE ? '1px solid #fed7aa' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: activeEntityTypes.VEHICLE ? '#9a3412' : 'var(--text-muted)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={activeEntityTypes.VEHICLE}
                      onChange={() => toggleEntityType('VEHICLE')}
                      style={{ cursor: 'pointer' }}
                    />
                    <Car size={12} color="#ea580c" />
                    <span>Vehicles ({counts.vehicles})</span>
                  </label>

                  {/* Objects */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 8px',
                      borderRadius: '5px',
                      backgroundColor: activeEntityTypes.OBJECT ? '#eef2ff' : '#f8fafc',
                      border: activeEntityTypes.OBJECT ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: activeEntityTypes.OBJECT ? '#3730a3' : 'var(--text-muted)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={activeEntityTypes.OBJECT}
                      onChange={() => toggleEntityType('OBJECT')}
                      style={{ cursor: 'pointer' }}
                    />
                    <Package size={12} color="#4f46e5" />
                    <span>Objects ({counts.objects})</span>
                  </label>

                  {/* Events */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 8px',
                      borderRadius: '5px',
                      backgroundColor: activeEntityTypes.EVENT ? '#faf5ff' : '#f8fafc',
                      border: activeEntityTypes.EVENT ? '1px solid #e9d5ff' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: activeEntityTypes.EVENT ? '#6b21a8' : 'var(--text-muted)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={activeEntityTypes.EVENT}
                      onChange={() => toggleEntityType('EVENT')}
                      style={{ cursor: 'pointer' }}
                    />
                    <Calendar size={12} color="#7c3aed" />
                    <span>Events ({counts.events})</span>
                  </label>

                  {/* Evidence */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 8px',
                      borderRadius: '5px',
                      backgroundColor: activeEntityTypes.EVIDENCE ? '#fffbeb' : '#f8fafc',
                      border: activeEntityTypes.EVIDENCE ? '1px solid #fef3c7' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: activeEntityTypes.EVIDENCE ? '#92400e' : 'var(--text-muted)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={activeEntityTypes.EVIDENCE}
                      onChange={() => toggleEntityType('EVIDENCE')}
                      style={{ cursor: 'pointer' }}
                    />
                    <FileText size={12} color="#d97706" />
                    <span>Evidence ({counts.evidence})</span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setIsTimelineCollapsed(!isTimelineCollapsed)}
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '11px' }}
                  >
                    <Clock size={12} />
                    <span>{isTimelineCollapsed ? 'Show Timeline' : 'Hide Timeline'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Split View: Graph Canvas (Left) + Synchronized Timeline Panel (Right) */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              height: '680px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
            }}
          >
            {intelLoading ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: 'var(--text-accent)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Constructing case entity intelligence graph for {selectedIntelCaseId}...
              </div>
            ) : intelGraphResponse ? (
              <>
                {/* Left: Cytoscape Graph Canvas */}
                <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                  <CaseIntelligenceGraphViewer
                    nodes={intelGraphResponse.nodes}
                    edges={intelGraphResponse.edges}
                    caseId={selectedIntelCaseId}
                    selectedEventId={selectedTimelineEventId}
                    onSelectEvent={(id) => setSelectedTimelineEventId(id)}
                    searchTerm={intelSearchTerm}
                    activeTypes={activeEntityTypes}
                    height="100%"
                  />
                </div>

                {/* Right: Chronological Incident Timeline Panel (Section 13) */}
                <CaseTimelinePanel
                  timeline={intelGraphResponse.timeline}
                  selectedEventId={selectedTimelineEventId}
                  onSelectEvent={(eventId) => setSelectedTimelineEventId(eventId)}
                  isCollapsed={isTimelineCollapsed}
                  onToggleCollapse={() => setIsTimelineCollapsed(!isTimelineCollapsed)}
                />
              </>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                Select an intelligence case to load graph.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
