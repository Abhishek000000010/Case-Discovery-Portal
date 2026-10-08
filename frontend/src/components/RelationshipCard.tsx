import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, ExternalLink, Network, ArrowRight, Eye, HelpCircle } from 'lucide-react';
import { RelationshipExplanation } from '../types/relationship';
import { ConfidenceBadge } from './ConfidenceBadge';

interface RelationshipCardProps {
  relationship: RelationshipExplanation;
  currentCaseId?: string;
  onSelectCase: (caseId: string) => void;
  onExploreGraph?: (caseId: string) => void;
  onInspectRelationship?: (rel: RelationshipExplanation) => void;
  onWhyRelated?: (sourceId: string, targetId: string) => void;
}

export const RelationshipCard: React.FC<RelationshipCardProps> = ({
  relationship,
  currentCaseId,
  onSelectCase,
  onExploreGraph,
  onInspectRelationship,
  onWhyRelated,
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const targetCaseId = currentCaseId === relationship.source_case
    ? relationship.target_case
    : relationship.source_case;

  const breakdown = relationship.score_breakdown || ({} as any);

  const scoreItems = [
    { label: 'Same Municipal Jurisdiction', val: breakdown.same_city, color: 'var(--accent-cyan)' },
    { label: 'Exact Crime Code Match', val: breakdown.crime_code_match, color: 'var(--accent-indigo)' },
    { label: 'Crime Description Match', val: breakdown.crime_description_match, color: 'var(--accent-blue)' },
    { label: 'Crime Domain Alignment', val: breakdown.crime_domain_match, color: '#6366f1' },
    { label: 'Weapon Deployment Match', val: breakdown.weapon_match, color: 'var(--accent-amber)' },
    { label: 'Temporal Proximity (Calendar)', val: breakdown.temporal_proximity, color: 'var(--accent-emerald)' },
    { label: 'Time-of-Day Window (24h Clock)', val: breakdown.time_of_day_proximity, color: '#0ea5e9' },
    { label: 'Victim Demographic Alignment', val: breakdown.victim_profile_similarity, color: 'var(--accent-rose)' },
    { label: 'Semantic Narrative Profile', val: breakdown.semantic_similarity, color: 'var(--text-accent)' },
    { label: 'Compound Profile Boost', val: breakdown.compound_boost, color: '#16a34a' },
    { label: 'Feature Rarity Adjustment', val: breakdown.rarity_adjustment, color: '#8b5cf6' },
  ].filter((item) => (item.val !== undefined && item.val !== 0));

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
              padding: 0,
            }}
          >
            <span>{targetCaseId}</span>
            <ExternalLink size={12} />
          </button>

          <span style={{
            fontSize: '11px',
            backgroundColor: '#e0f2fe',
            border: '1px solid #bae6fd',
            padding: '2px 8px',
            borderRadius: '4px',
            color: 'var(--accent-cyan)',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
          }}>
            {relationship.relationship_type_label || 'SIMILAR INCIDENT PROFILE'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ConfidenceBadge confidence={relationship.confidence} category={relationship.category} />
        </div>
      </div>

      {/* Supporting Signals Tags */}
      {relationship.supporting_signals && relationship.supporting_signals.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
          {relationship.supporting_signals.map((sig, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '10.5px',
                fontWeight: 600,
                color: 'var(--accent-cyan)',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                padding: '1px 6px',
                borderRadius: '4px',
              }}
            >
              #{sig.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}

      {/* Natural Language Evidence Bullets */}
      <div style={{
        backgroundColor: '#f8fafc',
        borderRadius: '6px',
        padding: '10px 14px',
        marginBottom: '10px',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Discovered Corroborating Evidence:
        </div>
        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {relationship.evidence.map((ev, i) => (
            <li key={i} style={{ marginBottom: '3px' }}>
              {ev}
            </li>
          ))}
        </ul>
      </div>

      {/* Accordion Toggle for Mathematical Score Breakdown */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '11.5px',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: 0,
            fontWeight: 500,
          }}
        >
          {showBreakdown ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          <span>{showBreakdown ? 'Hide Math Breakdown' : 'View Scoring Breakdown'}</span>
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          {onWhyRelated && (
            <button
              className="btn btn-primary"
              style={{ padding: '3px 9px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => onWhyRelated(relationship.source_case, relationship.target_case)}
              title="Open Explainable Relationship Investigation Layer"
            >
              <HelpCircle size={12} />
              <span>Why related?</span>
            </button>
          )}

          {onExploreGraph && (
            <button
              className="btn btn-ghost"
              style={{ padding: '3px 8px', fontSize: '11px' }}
              onClick={() => onExploreGraph(targetCaseId)}
            >
              <Network size={12} />
              <span>Explore Graph</span>
            </button>
          )}

          <button
            className="btn btn-secondary"
            style={{ padding: '3px 9px', fontSize: '11px' }}
            onClick={() => onSelectCase(targetCaseId)}
          >
            <span>Inspect Case</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Score Breakdown Gauges */}
      {showBreakdown && (
        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '8px',
        }}>
          {scoreItems.map((item, idx) => (
            <div key={idx} style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: '5px',
              padding: '6px 10px',
              fontSize: '11px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: item.color }}>
                  +{item.val.toFixed(3)}
                </span>
              </div>
              <div style={{ height: '3px', backgroundColor: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, item.val * 350))}%`, backgroundColor: item.color }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
