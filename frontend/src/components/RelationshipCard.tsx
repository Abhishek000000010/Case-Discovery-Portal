import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, ExternalLink, Network, ArrowRight, Eye, GitCommit, Layers } from 'lucide-react';
import { RelationshipExplanation } from '../types/relationship';
import { ConfidenceBadge } from './ConfidenceBadge';

interface RelationshipCardProps {
  relationship: RelationshipExplanation;
  currentCaseId?: string;
  onSelectCase: (caseId: string) => void;
  onExploreGraph?: (caseId: string) => void;
  onInspectRelationship?: (rel: RelationshipExplanation) => void;
}

export const RelationshipCard: React.FC<RelationshipCardProps> = ({
  relationship,
  currentCaseId,
  onSelectCase,
  onExploreGraph,
  onInspectRelationship,
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const targetCaseId = currentCaseId === relationship.source_case
    ? relationship.target_case
    : relationship.source_case;

  const otherCaseId = currentCaseId
    ? targetCaseId
    : `${relationship.source_case} ↔ ${relationship.target_case}`;

  const breakdown = relationship.score_breakdown || {} as any;
  const moBd = relationship.mo_breakdown;
  const seqBd = relationship.sequence_breakdown;
  const f = relationship.features;

  const scoreItems = [
    { label: 'Person Overlap', val: breakdown.person_overlap, color: 'var(--accent-emerald)' },
    { label: 'Vehicle Overlap', val: breakdown.vehicle_overlap, color: 'var(--accent-amber)' },
    { label: 'Object / Evidence Match', val: breakdown.object_overlap, color: 'var(--accent-purple)' },
    { label: 'Location Proximity', val: breakdown.location_similarity, color: 'var(--accent-cyan)' },
    { label: 'Temporal Proximity', val: breakdown.temporal_similarity, color: 'var(--accent-blue)' },
    { label: 'Modus Operandi', val: breakdown.modus_operandi_similarity, color: 'var(--accent-rose)' },
    { label: 'Event Sequence', val: breakdown.event_sequence_similarity, color: 'var(--accent-indigo)' },
    { label: 'Semantic Text Overlap', val: breakdown.semantic_similarity, color: 'var(--text-accent)' },
    { label: 'Witness Recurrence', val: breakdown.witness_overlap, color: '#db2777' },
  ].filter(item => item.val > 0);

  return (
    <div className="glass-panel" style={{ padding: '16px 18px', marginBottom: '12px' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => onSelectCase(targetCaseId)}
            style={{
              background: 'transparent',
              border: 'none',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: '14px',
              color: 'var(--accent-cyan)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>{otherCaseId}</span>
            <ExternalLink size={12} />
          </button>

          <span style={{
            fontSize: '11px',
            padding: '2px 7px',
            borderRadius: '4px',
            backgroundColor: '#f1f5f9',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
          }}>
            {relationship.relationship_type.replace(/_/g, ' ')}
          </span>
        </div>

        <ConfidenceBadge
          confidence={relationship.confidence}
          category={relationship.category}
        />
      </div>

      {/* Multi-Signal Badges */}
      {relationship.supporting_signals && relationship.supporting_signals.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
          {relationship.supporting_signals.map((sig, idx) => (
            <span key={idx} style={{
              fontSize: '10.5px',
              fontFamily: 'var(--font-mono)',
              padding: '1px 6px',
              borderRadius: '3px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: 'var(--text-muted)',
            }}>
              ✓ {sig.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}

      {/* Discovered Evidence Bullets */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
          Investigative Evidence & Rationale
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {relationship.evidence.map((ev, idx) => (
            <li key={idx} style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
              <CheckCircle size={13} color="var(--accent-cyan)" style={{ marginTop: '3px', flexShrink: 0 }} />
              <span>{ev}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Quick LCS / MO tags preview if available */}
      {((moBd?.matching && moBd.matching.length > 0) || (seqBd?.lcs && seqBd.lcs.length >= 2)) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px', fontSize: '11.5px' }}>
          {moBd?.matching && moBd.matching.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Layers size={11} color="#7c3aed" /> Matching MO:
              </span>
              {moBd.matching.map((m, i) => (
                <span key={i} style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '1px 5px', borderRadius: '3px', fontSize: '10.5px' }}>
                  {m}
                </span>
              ))}
            </div>
          )}
          {seqBd?.lcs && seqBd.lcs.length >= 2 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <GitCommit size={11} color="#4f46e5" /> Event Chain:
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: '#3730a3', backgroundColor: '#eef2ff', padding: '1px 6px', borderRadius: '3px' }}>
                {seqBd.lcs.join(' → ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Collapsible Score Breakdown */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '11.5px',
            fontWeight: 600,
            color: 'var(--text-accent)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '2px 0',
          }}
        >
          <span>{showBreakdown ? 'Hide Metric Breakdown' : 'View Explainable Metric Breakdown'}</span>
          {showBreakdown ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {showBreakdown && (
          <div style={{
            marginTop: '8px',
            padding: '12px',
            backgroundColor: '#f8fafc',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px',
          }}>
            {scoreItems.map((item, idx) => (
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
        )}
      </div>

      {/* Action Footer */}
      <div style={{
        marginTop: '10px',
        paddingTop: '8px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '6px',
      }}>
        {onInspectRelationship ? (
          <button
            onClick={() => onInspectRelationship(relationship)}
            className="btn btn-ghost"
            style={{ fontSize: '11.5px', padding: '3px 8px', color: 'var(--text-accent)' }}
          >
            <Eye size={12} />
            <span>Deep Diagnostic Drawer</span>
          </button>
        ) : <div />}

        <div style={{ display: 'flex', gap: '6px' }}>
          {onExploreGraph && (
            <button
              onClick={() => onExploreGraph(targetCaseId)}
              className="btn btn-ghost"
              style={{ fontSize: '11.5px', padding: '3px 8px' }}
            >
              <Network size={12} color="var(--accent-cyan)" />
              <span>View Subgraph</span>
            </button>
          )}
          <button
            onClick={() => onSelectCase(targetCaseId)}
            className="btn btn-secondary"
            style={{ fontSize: '11.5px', padding: '3px 9px' }}
          >
            <span>Open Case Dossier</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
