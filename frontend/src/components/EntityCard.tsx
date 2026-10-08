import React from 'react';
import { Building2, ShieldAlert, Wrench, Layers, ArrowRight, Share2 } from 'lucide-react';

interface EntityCardProps {
  type: 'CITY' | 'CRIME' | 'WEAPON' | 'DOMAIN';
  id: string;
  title: string;
  subtitle?: string;
  caseCount?: number;
  extraStats?: Record<string, any>;
  onExploreGraph?: (entityId: string) => void;
  onFilterCases?: (type: string, value: string) => void;
}

export const EntityCard: React.FC<EntityCardProps> = ({
  type,
  id,
  title,
  subtitle,
  caseCount = 0,
  extraStats = {},
  onExploreGraph,
  onFilterCases,
}) => {
  const iconMap = {
    CITY: Building2,
    CRIME: ShieldAlert,
    WEAPON: Wrench,
    DOMAIN: Layers,
  };

  const colorMap = {
    CITY: 'var(--accent-emerald)',
    CRIME: 'var(--accent-amber)',
    WEAPON: 'var(--accent-rose)',
    DOMAIN: 'var(--accent-indigo)',
  };

  const Icon = iconMap[type] || Building2;
  const color = colorMap[type] || '#0284c7';

  return (
    <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        {/* Top header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: `${color}18`,
              border: `1px solid ${color}35`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color,
            }}>
              <Icon size={16} />
            </div>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontWeight: 600 }}>
                {type}
              </span>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {title}
              </div>
            </div>
          </div>

          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            backgroundColor: '#f1f5f9',
            color: 'var(--text-secondary)',
            padding: '2px 8px',
            borderRadius: '12px',
          }}>
            {caseCount.toLocaleString()} Cases
          </span>
        </div>

        {subtitle && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
            {subtitle}
          </p>
        )}

        {/* Extra statistics */}
        {Object.keys(extraStats).length > 0 && (
          <div style={{
            backgroundColor: '#f8fafc',
            borderRadius: '6px',
            padding: '8px 10px',
            fontSize: '11.5px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            marginBottom: '12px',
          }}>
            {Object.entries(extraStats).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>{k.replace(/_/g, ' ')}:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{String(v)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        paddingTop: '10px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {onExploreGraph ? (
          <button
            className="btn btn-ghost"
            style={{ padding: '4px 8px', fontSize: '11px' }}
            onClick={() => onExploreGraph(id)}
          >
            <Share2 size={12} />
            <span>Graph View</span>
          </button>
        ) : <div />}

        {onFilterCases && (
          <button
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '11px' }}
            onClick={() => onFilterCases(type, title)}
          >
            <span>Filter Cases</span>
            <ArrowRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
};
