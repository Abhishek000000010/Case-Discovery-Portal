import React from 'react';
import { Calendar, MapPin, Wrench, Shield, ArrowRight, User } from 'lucide-react';
import { CaseModel } from '../types/case';

interface CaseCardProps {
  caseData: CaseModel;
  onSelect: (caseId: string) => void;
}

export const CaseCard: React.FC<CaseCardProps> = ({ caseData, onSelect }) => {
  const isClosed = caseData.investigation?.case_closed;
  const statusLabel = isClosed ? 'Closed' : 'Open';

  const dateStr =
    caseData.incident?.date_of_occurrence ||
    caseData.incident?.time_of_occurrence ||
    caseData.incident?.date_reported ||
    'Unspecified date';

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
        transition: 'border-color 0.15s, box-shadow 0.15s',
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
            }}>
              Code {caseData.incident.crime_code}
            </span>
          </div>

          <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '12px',
            fontWeight: 600,
            backgroundColor: isClosed ? '#f0fdf4' : '#fff7ed',
            color: isClosed ? '#15803d' : '#c2410c',
            border: isClosed ? '1px solid #bbf7d0' : '1px solid #fed7aa',
          }}>
            {statusLabel}
          </span>
        </div>

        {/* Crime Title & Domain */}
        <div style={{ marginBottom: '10px' }}>
          <h4 style={{
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 2px 0',
          }}>
            {caseData.incident.crime_description}
          </h4>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Domain: {caseData.incident.crime_domain}
          </span>
        </div>

        {/* Structured Metadata info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          marginBottom: '14px',
          backgroundColor: '#f8fafc',
          padding: '10px',
          borderRadius: '6px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <MapPin size={12} color="var(--accent-cyan)" />
            <span>{caseData.location.city}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Calendar size={12} color="var(--accent-indigo)" />
            <span>{dateStr.split('T')[0]}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Wrench size={12} color="var(--accent-amber)" />
            <span>{caseData.weapon.used || 'None Specified'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <User size={12} color="var(--accent-emerald)" />
            <span>
              {caseData.victim.age ? `Age ${caseData.victim.age}` : 'Age ?'}, {caseData.victim.gender || 'Unknown'}
            </span>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <Shield size={12} />
          <span>Report #{caseData.source.source_report_number} • {caseData.investigation.police_deployed ?? 0} Police Deployed</span>
        </div>

        <button
          className="btn btn-ghost"
          style={{ padding: '3px 8px', fontSize: '12px', color: 'var(--text-primary)' }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(caseData.case_id);
          }}
        >
          <span>Inspect</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
