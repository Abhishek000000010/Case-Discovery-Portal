import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
  badge?: string;
}

const COLOR_THEMES: Record<string, { bg: string; border: string; text: string }> = {
  cyan: { bg: '#e0f2fe', border: '#bae6fd', text: '#0284c7' },
  blue: { bg: '#dbeafe', border: '#bfdbfe', text: '#2563eb' },
  emerald: { bg: '#d1fae5', border: '#a7f3d0', text: '#059669' },
  amber: { bg: '#fef3c7', border: '#fde68a', text: '#d97706' },
  rose: { bg: '#ffe4e6', border: '#fecdd3', text: '#e11d48' },
  indigo: { bg: '#e0e7ff', border: '#c7d2fe', text: '#4f46e5' },
  purple: { bg: '#ede9fe', border: '#ddd6fe', text: '#7c3aed' },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'cyan',
  badge,
}) => {
  const theme = COLOR_THEMES[color] || {
    bg: '#f1f5f9',
    border: '#e2e8f0',
    text: color.startsWith('var') ? color : '#0284c7',
  };

  return (
    <div className="glass-panel" style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {title}
        </span>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: theme.bg,
          border: `1px solid ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.text,
          flexShrink: 0,
        }}>
          <Icon size={16} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em' }}>
          {value}
        </div>
        {badge && (
          <span style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: theme.bg,
            color: theme.text,
            fontWeight: 700,
          }}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};
