import React from 'react';
import {
  Clock,
  MapPin,
  Users,
  ShieldAlert,
  Car,
  ChevronRight,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { TimelineEvent } from '../types/intelligenceGraph';

interface CaseTimelinePanelProps {
  timeline: TimelineEvent[];
  selectedEventId?: string | null;
  onSelectEvent: (eventId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const CaseTimelinePanel: React.FC<CaseTimelinePanelProps> = ({
  timeline,
  selectedEventId,
  onSelectEvent,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}
      >
        <Clock size={14} color="#0284c7" />
        <span>Incident Timeline ({timeline.length})</span>
      </button>
    );
  }

  return (
    <div
      style={{
        width: '320px',
        height: '100%',
        backgroundColor: '#ffffff',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        zIndex: 5,
      }}
    >
      {/* Timeline Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} color="#0284c7" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Incident Sequence Timeline
          </span>
          <span
            style={{
              fontSize: '11px',
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              padding: '2px 6px',
              borderRadius: '10px',
              fontWeight: 600,
            }}
          >
            {timeline.length} Events
          </span>
        </div>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '11px',
              padding: '4px',
            }}
            title="Collapse timeline"
          >
            ✕
          </button>
        )}
      </div>

      <div style={{ padding: '8px 16px', fontSize: '11px', color: 'var(--text-muted)', backgroundColor: '#fdfefe', borderBottom: '1px solid #f1f5f9' }}>
        Click any event to spotlight it and its associated entities in the graph.
      </div>

      {/* Timeline Event List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {timeline.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '12px' }}>
            No chronology events available for this case.
          </div>
        ) : (
          timeline.map((evt, idx) => {
            const isSelected = selectedEventId === evt.event_id;
            return (
              <div
                key={evt.event_id}
                onClick={() => onSelectEvent(evt.event_id)}
                style={{
                  position: 'relative',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                  border: isSelected ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                  boxShadow: isSelected ? '0 2px 10px rgba(2, 132, 199, 0.12)' : '0 1px 3px rgba(0,0,0,0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Event Top Bar: Sequence index, Title & Time */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: isSelected ? '#0284c7' : '#e2e8f0',
                        color: isSelected ? '#ffffff' : '#475569',
                        fontSize: '10px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#0284c7' : '#1e293b' }}>
                      {evt.title}
                    </span>
                  </div>

                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: isSelected ? '#0369a1' : '#64748b',
                      backgroundColor: isSelected ? '#e0f2fe' : '#f1f5f9',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {evt.time_display}
                  </div>
                </div>

                {/* Date Display */}
                {evt.date_display && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
                    <Calendar size={11} />
                    <span>{evt.date_display}</span>
                  </div>
                )}

                {/* Location */}
                {evt.location_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#475569', marginBottom: '6px' }}>
                    <MapPin size={12} color="#10b981" />
                    <span>{evt.location_name}</span>
                  </div>
                )}

                {/* Involved People */}
                {evt.person_names && evt.person_names.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>
                    <Users size={12} color="#6366f1" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {evt.person_names.map((p, pidx) => (
                        <span
                          key={pidx}
                          style={{
                            backgroundColor: '#f1f5f9',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            color: '#334155',
                          }}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weapon if involved */}
                {evt.weapon_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#b91c1c', marginTop: '4px' }}>
                    <ShieldAlert size={12} color="#dc2626" />
                    <span style={{ fontWeight: 600 }}>Weapon: {evt.weapon_name}</span>
                  </div>
                )}

                {/* Vehicle if involved */}
                {evt.vehicle_registration && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#c2410c', marginTop: '4px' }}>
                    <Car size={12} color="#ea580c" />
                    <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      Vehicle: {evt.vehicle_registration}
                    </span>
                  </div>
                )}

                {/* Selected Indicator */}
                {isSelected && (
                  <div
                    style={{
                      marginTop: '8px',
                      paddingTop: '6px',
                      borderTop: '1px dashed #bae6fd',
                      fontSize: '10px',
                      color: '#0284c7',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Sparkles size={11} />
                    <span>Active event spotlighted in graph</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
