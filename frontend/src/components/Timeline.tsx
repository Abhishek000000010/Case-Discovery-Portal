import React from 'react';
import { Clock, MapPin, User } from 'lucide-react';
import { CaseEvent } from '../types/case';

interface TimelineProps {
  events: CaseEvent[];
}

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', padding: '12px 0' }}>
        No chronological events recorded for this incident.
      </div>
    );
  }

  // Sort events by timestamp
  const sorted = [...events].sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));

  return (
    <div style={{ position: 'relative', paddingLeft: '22px', margin: '14px 0' }}>
      {/* Vertical timeline spine */}
      <div style={{
        position: 'absolute',
        top: '6px',
        bottom: '6px',
        left: '6px',
        width: '2px',
        backgroundColor: 'var(--border-medium)',
      }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {sorted.map((ev, idx) => (
          <div key={ev.event_id || idx} style={{ position: 'relative' }}>
            {/* Timeline node dot */}
            <div style={{
              position: 'absolute',
              top: '5px',
              left: '-22px',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: '2px solid #0284c7',
              boxShadow: '0 0 4px rgba(2, 132, 199, 0.3)',
            }} />

            <div className="glass-panel" style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: '#0369a1',
                  textTransform: 'uppercase',
                  padding: '2px 7px',
                  backgroundColor: '#e0f2fe',
                  borderRadius: '4px',
                }}>
                  {ev.type.replace(/_/g, ' ')}
                </span>

                {ev.timestamp && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
                    <Clock size={12} />
                    <span>{ev.timestamp.replace('T', ' ')}</span>
                  </span>
                )}
              </div>

              {ev.description && (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {ev.description}
                </p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                {ev.person_id && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
                    <User size={11} color="var(--accent-person)" />
                    <span>Person: {ev.person_id}</span>
                  </span>
                )}
                {ev.location_id && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
                    <MapPin size={11} color="var(--accent-location)" />
                    <span>Location: {ev.location_id}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
