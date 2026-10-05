import React from 'react';
import { User, Car, MapPin, Box, AlertCircle, ArrowRight } from 'lucide-react';

interface EntityCardProps {
  type: 'PERSON' | 'VEHICLE' | 'LOCATION' | 'OBJECT';
  id: string;
  title: string;
  subtitle?: string;
  caseCount?: number;
  cases?: string[];
  roleDistribution?: Record<string, number>;
  isAnomaly?: boolean;
  anomalyLabel?: string;
  notes?: string[];
  onSelectCase?: (caseId: string) => void;
  onExploreGraph?: (entityId: string) => void;
}

export const EntityCard: React.FC<EntityCardProps> = ({
  type,
  id,
  title,
  subtitle,
  caseCount = 0,
  cases = [],
  roleDistribution = {},
  isAnomaly = false,
  anomalyLabel,
  onSelectCase,
  onExploreGraph,
}) => {
  const iconMap = {
    PERSON: User,
    VEHICLE: Car,
    LOCATION: MapPin,
    OBJECT: Box,
  };
  const colorMap = {
    PERSON: 'var(--accent-person)',
    VEHICLE: 'var(--accent-vehicle)',
    LOCATION: 'var(--accent-location)',
    OBJECT: 'var(--accent-object)',
  };

  const Icon = iconMap[type];
  const color = colorMap[type];

  return (
    <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        {/* Top header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              backgroundColor: `${color}12`,
              border: `1px solid ${color}28`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color,
            }}>
              <Icon size={15} />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {title}
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {id}
              </div>
            </div>
          </div>

          {/* Anomaly badge with neutral investigative phrasing */}
          {isAnomaly && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 7px',
              borderRadius: '4px',
              backgroundColor: '#fef3c7',
              border: '1px solid #fde68a',
              color: '#92400e',
              fontSize: '10px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
            }}>
              <AlertCircle size={10} />
              <span>{anomalyLabel || 'RECURRENCE DETECTED'}</span>
            </span>
          )}
        </div>

        {subtitle && (
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            {subtitle}
          </div>
        )}

        {/* Case Appearances & Role distribution */}
        <div style={{ marginBottom: '12px', backgroundColor: '#f8fafc', border: '1px solid var(--border-subtle)', padding: '8px 10px', borderRadius: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Case File Involvement:</span>
            <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {caseCount} incident{caseCount !== 1 ? 's' : ''}
            </strong>
          </div>

          {Object.keys(roleDistribution).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '4px' }}>
              {Object.entries(roleDistribution).map(([role, count]) => (
                <span
                  key={role}
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {role}: {count}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Associated cases pills */}
        {cases.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
              Linked Cases ({cases.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {cases.slice(0, 8).map((cid) => (
                <button
                  key={cid}
                  onClick={() => onSelectCase && onSelectCase(cid)}
                  style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    color: '#0284c7',
                    fontFamily: 'var(--font-mono)',
                    cursor: onSelectCase ? 'pointer' : 'default',
                  }}
                >
                  {cid}
                </button>
              ))}
              {cases.length > 8 && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center' }}>
                  +{cases.length - 8} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Explore action */}
      {onExploreGraph && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => onExploreGraph(id)}
            className="btn btn-ghost"
            style={{ fontSize: '11.5px', padding: '3px 8px' }}
          >
            <span>Network Context</span>
            <ArrowRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
};
