import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User,
  Shield,
  MapPin,
  Car,
  Package,
  Calendar,
  FileText,
  AlertTriangle,
  FolderGit2,
  Tag,
  Link,
  Info,
} from 'lucide-react';
import { CaseEntityNode, CaseEntityEdge } from '../types/intelligenceGraph';

interface CaseEntityDetailDrawerProps {
  node: CaseEntityNode | null;
  edges: CaseEntityEdge[];
  allNodes: CaseEntityNode[];
  onClose: () => void;
  onSelectConnectedNode?: (nodeId: string) => void;
}

export const CaseEntityDetailDrawer: React.FC<CaseEntityDetailDrawerProps> = ({
  node,
  edges,
  allNodes,
  onClose,
  onSelectConnectedNode,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!node || typeof document === 'undefined') return null;

  const props = node.properties || {};

  // Compute connected nodes from edges
  const connectedEdges = edges.filter(
    (e) => e.source === node.id || e.target === node.id
  );

  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CASE':
        return '#0284c7';
      case 'PERSON':
        return '#059669';
      case 'LOCATION':
        return '#10b981';
      case 'WEAPON':
        return '#dc2626';
      case 'VEHICLE':
        return '#ea580c';
      case 'OBJECT':
        return '#4f46e5';
      case 'EVENT':
        return '#7c3aed';
      case 'EVIDENCE':
        return '#d97706';
      default:
        return '#64748b';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CASE':
        return <FolderGit2 size={18} color="#0284c7" />;
      case 'PERSON':
        return <User size={18} color="#059669" />;
      case 'LOCATION':
        return <MapPin size={18} color="#10b981" />;
      case 'WEAPON':
        return <Shield size={18} color="#dc2626" />;
      case 'VEHICLE':
        return <Car size={18} color="#ea580c" />;
      case 'OBJECT':
        return <Package size={18} color="#4f46e5" />;
      case 'EVENT':
        return <Calendar size={18} color="#7c3aed" />;
      case 'EVIDENCE':
        return <FileText size={18} color="#d97706" />;
      default:
        return <Tag size={18} color="#64748b" />;
    }
  };

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
        aria-label={`Entity details for ${node.label}`}
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
              backgroundColor: `${getTypeColor(node.type)}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {getTypeIcon(node.type)}
          </div>
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: getTypeColor(node.type),
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {node.type}
            </div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                maxWidth: '280px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {node.label}
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
          title="Close drawer"
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
        {/* Node Identifier Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            backgroundColor: '#f1f5f9',
            borderRadius: '6px',
            fontSize: '12px',
          }}
        >
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Entity Identifier:</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {node.id}
          </span>
        </div>

        {/* ================= PERSON DETAILS ================= */}
        {node.type === 'PERSON' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Full Name
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {props.name || node.label}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Role in Case
                </div>
                <div style={{ marginTop: '4px' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      backgroundColor:
                        node.role === 'suspect' ? '#fee2e2' : node.role === 'victim' ? '#fef3c7' : '#e0f2fe',
                      color:
                        node.role === 'suspect' ? '#991b1b' : node.role === 'victim' ? '#92400e' : '#0369a1',
                    }}
                  >
                    {props.role || node.role || 'Person'}
                  </span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Demographics
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {props.age ? `${props.age} years old` : 'Age N/A'}, {props.gender || 'N/A'}
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Relationship to Case
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  marginTop: '4px',
                  lineHeight: 1.5,
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                }}
              >
                {props.relationship_to_case || `Formally recorded as ${node.role || 'involved party'} in case records.`}
              </div>
            </div>
          </div>
        )}

        {/* ================= WEAPON DETAILS ================= */}
        {node.type === 'WEAPON' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Weapon Type
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {props.type || node.label}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Custody Status
                </div>
                <div style={{ marginTop: '2px' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: '#fee2e2',
                      color: '#991b1b',
                    }}
                  >
                    {props.status || 'Recorded'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Forensic Description
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  marginTop: '4px',
                  lineHeight: 1.5,
                  padding: '10px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                }}
              >
                {props.description || 'Physical weapon item entered into forensic evidence.'}
              </div>
            </div>
          </div>
        )}

        {/* ================= VEHICLE DETAILS ================= */}
        {node.type === 'VEHICLE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Registration Number
              </div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: '#ea580c',
                  marginTop: '4px',
                  padding: '6px 12px',
                  backgroundColor: '#fff7ed',
                  borderRadius: '6px',
                  display: 'inline-block',
                  border: '1px solid #fed7aa',
                }}
              >
                {props.registration || node.label}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Vehicle Class
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {props.type || 'Vehicle'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Case Role
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#c2410c', marginTop: '2px' }}>
                  {props.role || 'Associated Vehicle'}
                </div>
              </div>
            </div>

            {props.owner_name && (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Registered / Associated Person
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {props.owner_name} ({props.owner_person_id})
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= LOCATION DETAILS ================= */}
        {node.type === 'LOCATION' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Location Name
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {props.name || node.label}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Locus Role
                </div>
                <div style={{ marginTop: '2px' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: '#d1fae5',
                      color: '#065f46',
                    }}
                  >
                    {props.role || 'Incident Location'}
                  </span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Jurisdiction
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {props.city || 'N/A'}, {props.state || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= OBJECT DETAILS ================= */}
        {node.type === 'OBJECT' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Object Classification
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {props.type || node.label}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Inventory Description
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  marginTop: '4px',
                  lineHeight: 1.5,
                  padding: '10px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                }}
              >
                {props.description || 'Recovered item logged in case properties.'}
              </div>
            </div>
          </div>
        )}

        {/* ================= EVENT DETAILS ================= */}
        {node.type === 'EVENT' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Event Type
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {props.event_type || node.role}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Timeline Timestamp
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: '#7c3aed',
                    marginTop: '2px',
                  }}
                >
                  {props.time || 'N/A'} ({props.date || ''})
                </div>
              </div>
            </div>

            {props.location && (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Event Location
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {props.location}
                </div>
              </div>
            )}

            {props.weapon && (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Weapon Used / Associated
                </div>
                <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600, marginTop: '2px' }}>
                  {props.weapon}
                </div>
              </div>
            )}

            {props.vehicle && (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Vehicle Involved
                </div>
                <div style={{ fontSize: '12px', color: '#ea580c', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {props.vehicle}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= EVIDENCE DETAILS ================= */}
        {node.type === 'EVIDENCE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Evidence Modality
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {props.type || node.label}
                </div>
              </div>

              {props.linked_entity && (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Linked Entity
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#d97706', marginTop: '2px' }}>
                    {props.linked_entity}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Forensic Note
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  marginTop: '4px',
                  lineHeight: 1.5,
                  padding: '10px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                }}
              >
                {props.description || 'Logged forensic artifact tied to case incident.'}
              </div>
            </div>
          </div>
        )}

        {/* ================= CASE DETAILS ================= */}
        {node.type === 'CASE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Incident Summary
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  marginTop: '4px',
                  lineHeight: 1.5,
                  padding: '10px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                }}
              >
                {props.summary || 'Incident record in case intelligence system.'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Crime Type
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7', marginTop: '2px' }}>
                  {props.crime_type}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Severity
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626', marginTop: '2px' }}>
                  {props.severity}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Investigating Unit
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {props.investigating_unit || 'Local Unit'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Police Station
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {props.police_station || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= CONNECTED GRAPH EDGES ================= */}
        <div style={{ marginTop: '10px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Connected Entities ({connectedEdges.length})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {connectedEdges.map((e) => {
              const otherId = e.source === node.id ? e.target : e.source;
              const otherNode = nodeMap.get(otherId);
              return (
                <div
                  key={e.id}
                  onClick={() => onSelectConnectedNode && onSelectConnectedNode(otherId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    cursor: onSelectConnectedNode ? 'pointer' : 'default',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(el) => (el.currentTarget.style.backgroundColor = '#f1f5f9')}
                  onMouseLeave={(el) => (el.currentTarget.style.backgroundColor = '#f8fafc')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: '#e2e8f0',
                        color: '#475569',
                        padding: '1px 5px',
                        borderRadius: '3px',
                      }}
                    >
                      {otherNode ? otherNode.type : 'ENTITY'}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {otherNode ? otherNode.label : otherId}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {e.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  </>,
  document.body
);
};
