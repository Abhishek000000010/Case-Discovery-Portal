import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface AnomalyCardProps {
  anomaly: {
    entity_type: string;
    entity_id: string;
    name?: string;
    registration?: string;
    case_count: number;
    cases?: string[];
    role_distribution?: Record<string, number>;
    is_potential_anomaly: boolean;
    anomaly_label?: string;
    investigative_notes?: string[];
  };
  onSelectCase: (caseId: string) => void;
  onExploreGraph?: (entityId: string) => void;
}

export const AnomalyCard: React.FC<AnomalyCardProps> = ({
  anomaly,
  onSelectCase,
}) => {
  const title = anomaly.name || anomaly.registration || anomaly.entity_id;
  const notes = anomaly.investigative_notes || [];
  const cases = anomaly.cases || [];
  const roleDistribution = anomaly.role_distribution || {};

  return (
    <div className="glass-panel" style={{ padding: '16px', borderLeft: '3px solid #d97706' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
        <div>
          <span style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: '#92400e',
            padding: '2px 7px',
            backgroundColor: '#fef3c7',
            borderRadius: '4px',
            marginRight: '8px',
          }}>
            {anomaly.anomaly_label || 'POTENTIAL RECURRENCE ANOMALY'}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {anomaly.entity_type} {anomaly.entity_id}
          </span>
        </div>

        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
          {anomaly.case_count} Case Records
        </span>
      </div>

      <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
        {title}
      </div>

      {/* Neutral Investigative Notes */}
      {notes.length > 0 && (
        <div style={{ marginBottom: '10px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
          {notes.map((note, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--accent-amber)' }} />
              <span>{note}</span>
            </div>
          ))}
        </div>
      )}

      {/* Role Distribution breakdown */}
      {Object.keys(roleDistribution).length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {Object.entries(roleDistribution).map(([role, cnt]) => (
            <span key={role} style={{
              fontSize: '11px',
              padding: '2px 7px',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
            }}>
              {role}: <strong>{cnt}</strong>
            </span>
          ))}
        </div>
      )}

      {/* Associated Cases */}
      {cases.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
            Corroborating Cases ({cases.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {cases.slice(0, 10).map((cid) => (
              <button
                key={cid}
                onClick={() => onSelectCase(cid)}
                style={{
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  color: '#0284c7',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                }}
              >
                {cid}
              </button>
            ))}
            {cases.length > 10 && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center' }}>
                +{cases.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Bottom info banner */}
      <div style={{
        padding: '6px 10px',
        backgroundColor: '#f8fafc',
        border: '1px solid var(--border-subtle)',
        borderRadius: '4px',
        fontSize: '11px',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <ShieldCheck size={13} color="var(--accent-cyan)" />
        <span>Investigative decision-support indicator. High recurrence requires corroboration.</span>
      </div>
    </div>
  );
};
