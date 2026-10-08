import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
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
  Sparkles,
  Wrench,
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
      setDebugError(err.message || 'Failed to fetch debug telemetry');
    } finally {
      setLoadingDebug(false);
    }
  };

  const bd = relationship.score_breakdown || ({} as any);

  const breakdownGauges = [
    { label: 'Same City (Jurisdiction)', val: bd.same_city, color: 'var(--accent-cyan)' },
    { label: 'Crime Code Match', val: bd.crime_code_match, color: 'var(--accent-indigo)' },
    { label: 'Crime Description Match', val: bd.crime_description_match, color: 'var(--accent-blue)' },
    { label: 'Crime Domain Match', val: bd.crime_domain_match, color: '#6366f1' },
    { label: 'Weapon Category Match', val: bd.weapon_match, color: 'var(--accent-amber)' },
    { label: 'Temporal Proximity', val: bd.temporal_proximity, color: 'var(--accent-emerald)' },
    { label: 'Time-of-Day Window (24h Clock)', val: bd.time_of_day_proximity, color: '#0ea5e9' },
    { label: 'Victim Profile Match', val: bd.victim_profile_similarity, color: 'var(--accent-rose)' },
    { label: 'Semantic Text Cosine', val: bd.semantic_similarity, color: 'var(--text-accent)' },
    { label: 'Compound Profile Boost', val: bd.compound_boost, color: '#16a34a' },
    { label: 'Rarity IDF Adjustment', val: bd.rarity_adjustment, color: '#8b5cf6' },
  ].filter((item) => (item.val !== undefined && item.val !== 0));

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Statistical Relationship Inspector
              </span>
              <ConfidenceBadge confidence={relationship.confidence} category={relationship.category} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => { onSelectCase(relationship.source_case); onClose(); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 800, color: 'var(--accent-cyan)' }}
              >
                {relationship.source_case}
              </button>
              <span style={{ color: 'var(--text-muted)', fontSize: '16px' }}>↔</span>
              <button
                onClick={() => { onSelectCase(relationship.target_case); onClose(); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 800, color: 'var(--accent-cyan)' }}
              >
                {relationship.target_case}
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Signals */}
        {relationship.supporting_signals && relationship.supporting_signals.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
            {relationship.supporting_signals.map((sig, i) => (
              <span
                key={i}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--accent-cyan)',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                #{sig.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}

        {/* Natural Language Evidence Bullets */}
        <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="#0284c7" />
            <span>Corroborating Incident Evidence</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {relationship.evidence.map((ev, i) => (
              <li key={i}>{ev}</li>
            ))}
          </ul>
        </div>

        {/* Mathematical Feature Breakdown Gauges */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
            Mathematical Score Components
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px' }}>
            {breakdownGauges.map((g, i) => (
              <div key={i} style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', padding: '8px 12px', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11.5px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{g.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: g.color }}>+{g.val.toFixed(3)}</span>
                </div>
                <div style={{ height: '4px', backgroundColor: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, g.val * 350))}%`, backgroundColor: g.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Debug Drawer Toggle */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={handleLoadDebug}
            disabled={loadingDebug}
            className="btn btn-secondary"
            style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileCode size={13} />
            <span>{showDebugView ? 'Hide Raw Math Telemetry' : 'Inspect Raw Scoring Math & Weights'}</span>
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => { onSelectCase(relationship.source_case); onClose(); }}
              className="btn btn-secondary"
              style={{ fontSize: '12px' }}
            >
              View {relationship.source_case}
            </button>
            <button
              onClick={() => { onSelectCase(relationship.target_case); onClose(); }}
              className="btn btn-primary"
              style={{ fontSize: '12px' }}
            >
              View {relationship.target_case}
            </button>
          </div>
        </div>

        {/* Raw Math Telemetry Inspector */}
        {showDebugView && debugData && (
          <div style={{ marginTop: '16px', backgroundColor: '#0f172a', color: '#f8fafc', padding: '16px', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>Scoring Decision: {debugData.decision}</span>
              <span style={{ color: '#94a3b8' }}>Threshold: {debugData.threshold} | Final Score: {debugData.final_score}</span>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ color: '#94a3b8', marginBottom: '4px' }}>Active Weights:</div>
              <pre style={{ margin: 0, color: '#e2e8f0', fontSize: '11px' }}>
                {JSON.stringify(debugData.weights, null, 2)}
              </pre>
            </div>
            <div>
              <div style={{ color: '#94a3b8', marginBottom: '4px' }}>Score Breakdown:</div>
              <pre style={{ margin: 0, color: '#34d399', fontSize: '11px' }}>
                {JSON.stringify(debugData.score_breakdown, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
