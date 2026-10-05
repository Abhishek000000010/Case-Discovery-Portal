import React from 'react';
import { Calendar, MapPin, Users, Share2, ArrowRight } from 'lucide-react';
import { CaseModel } from '../types/case';

interface CaseCardProps {
  caseData: CaseModel;
  onSelect: (caseId: string) => void;
}

export const CaseCard: React.FC<CaseCardProps> = ({ caseData, onSelect }) => {
  const sev = (caseData.severity || 'medium').toLowerCase();

  return (
    <div
      className="glass-panel"
      style={{
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        position: 'relative',
      }}
      onClick={() => onSelect(caseData.case_id)}
    >
      <div>
        {/* Top Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '13.5px',
              color: 'var(--accent-cyan)',
            }}>
              {caseData.case_id}
            </span>
            <span style={{
              fontSize: '11px',
              padding: '2px 7px',
              borderRadius: '4px',
              backgroundColor: '#f1f5f9',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              textTransform: 'capitalize',
            }}>
              {caseData.case_type.replace(/_/g, ' ')}
            </span>
          </div>

          <span className={`badge badge-${sev}`}>
            {sev}
          </span>
        </div>

        {/* Summary */}
        <p style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          marginBottom: '14px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {caseData.summary}
        </p>

        {/* Metadata info */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Calendar size={13} color="var(--accent-cyan)" />
            <span>{caseData.incident_date || caseData.reported_date}</span>
          </div>

          {caseData.location_names && caseData.location_names.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={13} color="var(--entity-location)" />
              <span>{caseData.location_names[0]}</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Users size={13} color="var(--entity-person)" />
            <span>{caseData.people_count ?? caseData.people_involved.length} people</span>
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div style={{
        paddingTop: '10px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: 600 }}>
          <Share2 size={13} />
          <span>{caseData.related_cases_count ?? 0} Relationships</span>
        </div>

        <button
          className="btn btn-ghost"
          style={{ padding: '3px 8px', fontSize: '12px', color: 'var(--text-primary)' }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(caseData.case_id);
          }}
        >
          <span>Dossier</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
