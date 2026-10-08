import React from 'react';
import { AlertTriangle, ArrowRight, MapPin, Shield } from 'lucide-react';
import { AnomalyItem } from '../types/relationship';

interface AnomalyCardProps {
  anomaly: AnomalyItem;
  onSelectCase: (caseId: string) => void;
}

export const AnomalyCard: React.FC<AnomalyCardProps> = ({
  anomaly,
  onSelectCase,
}) => {
  const isHigh = anomaly.severity === 'HIGH';
  const badgeColor = isHigh ? '#b91c1c' : '#b45309';
  const badgeBg = isHigh ? '#fef2f2' : '#fef3c7';
  const borderLeft = isHigh ? '3px solid #ef4444' : '3px solid #f59e0b';

  return (
    <div className="glass-panel" style={{ padding: '16px', borderLeft, marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '10.5px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: badgeColor,
            padding: '2px 7px',
            backgroundColor: badgeBg,
            borderRadius: '4px',
          }}>
            {anomaly.anomaly_type}
          </span>
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent-cyan)',
          }}>
            {anomaly.case_id}
          </span>
        </div>

        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Anomaly Score: {anomaly.score.toFixed(2)}
        </span>
      </div>

      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
        {anomaly.crime} • {anomaly.city}
      </div>

      <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 10px 0' }}>
        {anomaly.reason}
      </p>

      {anomaly.details && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          backgroundColor: '#f8fafc',
          padding: '8px 12px',
          borderRadius: '5px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          marginBottom: '10px',
        }}>
          {Object.entries(anomaly.details).map(([k, v]) => (
            <span key={k}>
              <strong>{k.replace(/_/g, ' ')}:</strong> {String(v)}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: '11px' }}
          onClick={() => onSelectCase(anomaly.case_id)}
        >
          <span>Inspect Case File</span>
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
};
