import React, { useEffect, useState } from 'react';
import {
  FileText,
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
  Share2,
  Network,
  Shield,
  Crosshair,
  UserCheck,
  Building,
  CheckCircle2,
  Clock3,
  Sparkles,
  Info,
} from 'lucide-react';
import { CaseDetailResponse } from '../types/case';
import { RelationshipExplanation } from '../types/relationship';
import { GraphData } from '../types/graph';
import {
  fetchCaseDetail,
  fetchCaseRelationships,
  fetchCaseGraph,
} from '../services/api';
import { RelationshipCard } from '../components/RelationshipCard';
import { GraphViewer } from '../components/GraphViewer';
import { RelationshipDetailModal } from '../components/RelationshipDetailModal';
import { RelationshipDetailDrawer } from '../components/RelationshipDetailDrawer';

interface CaseDetailsProps {
  caseId: string;
  onBack: () => void;
  onSelectCase: (caseId: string) => void;
  onExploreGraph?: (caseId: string) => void;
}

export const CaseDetails: React.FC<CaseDetailsProps> = ({
  caseId,
  onBack,
  onSelectCase,
  onExploreGraph,
}) => {
  const [detail, setDetail] = useState<CaseDetailResponse | null>(null);
  const [relationships, setRelationships] = useState<RelationshipExplanation[]>([]);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedRelForModal, setSelectedRelForModal] = useState<RelationshipExplanation | null>(null);
  const [investigationPair, setInvestigationPair] = useState<{
    sourceId: string | null;
    targetId: string | null;
    isOpen: boolean;
  }>({ sourceId: null, targetId: null, isOpen: false });
  const [activeTab, setActiveTab] = useState<'overview' | 'relationships' | 'graph' | 'temporal'>('overview');
  const [minConfidence, setMinConfidence] = useState(0.25);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [detailData, relsData, graphRes] = await Promise.all([
          fetchCaseDetail(caseId),
          fetchCaseRelationships(caseId, minConfidence),
          fetchCaseGraph(caseId, 12, minConfidence),
        ]);
        setDetail(detailData);
        setRelationships(relsData);
        setGraphData(graphRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [caseId, minConfidence]);

  if (loading || !detail) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>
          Retrieving incident dossier and relationship graph for {caseId}...
        </div>
      </div>
    );
  }

  const { case: c } = detail;
  const isClosed = c.investigation.case_closed;
  const sev = isClosed ? 'low' : 'high';

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
          {c.case_id}
        </span>
      </div>

      {/* Case Dossier Banner */}
      <div className="glass-panel" style={{ padding: '22px', marginBottom: '20px', borderLeft: '4px solid var(--accent-cyan)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', margin: 0 }}>
                {c.case_id}
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: '#e0f2fe',
                color: '#0369a1',
                border: '1px solid #bae6fd',
              }}>
                {c.incident.crime_domain}
              </span>
              <span className={`badge badge-${sev}`}>
                {isClosed ? 'Closed Case' : 'Under Investigation'}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: isClosed ? '#dcfce7' : '#fef9c3',
                color: isClosed ? '#15803d' : '#854d0e',
                border: isClosed ? '1px solid #bbf7d0' : '1px solid #fef08a',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                {isClosed ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}
                {isClosed ? 'Case Closed' : 'Under Investigation'}
              </span>
            </div>

            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {c.incident.crime_description} <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 400 }}>(Code {c.incident.crime_code})</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={14} color="var(--accent-emerald)" />
                City: <strong style={{ color: 'var(--text-primary)' }}>{c.location.city}</strong>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={14} color="var(--accent-cyan)" />
                Reported: <strong style={{ color: 'var(--text-primary)' }}>{c.incident.date_reported || 'N/A'}</strong>
              </span>
              {c.incident.time_of_occurrence && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={14} color="var(--text-muted)" />
                  Occurrence: {c.incident.time_of_occurrence}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Crosshair size={14} color="var(--accent-purple)" />
                Weapon: <strong style={{ color: 'var(--text-primary)' }}>{c.weapon.used || 'Unspecified'}</strong>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              backgroundColor: '#e0f2fe',
              border: '1px solid #bae6fd',
              color: '#0369a1',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '13px',
            }}>
              <Share2 size={15} />
              <span>{relationships.length} Similar Incident Profiles</span>
            </span>
          </div>
        </div>

        {/* Semantic Profile representation */}
        {c.derived_features.semantic_text && (
          <div style={{
            fontSize: '12.5px',
            color: 'var(--text-secondary)',
            backgroundColor: '#f8fafc',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '10px 14px',
            fontFamily: 'var(--font-sans)',
            marginTop: '10px',
          }}>
            <strong style={{ color: 'var(--text-primary)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.04em' }}>
              Structured Incident Profile:
            </strong>{' '}
            {c.derived_features.semantic_text}
          </div>
        )}
      </div>

      {/* Case Intelligence Summary */}
      {relationships.length > 0 && (
        <div className="glass-panel" style={{ padding: '18px 20px', marginBottom: '20px', borderLeft: '4px solid var(--accent-indigo)', backgroundColor: '#fafafa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--accent-indigo)" />
              <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                Incident Profile Intelligence Summary
              </h3>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Empirical Multi-Dimensional Discovery
            </span>
          </div>

          {/* Metric Tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '14px' }}>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px 12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Correlated Cases</div>
              <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {relationships.length}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px 12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>High Match (≥60%)</div>
              <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
                {relationships.filter(r => r.confidence >= 0.60).length}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px 12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active City Cases</div>
              <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                {relationships.filter(r => (r.score_breakdown?.same_city || 0) > 0).length}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px 12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Weapon Matches</div>
              <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)' }}>
                {relationships.filter(r => (r.score_breakdown?.weapon_match || 0) > 0).length}
              </div>
            </div>
          </div>

          {/* Most Significant Relationship */}
          {relationships[0] && (
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
                  ★ Strongest Correlated Incident Profile
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => onSelectCase(relationships[0].target_case === c.case_id ? relationships[0].source_case : relationships[0].target_case)}
                    className="btn btn-ghost"
                    style={{ padding: 0, fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#15803d' }}
                  >
                    {relationships[0].target_case === c.case_id ? relationships[0].source_case : relationships[0].target_case}
                  </button>
                  <span style={{ fontSize: '12px', color: '#166534' }}>
                    • Similarity: <strong>{(relationships[0].confidence * 100).toFixed(0)}%</strong> ({relationships[0].category})
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#14532d', marginTop: '2px' }}>
                  Evidence: {relationships[0].evidence.join('; ')}
                </div>
              </div>

              <button
                onClick={() => onSelectCase(relationships[0].target_case === c.case_id ? relationships[0].source_case : relationships[0].target_case)}
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
          { id: 'overview', label: 'Incident Profile & Disposition', icon: FileText },
          { id: 'relationships', label: `Similar Incident Profiles (${relationships.length})`, icon: Share2 },
          { id: 'graph', label: 'Incident Ego Subgraph', icon: Network },
          { id: 'temporal', label: 'Temporal & Reporting Metrics', icon: Clock },
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

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Grid of structured incident dimensions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {/* Statutory Crime Classification */}
            <div className="glass-panel" style={{ padding: '18px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Shield size={16} /> Statutory Crime Classification
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Crime Code</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{c.incident.crime_code}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Crime Description</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>{c.incident.crime_description}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Crime Domain</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#0369a1', backgroundColor: '#e0f2fe', padding: '2px 8px', borderRadius: '4px' }}>
                    {c.incident.crime_domain}
                  </span>
                </div>
              </div>
            </div>

            {/* Jurisdiction & Municipal Location */}
            <div className="glass-panel" style={{ padding: '18px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Building size={16} /> Jurisdiction & Location
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>City</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{c.location.city}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Jurisdiction</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.location.city} Municipal District</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Police Deployed</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {c.investigation.police_deployed !== null && c.investigation.police_deployed !== undefined ? `${c.investigation.police_deployed} officers` : 'Standard Patrol'}
                  </span>
                </div>
              </div>
            </div>

            {/* Victim & Weapon Profile */}
            <div className="glass-panel" style={{ padding: '18px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <UserCheck size={16} /> Victim Demographic & Weapon
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Victim Gender</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{c.victim.gender || 'Unspecified'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Victim Age</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {c.victim.age ? `${c.victim.age} years (${c.victim.age_band})` : 'Unspecified'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Weapon Used</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#9333ea' }}>{c.weapon.used || 'Unspecified / None recorded'}</span>
                </div>
              </div>
            </div>

            {/* Investigation Disposition */}
            <div className="glass-panel" style={{ padding: '18px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: isClosed ? 'var(--accent-emerald)' : 'var(--accent-amber)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                {isClosed ? <CheckCircle2 size={16} /> : <Clock3 size={16} />} Investigation Disposition
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current Status</span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: isClosed ? '#15803d' : '#854d0e',
                    backgroundColor: isClosed ? '#dcfce7' : '#fef9c3',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {isClosed ? 'Case Closed' : 'Under Active Investigation'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Date Case Closed</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {c.investigation.date_case_closed || 'Pending Resolution'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Closure Duration</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {c.investigation.closure_duration_days !== null && c.investigation.closure_duration_days !== undefined
                      ? `${c.investigation.closure_duration_days} days`
                      : 'N/A (Open Case)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dataset Provenance & Integrity Statement */}
          <div className="glass-panel" style={{ padding: '16px 20px', backgroundColor: '#f8fafc', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Info size={15} color="var(--accent-cyan)" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Data Source Provenance & Integrity
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <div>Dataset: <strong style={{ color: 'var(--text-primary)' }}>{c.source.dataset}</strong></div>
              <div>Source Report Number: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{c.source.source_report_number}</strong></div>
              <div>Data Type: <strong style={{ color: 'var(--text-primary)' }}>{c.source.data_type}</strong></div>
              <div>Integrity: <strong style={{ color: '#166534' }}>Real Public Dataset Record (No synthetic entities)</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Similar Incident Profiles */}
      {activeTab === 'relationships' && (
        <div>
          {/* Controls */}
          <div className="glass-panel" style={{ padding: '14px 18px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Similarity Threshold:
              </span>
              <input
                type="range"
                min="0.10"
                max="0.90"
                step="0.05"
                value={minConfidence}
                onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                style={{ width: '130px', accentColor: '#0284c7' }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', color: '#0284c7' }}>
                {(minConfidence * 100).toFixed(0)}%
              </span>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing {relationships.length} correlated incident profiles (Ranked by combined feature similarity)
            </div>
          </div>

          {/* Relationships List */}
          {relationships.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Share2 size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                No correlated incident profiles found at this threshold
              </div>
              <div style={{ fontSize: '12px' }}>
                Lower the similarity slider to inspect broader incident profile matches across crime codes, weapons, and temporal proximity.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {relationships.map((rel) => (
                <RelationshipCard
                  key={rel.relationship_id}
                  relationship={rel}
                  currentCaseId={c.case_id}
                  onSelectCase={(targetId) => onSelectCase(targetId)}
                  onInspectRelationship={(targetRel) => setSelectedRelForModal(targetRel)}
                  onWhyRelated={(src, tgt) =>
                    setInvestigationPair({ sourceId: src, targetId: tgt, isOpen: true })
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Interactive Ego Graph */}
      {activeTab === 'graph' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="glass-panel" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Network size={16} color="var(--accent-cyan)" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Focal Case Ego Graph
              </span>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Bounded Ego Graph centered on <strong>{c.case_id}</strong> connecting real City, Crime Code, Domain, Weapon, and top correlated cases.
            </div>
          </div>

          <div style={{ height: '620px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
            <GraphViewer
              data={graphData || { nodes: [], edges: [] }}
              centerNodeId={c.case_id}
              onSelectCase={(nodeId) => onSelectCase(nodeId)}
            />
          </div>
        </div>
      )}

      {/* Tab 4: Temporal & Reporting Metrics */}
      {activeTab === 'temporal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="var(--accent-cyan)" /> Temporal Occurrence & Registration Dynamics
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Date Reported</div>
                <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {c.incident.date_reported || 'N/A'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Official police station registration</div>
              </div>

              <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Occurrence Timestamp</div>
                <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {c.incident.time_of_occurrence || 'Date recorded'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Hour: {c.derived_features.occurrence_hour !== null && c.derived_features.occurrence_hour !== undefined ? `${c.derived_features.occurrence_hour}:00` : 'Unspecified'}
                </div>
              </div>

              <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Reporting Delay (Hours)</div>
                <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: c.derived_features.report_delay_hours && c.derived_features.report_delay_hours > 720 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                  {c.derived_features.report_delay_hours !== null && c.derived_features.report_delay_hours !== undefined ? `${Math.round(c.derived_features.report_delay_hours)} hrs` : '0 hrs'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Lag between incident occurrence and official report</div>
              </div>

              <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Closure Duration</div>
                <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: isClosed ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                  {c.investigation.closure_duration_days !== null && c.investigation.closure_duration_days !== undefined ? `${c.investigation.closure_duration_days} days` : 'Active / Unresolved'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Days from report to final case closure</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', fontSize: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Day of Week: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{c.derived_features.occurrence_day_of_week || 'N/A'}</strong>
              </div>
              <div style={{ padding: '10px', backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Calendar Month: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{c.derived_features.occurrence_month_name || 'N/A'} {c.derived_features.occurrence_year || ''}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Relationship Detail Modal */}
      {selectedRelForModal && (
        <RelationshipDetailModal
          relationship={selectedRelForModal}
          onClose={() => setSelectedRelForModal(null)}
          onSelectCase={(targetId) => {
            setSelectedRelForModal(null);
            onSelectCase(targetId);
          }}
        />
      )}

      {/* Forensic Relationship Investigation Layer (Drawer) */}
      <RelationshipDetailDrawer
        sourceCaseId={investigationPair.sourceId}
        targetCaseId={investigationPair.targetId}
        isOpen={investigationPair.isOpen}
        onClose={() => setInvestigationPair((prev) => ({ ...prev, isOpen: false }))}
        onSelectCase={(targetId) => {
          setInvestigationPair((prev) => ({ ...prev, isOpen: false }));
          onSelectCase(targetId);
        }}
      />
    </div>
  );
};
