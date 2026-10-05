import React, { useEffect, useState } from 'react';
import {
  FileText,
  Calendar,
  MapPin,
  Users,
  Car,
  Share2,
  Clock,
  ArrowLeft,
  Tag,
  Network,
} from 'lucide-react';
import { CaseDetailResponse } from '../types/case';
import { RelationshipExplanation, CaseIntelligenceSummary, NextSignal } from '../types/relationship';
import { GraphData } from '../types/graph';
import {
  fetchCaseDetail,
  fetchCaseRelationships,
  fetchCaseGraph,
  fetchCaseIntelligenceSummary,
  fetchNextSignals
} from '../services/api';
import { RelationshipCard } from '../components/RelationshipCard';
import { Timeline } from '../components/Timeline';
import { EvidencePanel } from '../components/EvidencePanel';
import { GraphViewer } from '../components/GraphViewer';
import { RelationshipDetailModal } from '../components/RelationshipDetailModal';
import { Sparkles, Compass, AlertTriangle, ShieldCheck } from 'lucide-react';

interface CaseDetailsProps {
  caseId: string;
  onBack: () => void;
  onSelectCase: (caseId: string) => void;
}

export const CaseDetails: React.FC<CaseDetailsProps> = ({
  caseId,
  onBack,
  onSelectCase,
}) => {
  const [detail, setDetail] = useState<CaseDetailResponse | null>(null);
  const [relationships, setRelationships] = useState<RelationshipExplanation[]>([]);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [intelSummary, setIntelSummary] = useState<CaseIntelligenceSummary | null>(null);
  const [nextSignals, setNextSignals] = useState<NextSignal[]>([]);
  const [selectedRelForModal, setSelectedRelForModal] = useState<RelationshipExplanation | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'relationships' | 'graph' | 'timeline'>('overview');
  const [minConfidence, setMinConfidence] = useState(0.30);
  const [graphDepth, setGraphDepth] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [detailData, relsData, graphRes, intelData, signalsData] = await Promise.all([
          fetchCaseDetail(caseId),
          fetchCaseRelationships(caseId, minConfidence),
          fetchCaseGraph(caseId, graphDepth, minConfidence),
          fetchCaseIntelligenceSummary(caseId).catch(() => null),
          fetchNextSignals(caseId).catch(() => []),
        ]);
        setDetail(detailData);
        setRelationships(relsData);
        setGraphData(graphRes);
        setIntelSummary(intelData);
        setNextSignals(signalsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [caseId, minConfidence, graphDepth]);

  if (loading || !detail) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>
          Retrieving complete case dossier and relationship graph for {caseId}...
        </div>
      </div>
    );
  }

  const { case: caseData, enriched_people, enriched_locations, enriched_vehicles } = detail;
  const sev = (caseData.severity || 'medium').toLowerCase();

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Back button & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <button
          onClick={onBack}
          className="btn btn-ghost"
          style={{ padding: '4px 8px', fontSize: '12px' }}
        >
          <ArrowLeft size={14} />
          <span>Back to Case Catalog</span>
        </button>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-cyan)' }}>
          {caseData.case_id}
        </span>
      </div>

      {/* Case Dossier Banner */}
      <div className="glass-panel" style={{ padding: '22px', marginBottom: '20px', borderLeft: '4px solid var(--accent-cyan)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {caseData.case_id}
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: '#e0f2fe',
                color: '#0369a1',
                border: '1px solid #bae6fd',
              }}>
                {caseData.case_type.replace(/_/g, ' ')}
              </span>
              <span className={`badge badge-${sev}`}>
                {sev}
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={14} color="var(--accent-cyan)" />
                Incident Date: <strong style={{ color: 'var(--text-primary)' }}>{caseData.incident_date || 'N/A'}</strong>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={14} color="var(--text-muted)" />
                Time: {caseData.incident_time_range || 'N/A'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FileText size={14} color="var(--text-muted)" />
                Reported: {caseData.reported_date || 'N/A'}
              </span>
              <span style={{ textTransform: 'capitalize' }}>
                Status: <strong style={{ color: 'var(--text-primary)' }}>{caseData.status.replace(/_/g, ' ')}</strong>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#e0f2fe',
              border: '1px solid #bae6fd',
              color: '#0369a1',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '13px',
            }}>
              <Share2 size={14} />
              <span>{relationships.length} Discovered Links</span>
            </span>
          </div>
        </div>

        {/* Summary */}
        <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '14px' }}>
          {caseData.summary}
        </p>

        {/* Modus Operandi & Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          {caseData.modus_operandi && caseData.modus_operandi.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Modus Operandi:
              </span>
              {caseData.modus_operandi.map((mo, i) => (
                <span key={i} style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  backgroundColor: '#fce7f3',
                  border: '1px solid #fbcfe8',
                  color: '#be185d',
                }}>
                  {mo}
                </span>
              ))}
            </div>
          )}

          {caseData.tags && caseData.tags.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <Tag size={12} color="var(--text-muted)" />
              {caseData.tags.map((t, i) => (
                <span key={i} style={{
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#f1f5f9',
                  color: 'var(--text-secondary)',
                }}>
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Case Intelligence Executive Summary */}
      {intelSummary && (
        <div className="glass-panel" style={{ padding: '18px 20px', marginBottom: '20px', borderLeft: '4px solid var(--accent-indigo)', backgroundColor: '#fafafa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--accent-indigo)" />
              <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                Case Intelligence Summary
              </h3>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Dynamic Multi-Factor Evidence Synthesis
            </span>
          </div>

          {/* Metric Tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '14px' }}>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px 12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Related Cases</div>
              <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {intelSummary.related_cases_count}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px 12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>High Confidence (≥70%)</div>
              <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
                {intelSummary.high_confidence_count}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px 12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Recurring Entities</div>
              <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>
                {intelSummary.recurring_entities_count}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px 12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Behaviour Patterns</div>
              <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                {intelSummary.detected_patterns_count}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px 12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Potential Anomalies</div>
              <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-rose)' }}>
                {intelSummary.potential_anomalies_count}
              </div>
            </div>
          </div>

          {/* Most Significant Relationship */}
          {intelSummary.most_significant_relationship && (
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              padding: '10px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
            }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: '2px' }}>
                  ★ Most Significant Correlated Case
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => onSelectCase(intelSummary.most_significant_relationship!.case_id)}
                    className="btn btn-ghost"
                    style={{ padding: 0, fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#15803d' }}
                  >
                    {intelSummary.most_significant_relationship.case_id}
                  </button>
                  <span style={{ fontSize: '12px', color: '#166534' }}>
                    • Confidence: <strong>{(intelSummary.most_significant_relationship.confidence * 100).toFixed(0)}%</strong> ({intelSummary.most_significant_relationship.category})
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#14532d', marginTop: '2px' }}>
                  Rationale: {intelSummary.most_significant_relationship.reason}
                </div>
              </div>

              <button
                onClick={() => onSelectCase(intelSummary.most_significant_relationship!.case_id)}
                className="btn btn-secondary"
                style={{ fontSize: '11.5px', padding: '4px 10px' }}
              >
                Inspect Linked Dossier →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tabs navigation */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '18px' }}>
        {[
          { id: 'overview', label: 'Involved Entities & Evidence', icon: Users },
          { id: 'relationships', label: `Ranked Related Cases (${relationships.length})`, icon: Share2 },
          { id: 'graph', label: 'Interactive Ego Subgraph', icon: Network },
          { id: 'timeline', label: `Chronological Timeline (${caseData.events.length})`, icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 14px',
                border: 'none',
                background: 'transparent',
                borderBottom: isActive ? '2px solid #0284c7' : '2px solid transparent',
                color: isActive ? '#0284c7' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Entities & Evidence */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* People Grid */}
          <div className="glass-panel" style={{ padding: '18px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-person)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Users size={15} /> Persons Involved ({enriched_people.length})
            </h3>
            {enriched_people.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>No persons documented</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                {enriched_people.map(({ person, role }) => (
                  <div key={person.person_id} style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                        {person.name}
                      </span>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d', fontFamily: 'var(--font-mono)' }}>
                        {role}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '5px' }}>
                      ID: {person.person_id}
                    </div>
                    {person.occupation && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Occupation: {person.occupation}
                      </div>
                    )}
                    {person.aliases?.length > 0 && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                        Aliases: {person.aliases.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Locations & Vehicles Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {/* Locations */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-location)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} /> Associated Locations ({enriched_locations.length})
              </h3>
              {enriched_locations.map(({ location, role }) => (
                <div key={location.location_id} style={{ padding: '9px 10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-subtle)', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
                      {location.name}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{role}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {location.city}, {location.state} • Coordinates: {location.latitude}, {location.longitude}
                  </div>
                </div>
              ))}
            </div>

            {/* Vehicles */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-vehicle)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Car size={14} /> Associated Vehicles ({enriched_vehicles.length})
              </h3>
              {enriched_vehicles.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>No vehicles registered in case</div>
              ) : (
                enriched_vehicles.map(({ vehicle, role }) => (
                  <div key={vehicle.vehicle_id} style={{ padding: '9px 10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-subtle)', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-vehicle)', fontSize: '12.5px' }}>
                        {vehicle.registration || vehicle.vehicle_id}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{role}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {vehicle.color} {vehicle.type} • Owner: {vehicle.owner_person_id || 'Unknown'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Evidence and Witnesses */}
          <EvidencePanel
            evidence={caseData.evidence}
            witnesses={caseData.witnesses}
          />
        </div>
      )}

      {/* Tab 2: Ranked Discovered Relationships */}
      {activeTab === 'relationships' && (
        <div>
          {/* Potential Next Investigative Signals (Probabilistic, section 20) */}
          {nextSignals && nextSignals.length > 0 && (
            <div className="glass-panel" style={{ padding: '16px 18px', marginBottom: '18px', backgroundColor: '#f0fdfa', border: '1px solid #ccfbf1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Compass size={16} color="var(--accent-cyan)" />
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                  Potential Next Investigative Signals (Probabilistic)
                </h4>
              </div>
              <p style={{ fontSize: '12px', color: '#115e59', marginBottom: '10px', lineHeight: 1.4 }}>
                Statistical patterns surfaced across historical cases sharing this incident's modus operandi, transition chain, and geography. Not a prediction of future events.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                {nextSignals.map((sig) => (
                  <div key={sig.signal_id} style={{ backgroundColor: '#ffffff', border: '1px solid #99f6e4', borderRadius: '6px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0d9488' }}>
                        {sig.signal_type.replace(/_/g, ' ')}
                      </span>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0f766e', backgroundColor: '#ccfbf1', padding: '1px 6px', borderRadius: '4px' }}>
                        {(sig.confidence * 100).toFixed(0)}% Likelihood
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
                      Candidate Target: {sig.target_value}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {sig.reason}
                    </div>
                    {sig.historical_support_cases && sig.historical_support_cases.length > 0 && (
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                        Historical Support: {sig.historical_support_cases.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Showing <strong>{relationships.length}</strong> correlated relationships discovered through cross-incident reasoning.
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Confidence Filter:</span>
              <select
                className="form-input"
                value={minConfidence}
                onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                style={{ padding: '4px 8px' }}
              >
                <option value={0.85}>Very High Confidence (≥ 85%)</option>
                <option value={0.70}>High & Above (≥ 70%)</option>
                <option value={0.50}>Moderate & Above (≥ 50%)</option>
                <option value={0.30}>All Discovered Links (≥ 30%)</option>
              </select>
            </div>
          </div>

          {relationships.length === 0 ? (
            <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No relationships discovered meeting confidence threshold {(minConfidence * 100).toFixed(0)}%.
            </div>
          ) : (
            <div>
              {relationships.map((rel) => (
                <RelationshipCard
                  key={rel.relationship_id}
                  relationship={rel}
                  currentCaseId={caseId}
                  onSelectCase={onSelectCase}
                  onExploreGraph={() => {
                    setActiveTab('graph');
                  }}
                  onInspectRelationship={(r) => setSelectedRelForModal(r)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Interactive Ego Subgraph */}
      {activeTab === 'graph' && graphData && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Focal ego graph around <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{caseId}</strong>.
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Exploration Depth:</span>
              <button
                onClick={() => setGraphDepth(1)}
                className={`btn ${graphDepth === 1 ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '11px', padding: '4px 10px' }}
              >
                1st Degree (Direct)
              </button>
              <button
                onClick={() => setGraphDepth(2)}
                className={`btn ${graphDepth === 2 ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '11px', padding: '4px 10px' }}
              >
                2nd Degree (Multi-hop)
              </button>
            </div>
          </div>

          <GraphViewer
            data={graphData}
            centerNodeId={caseId}
            onSelectCase={onSelectCase}
            minConfidence={minConfidence}
            onConfidenceChange={setMinConfidence}
            height="620px"
          />
        </div>
      )}

      {/* Tab 4: Chronological Timeline */}
      {activeTab === 'timeline' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
            Incident Sequence Timeline
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Chronological log of verified events, sightings, and transitions.
          </p>
          <Timeline events={caseData.events} />
        </div>
      )}

      {/* Detail & Diagnostics Modal */}
      {selectedRelForModal && (
        <RelationshipDetailModal
          relationship={selectedRelForModal}
          onClose={() => setSelectedRelForModal(null)}
          onSelectCase={onSelectCase}
        />
      )}
    </div>
  );
};
