import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  ShieldAlert,
  GitCommit,
  Clock,
  MapPin,
  FileCode,
  Tag,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Layers,
  Sparkles
} from 'lucide-react';
import { RelationshipExplanation, RelationshipDebugResponse } from '../types/relationship';
import { ConfidenceBadge } from './ConfidenceBadge';
import { fetchRelationshipDebug } from '../services/api';

interface RelationshipDetailModalProps {
  relationship: RelationshipExplanation | null;
  onClose: () => void;
  onSelectCase: (caseId: string) => void;
}

export const RelationshipDetailModal: React.FC<RelationshipDetailModalProps> = ({
  relationship,
  onClose,
  onSelectCase,
}) => {
  const [debugData, setDebugData] = useState<RelationshipDebugResponse | null>(null);
  const [loadingDebug, setLoadingDebug] = useState(false);
  const [showDebugView, setShowDebugView] = useState(false);
  const [debugError, setDebugError] = useState<string | null>(null);

  useEffect(() => {
    setDebugData(null);
    setShowDebugView(false);
    setDebugError(null);
  }, [relationship]);

  if (!relationship) return null;

  const handleLoadDebug = async () => {
    if (debugData) {
      setShowDebugView(!showDebugView);
      return;
    }
    setLoadingDebug(true);
    setDebugError(null);
    try {
      const data = await fetchRelationshipDebug(relationship.source_case, relationship.target_case);
      setDebugData(data);
      setShowDebugView(true);
    } catch (err: any) {
      setDebugError(err.message || 'Failed to fetch debug metrics');
    } finally {
      setLoadingDebug(false);
    }
  };

  const bd = relationship.score_breakdown || {} as any;
  const moBd = relationship.mo_breakdown;
  const seqBd = relationship.sequence_breakdown;
  const f = relationship.features;

  const scoreMetrics = [
    { label: 'Person Overlap', val: bd.person_overlap || 0, color: 'var(--accent-emerald)' },
    { label: 'Vehicle Overlap', val: bd.vehicle_overlap || 0, color: 'var(--accent-amber)' },
    { label: 'Object / Evidence Overlap', val: bd.object_overlap || 0, color: 'var(--accent-purple)' },
    { label: 'Witness Recurrence', val: bd.witness_overlap || 0, color: '#ec4899' },
    { label: 'Location Proximity', val: bd.location_similarity || 0, color: 'var(--accent-cyan)' },
    { label: 'Temporal Decay', val: bd.temporal_similarity || 0, color: 'var(--accent-blue)' },
    { label: 'Modus Operandi', val: bd.modus_operandi_similarity || 0, color: 'var(--accent-rose)' },
    { label: 'Event Sequence Concordance', val: bd.event_sequence_similarity || 0, color: 'var(--accent-indigo)' },
    { label: 'Semantic Text Similarity', val: bd.semantic_similarity || 0, color: 'var(--text-accent)' },
    { label: 'Crime Type Alignment', val: bd.crime_type_similarity || 0, color: '#64748b' },
  ].filter(m => m.val > 0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)',
          padding: '24px',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                Multi-Signal Relationship Analysis
              </span>
              <ConfidenceBadge confidence={relationship.confidence} category={relationship.category} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => { onClose(); onSelectCase(relationship.source_case); }}
                className="btn btn-ghost"
                style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '15px', color: 'var(--accent-cyan)', padding: '2px 6px' }}
              >
                {relationship.source_case}
                <ExternalLink size={13} style={{ marginLeft: '4px' }} />
              </button>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>↔</span>
              <button
                onClick={() => { onClose(); onSelectCase(relationship.target_case); }}
                className="btn btn-ghost"
                style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '15px', color: 'var(--accent-cyan)', padding: '2px 6px' }}
              >
                {relationship.target_case}
                <ExternalLink size={13} style={{ marginLeft: '4px' }} />
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Supporting Signals & Primary Category */}
        <div style={{ marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Active Correlation Signals
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              border: '1px solid #bae6fd',
              textTransform: 'uppercase',
            }}>
              Primary: {relationship.relationship_type.replace(/_/g, ' ')}
            </span>
            {(relationship.supporting_signals || []).map((sig, idx) => (
              <span key={idx} style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: '#f1f5f9',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
              }}>
                ✓ {sig.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Structured Evidence Bullets */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={15} color="var(--accent-cyan)" />
            <span>Investigative Rationale & Evidence</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {relationship.evidence.map((ev, i) => (
              <div key={i} style={{
                fontSize: '12.5px',
                color: 'var(--text-secondary)',
                backgroundColor: '#f8fafc',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                lineHeight: 1.45,
              }}>
                • {ev}
              </div>
            ))}
          </div>
        </div>

        {/* Modus Operandi Breakdown (Matching vs Differing) */}
        {(moBd || (f && (f.mo_matching || f.mo_differing_a))) && (
          <div style={{ marginBottom: '20px', padding: '14px', backgroundColor: '#faf5ff', borderRadius: '8px', border: '1px solid #f3e8ff' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b21a8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={15} color="#7c3aed" />
              <span>Modus Operandi Breakdown (Set/Vector Concordance)</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px' }}>
              {/* Matching */}
              <div>
                <span style={{ fontWeight: 700, color: 'var(--accent-emerald)', display: 'block', marginBottom: '3px' }}>
                  Matching Techniques:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(moBd?.matching || f?.mo_matching || []).length > 0 ? (
                    (moBd?.matching || f?.mo_matching || []).map((m, i) => (
                      <span key={i} style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                        ✓ {m}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>None directly overlapping</span>
                  )}
                </div>
              </div>

              {/* Differing */}
              {(moBd?.differing_a?.length || moBd?.differing_b?.length || f?.mo_differing_a?.length || f?.mo_differing_b?.length) ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                      Distinct to {relationship.source_case}:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {(moBd?.differing_a || f?.mo_differing_a || []).map((m, i) => (
                        <span key={i} style={{ backgroundColor: '#f1f5f9', color: 'var(--text-secondary)', padding: '1px 5px', borderRadius: '3px', fontSize: '10.5px' }}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                      Distinct to {relationship.target_case}:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {(moBd?.differing_b || f?.mo_differing_b || []).map((m, i) => (
                        <span key={i} style={{ backgroundColor: '#f1f5f9', color: 'var(--text-secondary)', padding: '1px 5px', borderRadius: '3px', fontSize: '10.5px' }}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Behavioural Sequence Alignment (LCS) */}
        {(seqBd?.lcs?.length || f?.event_common_subsequence?.length) ? (
          <div style={{ marginBottom: '20px', padding: '14px', backgroundColor: '#eef2ff', borderRadius: '8px', border: '1px solid #e0e7ff' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#3730a3', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <GitCommit size={15} color="#4f46e5" />
              <span>Behavioural Event-Chain Concordance (LCS Alignment)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              {(seqBd?.lcs || f?.event_common_subsequence || []).map((step, idx, arr) => (
                <React.Fragment key={idx}>
                  <span style={{
                    backgroundColor: '#ffffff',
                    color: '#312e81',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: '1px solid #c7d2fe',
                  }}>
                    {step}
                  </span>
                  {idx < arr.length - 1 && <span style={{ color: '#818cf8', fontWeight: 800 }}>→</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : null}

        {/* Continuous Score Breakdown Meters */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={15} color="var(--accent-blue)" />
            <span>Multi-Factor Metric Contributions</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px',
            backgroundColor: '#f8fafc',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '12px',
          }}>
            {scoreMetrics.map((item, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                  <span>{item.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: item.color }}>
                    {(item.val * 100).toFixed(0)}%
                  </span>
                </div>
                <div style={{ height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, item.val * 100)}%`,
                    backgroundColor: item.color,
                    borderRadius: '2px',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Debug / Deep Dive Section */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Developer / Analyst Inspection Mode
            </div>
            <button
              onClick={handleLoadDebug}
              disabled={loadingDebug}
              className="btn btn-secondary"
              style={{ fontSize: '11.5px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FileCode size={13} color="var(--accent-cyan)" />
              <span>{loadingDebug ? 'Loading Engine State...' : showDebugView ? 'Hide Raw Debug' : 'Inspect Engine Diagnostics'}</span>
            </button>
          </div>

          {debugError && (
            <div style={{ marginTop: '8px', padding: '8px 10px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '11px', borderRadius: '4px' }}>
              {debugError}
            </div>
          )}

          {showDebugView && debugData && (
            <div style={{ marginTop: '12px', backgroundColor: '#0f172a', color: '#f8fafc', padding: '14px', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px', overflowX: 'auto' }}>
              <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '6px' }}>
                // RELATIONSHIP ENGINE INFERENCE DIAGNOSTICS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <span style={{ color: '#94a3b8' }}>Decision: </span>
                  <span style={{ color: '#4ade80', fontWeight: 700 }}>{debugData.decision}</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Calibrated Final Score: </span>
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>{debugData.final_score.toFixed(4)}</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Threshold Cutoff: </span>
                  <span>{debugData.threshold}</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Candidate Trigger Sources: </span>
                  <span>{debugData.candidate_reasons.join(', ')}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #334155', paddingTop: '8px', marginTop: '8px' }}>
                <span style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Weighted Factor Products:</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '6px' }}>
                  {Object.entries(debugData.score_breakdown).map(([k, v]) => (
                    <div key={k} style={{ fontSize: '10px', color: '#cbd5e1' }}>
                      {k}: <span style={{ color: '#38bdf8' }}>{Number(v).toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
