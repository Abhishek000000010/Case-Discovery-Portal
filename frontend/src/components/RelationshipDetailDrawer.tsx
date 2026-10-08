import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  MapPin,
  Clock,
  Calendar,
  Layers,
  Wrench,
  Users,
  Code,
  Network,
  FileText,
} from 'lucide-react';
import { RelationshipExplanationResponse } from '../types/relationship';
import { fetchRelationshipExplanation } from '../services/api';
import { ConfidenceBadge } from './ConfidenceBadge';

interface RelationshipDetailDrawerProps {
  sourceCaseId: string | null;
  targetCaseId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectCase?: (caseId: string) => void;
}

export const RelationshipDetailDrawer: React.FC<RelationshipDetailDrawerProps> = ({
  sourceCaseId,
  targetCaseId,
  isOpen,
  onClose,
  onSelectCase,
}) => {
  const [data, setData] = useState<RelationshipExplanationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showSourceData, setShowSourceData] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'signals' | 'score' | 'trace'>('overview');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && sourceCaseId && targetCaseId) {
      loadExplanation(sourceCaseId, targetCaseId);
    } else {
      setData(null);
      setError(null);
    }
  }, [isOpen, sourceCaseId, targetCaseId]);

  async function loadExplanation(src: string, tgt: string) {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchRelationshipExplanation(src, tgt);
      setData(res);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to load forensic relationship explanation.');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.35)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          zIndex: 1999,
          animation: 'relDrawerFadeIn 0.2s ease-out forwards',
        }}
      />

      <aside
        role="dialog"
        aria-label="Forensic relationship concordance"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '560px',
          maxWidth: '92vw',
          height: '100vh',
          backgroundColor: '#ffffff',
          boxShadow: '-8px 0 32px rgba(15, 23, 42, 0.22)',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid var(--border-medium)',
          animation: 'relSlideInRight 0.26s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <style>{`
          @keyframes relSlideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          @keyframes relDrawerFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>

      {/* Top Header */}
      <div
        style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: 'var(--accent-cyan)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Explainable Forensic Concordance Layer
            </span>
          </div>
          <h2
            style={{
              fontSize: '17px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{sourceCaseId}</span>
            <span style={{ color: 'var(--accent-cyan)', fontSize: '15px' }}>↔</span>
            <span>{targetCaseId}</span>
          </h2>
        </div>

        <button
          onClick={onClose}
          className="btn btn-ghost"
          style={{ padding: '6px', borderRadius: '6px', color: 'var(--text-muted)' }}
          title="Close Investigation Drawer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: '#ffffff',
          padding: '0 16px',
        }}
      >
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'comparison', label: 'Comparison' },
          { id: 'signals', label: 'Evidence Signals' },
          { id: 'score', label: 'Score Breakdown' },
          { id: 'trace', label: 'Evidence Trace' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '10px 14px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            <div style={{ marginBottom: '8px', fontWeight: 600 }}>Analyzing empirical multi-signal features...</div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              Comparing {sourceCaseId} vs {targetCaseId} across real Indian incident records
            </div>
          </div>
        ) : error ? (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecdd3',
              borderRadius: '8px',
              color: '#be123c',
              fontSize: '13px',
            }}
          >
            <strong>Investigation Error:</strong> {error}
          </div>
        ) : !data ? null : (
          <div>
            {/* Primary Metrics Banner */}
            <div
              className="glass-panel"
              style={{
                padding: '16px 20px',
                marginBottom: '20px',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-medium)',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: 'var(--accent-cyan)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#e0f2fe',
                    border: '1px solid #bae6fd',
                  }}
                >
                  {data.relationship.type}
                </span>

                <ConfidenceBadge
                  confidence={data.relationship.confidence}
                  category={data.relationship.classification}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span
                  style={{
                    fontSize: '32px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {Math.round(data.relationship.confidence * 100)}%
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Statistically Derived Incident Similarity
                </span>
              </div>

              {data.edge_label && (
                <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Active Graph Edge: <strong style={{ color: 'var(--text-primary)' }}>{data.edge_label}</strong>
                </div>
              )}
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Why Are They Related? (Section 9) */}
                <div>
                  <h3
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <HelpCircle size={15} color="var(--accent-cyan)" />
                    <span>Why Are These Cases Related?</span>
                  </h3>
                  <div
                    style={{
                      padding: '14px 16px',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      color: '#15803d',
                      fontSize: '13px',
                      lineHeight: 1.55,
                    }}
                  >
                    {data.summary}
                  </div>
                </div>

                {/* Evidence Highlights (Supporting & Weakening) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div
                    style={{
                      padding: '14px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803d', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} color="#16a34a" />
                      <span>Supporting Evidence ({data.supporting_signals.length})</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {data.supporting_signals.map((s) => (
                        <div key={s.signal_name} style={{ fontSize: '11.5px', color: 'var(--text-primary)', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                          <span>{s.label} match</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '14px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#b45309', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={14} color="#d97706" />
                      <span>Distinguishing Factors ({data.weakening_signals.length})</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {data.weakening_signals.length > 0 ? (
                        data.weakening_signals.map((s) => (
                          <div key={s.signal_name} style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                            <span style={{ color: '#d97706', fontWeight: 700 }}>⚠</span>
                            <span>{s.label} divergence</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>No major weakening divergence</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Connection Path / Graph Hops (Section 13) */}
                {data.path && data.path.length > 0 && (
                  <div>
                    <h3
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Network size={15} color="var(--accent-indigo)" />
                      <span>Dimensional Connection Path ({data.path.length - 1} hops)</span>
                    </h3>
                    <div
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      {data.path.map((nodeId, idx) => (
                        <React.Fragment key={idx}>
                          <span
                            style={{
                              fontSize: '11.5px',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              backgroundColor: nodeId.startsWith('IND-CASE')
                                ? '#e0f2fe'
                                : nodeId.startsWith('CITY::')
                                ? '#d1fae5'
                                : nodeId.startsWith('WEAPON::')
                                ? '#ffe4e6'
                                : '#fef3c7',
                              color: nodeId.startsWith('IND-CASE')
                                ? '#0369a1'
                                : nodeId.startsWith('CITY::')
                                ? '#047857'
                                : nodeId.startsWith('WEAPON::')
                                ? '#be123c'
                                : '#b45309',
                              border: '1px solid rgba(0,0,0,0.08)',
                            }}
                          >
                            {nodeId}
                          </span>
                          {idx < data.path.length - 1 && (
                            <ArrowRight size={13} color="var(--text-muted)" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CASE COMPARISON (Section 10) */}
            {activeTab === 'comparison' && (
              <div>
                <h3
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Factual Attribute-by-Attribute Comparison
                </h3>
                <div
                  className="glass-panel"
                  style={{
                    overflowX: 'auto',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-medium)', textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px', fontWeight: 700, width: '28%' }}>Dimension</th>
                        <th style={{ padding: '8px 12px', fontWeight: 700, width: '32%', color: 'var(--accent-cyan)' }}>
                          Case A ({data.source_case_id})
                        </th>
                        <th style={{ padding: '8px 12px', fontWeight: 700, width: '32%', color: 'var(--accent-indigo)' }}>
                          Case B ({data.target_case_id})
                        </th>
                        <th style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'center' }}>Match</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(data.comparison).map(([key, row]) => (
                        <tr key={key} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {row.label}
                          </td>
                          <td style={{ padding: '8px 12px', fontFamily: typeof row.case_a_value === 'number' ? 'var(--font-mono)' : 'inherit', color: 'var(--text-primary)' }}>
                            {String(row.case_a_value ?? 'N/A')}
                          </td>
                          <td style={{ padding: '8px 12px', fontFamily: typeof row.case_b_value === 'number' ? 'var(--font-mono)' : 'inherit', color: 'var(--text-primary)' }}>
                            {String(row.case_b_value ?? 'N/A')}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor:
                                  row.match_status === 'match'
                                    ? '#dcfce7'
                                    : row.match_status === 'close'
                                    ? '#fef3c7'
                                    : '#fee2e2',
                                color:
                                  row.match_status === 'match'
                                    ? '#15803d'
                                    : row.match_status === 'close'
                                    ? '#b45309'
                                    : '#be123c',
                              }}
                            >
                              {row.match_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: EVIDENCE SIGNALS (Section 3 & 6) */}
            {activeTab === 'signals' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Supporting Signals */}
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#15803d', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} />
                    <span>Supporting Evidence Signals ({data.supporting_signals.length})</span>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {data.supporting_signals.map((sig) => (
                      <div
                        key={sig.signal_name}
                        style={{
                          padding: '12px 14px',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #bbf7d0',
                          borderRadius: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--text-primary)' }}>
                            {sig.label}
                          </span>
                          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#16a34a' }}>
                            +{(sig.weighted_contribution * 100).toFixed(1)}% contribution
                          </span>
                        </div>
                        <div style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '6px' }}>
                          {String(sig.case_a_value)} ↔ {String(sig.case_b_value)}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {sig.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weakening Signals */}
                {data.weakening_signals.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#b45309', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={16} />
                      <span>Weakening / Divergence Signals ({data.weakening_signals.length})</span>
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {data.weakening_signals.map((sig) => (
                        <div
                          key={sig.signal_name}
                          style={{
                            padding: '12px 14px',
                            backgroundColor: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '6px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--text-primary)' }}>
                              {sig.label}
                            </span>
                            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#d97706' }}>
                              0.0% contribution
                            </span>
                          </div>
                          <div style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '6px' }}>
                            {String(sig.case_a_value)} ↔ {String(sig.case_b_value)}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {sig.explanation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: SCORE BREAKDOWN (Section 7) */}
            {activeTab === 'score' && (
              <div>
                <h3
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Configured Weight & Contribution Breakdown
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(data.score_breakdown).map(([name, item]: [string, any]) => {
                    const pct = Math.round(item.raw_similarity * 100);
                    const contribPct = Math.round(item.weighted_contribution * 100);
                    return (
                      <div
                        key={name}
                        style={{
                          padding: '12px 14px',
                          backgroundColor: '#f8fafc',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.label}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                            Weight: {Math.round(item.weight * 100)}% • Contrib: <strong>{contribPct}%</strong>
                          </span>
                        </div>
                        <div style={{ height: '7px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              backgroundColor:
                                item.result === 'supporting'
                                  ? 'var(--accent-emerald)'
                                  : item.result === 'neutral'
                                  ? 'var(--accent-cyan)'
                                  : 'var(--accent-amber)',
                              borderRadius: '4px',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 5: EVIDENCE TRACE / SOURCE DATA (Section 14) */}
            {activeTab === 'trace' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Code size={15} color="var(--accent-cyan)" />
                    <span>Auditable Source Data Records</span>
                  </h3>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Complete raw incident records as retrieved directly from the Indian Crime dataset for forensic verification.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', marginBottom: '4px' }}>
                      SOURCE CASE RECORD ({data.source_case_id})
                    </div>
                    <pre
                      style={{
                        padding: '12px',
                        backgroundColor: '#0f172a',
                        color: '#f8fafc',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        overflowX: 'auto',
                        maxHeight: '220px',
                      }}
                    >
                      {JSON.stringify(data.source_case, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-indigo)', marginBottom: '4px' }}>
                      TARGET CASE RECORD ({data.target_case_id})
                    </div>
                    <pre
                      style={{
                        padding: '12px',
                        backgroundColor: '#0f172a',
                        color: '#f8fafc',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        overflowX: 'auto',
                        maxHeight: '220px',
                      }}
                    >
                      {JSON.stringify(data.target_case, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer Actions */}
      {data && (
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: '#f8fafc',
            display: 'flex',
            gap: '12px',
          }}
        >
          {onSelectCase && (
            <>
              <button
                onClick={() => {
                  onSelectCase(data.source_case_id);
                  onClose();
                }}
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '12px' }}
              >
                <span>Dossier: {data.source_case_id}</span>
                <ExternalLink size={12} />
              </button>
              <button
                onClick={() => {
                  onSelectCase(data.target_case_id);
                  onClose();
                }}
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '12px' }}
              >
                <span>Dossier: {data.target_case_id}</span>
                <ExternalLink size={12} />
              </button>
            </>
          )}
        </div>
      )}
    </aside>
  </>,
  document.body
);
};
