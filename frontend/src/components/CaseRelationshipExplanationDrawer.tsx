import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Share2,
  CheckCircle2,
  GitCommit,
  Info,
  ArrowRight,
  Database,
  Layers,
} from 'lucide-react';
import { CaseEntityEdge, CaseEntityNode } from '../types/intelligenceGraph';

interface CaseRelationshipExplanationDrawerProps {
  edge: CaseEntityEdge | null;
  allNodes: CaseEntityNode[];
  onClose: () => void;
  onSelectNode?: (nodeId: string) => void;
}

export const CaseRelationshipExplanationDrawer: React.FC<CaseRelationshipExplanationDrawerProps> = ({
  edge,
  allNodes,
  onClose,
  onSelectNode,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!edge || typeof document === 'undefined') return null;

  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));
  const sourceNode = nodeMap.get(edge.source);
  const targetNode = nodeMap.get(edge.target);

  const isExplicit = edge.relationship_mode === 'explicit';

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
          animation: 'caseDrawerFadeIn 0.2s ease-out forwards',
        }}
      />

      {/* Drawer sliding from right to left */}
      <aside
        role="dialog"
        aria-label="Relationship Explanation"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '460px',
          maxWidth: '92vw',
          height: '100vh',
          backgroundColor: '#ffffff',
          boxShadow: '-8px 0 32px rgba(15, 23, 42, 0.22)',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid var(--border-medium)',
          animation: 'caseDrawerSlideIn 0.26s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <style>{`
          @keyframes caseDrawerSlideIn {
            from {
              transform: translateX(100%);
            }
            to {
              transform: translateX(0);
            }
          }
          @keyframes caseDrawerFadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `}</style>

        {/* Header */}
        <div
          style={{
            flexShrink: 0,
            padding: '18px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          backgroundColor: '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              backgroundColor: isExplicit ? '#dcfce7' : '#f3e8ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isExplicit ? (
              <CheckCircle2 size={18} color="#15803d" />
            ) : (
              <GitCommit size={18} color="#7e22ce" />
            )}
          </div>
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: isExplicit ? '#15803d' : '#7e22ce',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {isExplicit ? 'Explicit Relationship' : 'Derived Relationship'}
            </div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
              }}
            >
              {edge.relationship_type.replace(/_/g, ' ').toUpperCase()}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '4px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Close explanation"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Visual Link Diagram */}
        <div
          style={{
            padding: '16px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Connected Entities
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            {/* Source */}
            <div
              onClick={() => onSelectNode && onSelectNode(edge.source)}
              style={{
                flex: 1,
                padding: '10px 12px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                cursor: onSelectNode ? 'pointer' : 'default',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                {sourceNode?.type || 'SOURCE'}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {sourceNode?.label || edge.source}
              </div>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
                {edge.source}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <ArrowRight size={16} color="var(--accent-blue)" />
              <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {edge.label}
              </span>
            </div>

            {/* Target */}
            <div
              onClick={() => onSelectNode && onSelectNode(edge.target)}
              style={{
                flex: 1,
                padding: '10px 12px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                cursor: onSelectNode ? 'pointer' : 'default',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                {targetNode?.type || 'TARGET'}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {targetNode?.label || edge.target}
              </div>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
                {edge.target}
              </div>
            </div>
          </div>
        </div>

        {/* Why is this relationship present? (Requirement 15) */}
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '6px',
            }}
          >
            Why is this relationship present?
          </div>
          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              backgroundColor: isExplicit ? '#f0fdf4' : '#faf5ff',
              border: isExplicit ? '1px solid #bbf7d0' : '1px solid #e9d5ff',
              fontSize: '13px',
              lineHeight: 1.6,
              color: '#1e293b',
              fontWeight: 500,
            }}
          >
            {edge.explanation}
          </div>
        </div>

        {/* Source Attribution */}
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '4px',
            }}
          >
            Data Provenance & Source
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            <Database size={14} color="#0284c7" />
            <span>{edge.source_detail || 'Case entity relationship data'}</span>
          </div>
        </div>

        {/* Methodology Note (Explicit vs Inferred) */}
        <div
          style={{
            padding: '14px',
            borderRadius: '8px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            fontSize: '11px',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '4px' }}>
            <Info size={13} color="#0284c7" />
            <span>Fact vs Inference Methodology</span>
          </div>
          {isExplicit ? (
            <p style={{ margin: 0 }}>
              <strong>Explicit Relationship:</strong> This connection is directly registered in the structured case file (e.g. named witness, designated suspect, seized weapon, or documented crime scene). No probabilistic estimation is applied.
            </p>
          ) : (
            <p style={{ margin: 0 }}>
              <strong>Derived Relationship:</strong> This connection was computed by the platform (e.g. sequential event progression based on chronological timestamps or associative cross-presence).
            </p>
          )}
        </div>
      </div>
    </aside>
  </>,
  document.body
);
};
