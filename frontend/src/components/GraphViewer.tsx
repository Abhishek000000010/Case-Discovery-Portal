import React, { useEffect, useRef, useState, useMemo } from 'react';
import cytoscape, { Core, EventObject } from 'cytoscape';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Sliders,
  HelpCircle,
  Eye,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import { GraphData } from '../types/graph';
import { ConfidenceBadge } from './ConfidenceBadge';
import { RelationshipDetailDrawer } from './RelationshipDetailDrawer';
import { fetchCaseRelationships } from '../services/api';
import { RelationshipExplanation } from '../types/relationship';

interface GraphViewerProps {
  data: GraphData;
  centerNodeId?: string;
  onSelectNode?: (nodeId: string, nodeType: string) => void;
  onSelectCase?: (caseId: string) => void;
  minConfidence?: number;
  onConfidenceChange?: (val: number) => void;
  height?: string;
}

export const GraphViewer: React.FC<GraphViewerProps> = ({
  data,
  centerNodeId,
  onSelectNode,
  onSelectCase,
  minConfidence = 0.35,
  onConfidenceChange,
  height = '640px',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const [layoutName, setLayoutName] = useState<'concentric' | 'cose' | 'breadthfirst' | 'circle'>('concentric');
  const [filterMode, setFilterMode] = useState<'all' | 'cases_only'>('all');
  const [showGuide, setShowGuide] = useState(false);
  const [hoveredNodeInfo, setHoveredNodeInfo] = useState<{ id: string; label: string; type: string; connections: number } | null>(null);

  const [selectedElement, setSelectedElement] = useState<{
    type: 'node' | 'edge';
    data: any;
  } | null>(null);

  const [investigationPair, setInvestigationPair] = useState<{
    sourceId: string | null;
    targetId: string | null;
    isOpen: boolean;
  }>({ sourceId: null, targetId: null, isOpen: false });

  const [nodeRelatedCases, setNodeRelatedCases] = useState<RelationshipExplanation[]>([]);
  const [loadingRelated, setLoadingRelated] = useState<boolean>(false);

  // Active filters for real entity node types
  const [activeTypes, setActiveTypes] = useState<Record<string, boolean>>({
    CASE: true,
    CITY: true,
    CRIME: true,
    CRIME_DOMAIN: true,
    WEAPON: true,
  });

  const toggleType = (type: string) => {
    setActiveTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const filteredNodes = useMemo(() => {
    return (data.nodes || []).filter((n) => {
      if (filterMode === 'cases_only' && n.type !== 'CASE') return false;
      return activeTypes[n.type] ?? true;
    });
  }, [data.nodes, filterMode, activeTypes]);

  const nodeIdsSet = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const filteredEdges = useMemo(() => {
    return (data.edges || []).filter((e) => {
      if (e.confidence < minConfidence) return false;
      return nodeIdsSet.has(e.source) && nodeIdsSet.has(e.target);
    });
  }, [data.edges, minConfidence, nodeIdsSet]);

  useEffect(() => {
    if (!containerRef.current) return;

    if (cyRef.current) {
      try {
        cyRef.current.removeAllListeners();
        cyRef.current.stop();
        cyRef.current.destroy();
      } catch (e) {
        // ignore cleanup error
      }
      cyRef.current = null;
    }

    const cyElements = [
      ...filteredNodes.map((n) => {
        const isCenter = n.id === centerNodeId;
        return {
          group: 'nodes' as const,
          data: {
            id: n.id,
            label: n.label || n.id,
            type: n.type,
            isCenter,
            properties: n.properties,
          },
        };
      }),
      ...filteredEdges.map((e) => ({
        group: 'edges' as const,
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          label:
            e.edge_label ||
            (e.relationship_type === 'similar_incident_profile'
              ? `${Math.round(e.confidence * 100)}% • ${(e.relationship_type_label || 'SIMILAR PROFILE').replace(/_/g, ' ')}`
              : (e.relationship_type || 'RELATED').replace(/_/g, ' ')),
          edge_label: e.edge_label,
          relationship_type_label: e.relationship_type_label,
          relationship_type: e.relationship_type,
          confidence: e.confidence,
          category: e.category,
          evidence: e.evidence,
          score_breakdown: e.score_breakdown,
        },
      })),
    ];

    try {
      const cy = cytoscape({
        container: containerRef.current,
        elements: cyElements,
        boxSelectionEnabled: false,
        style: [
          {
            selector: 'node',
            style: {
              label: 'data(label)',
              'font-family': 'Inter, system-ui, sans-serif',
              'font-size': '11px',
              'font-weight': 600,
              color: '#0f172a',
              'text-valign': 'bottom',
              'text-margin-y': 6,
              'text-outline-color': '#ffffff',
              'text-outline-width': 3,
              'text-background-color': '#ffffff',
              'text-background-opacity': 0.85,
              'text-background-padding': '2px',
              'background-color': '#94a3b8',
              'border-width': 2,
              'border-color': '#cbd5e1',
              width: 38,
              height: 38,
              'transition-property': 'opacity, border-width, border-color',
              'transition-duration': 0.2,
            },
          },
          {
            selector: 'node[type = "CASE"]',
            style: {
              shape: 'round-rectangle',
              'background-color': '#e0f2fe',
              'border-width': 3,
              'border-color': '#0284c7',
              width: 48,
              height: 48,
              color: '#0369a1',
              'font-weight': 700,
            },
          },
          {
            selector: 'node[type = "CITY"]',
            style: {
              shape: 'diamond',
              'background-color': '#d1fae5',
              'border-width': 2.5,
              'border-color': '#059669',
              width: 44,
              height: 44,
              color: '#047857',
            },
          },
          {
            selector: 'node[type = "CRIME"]',
            style: {
              shape: 'round-hexagon',
              'background-color': '#fef3c7',
              'border-width': 2.5,
              'border-color': '#d97706',
              width: 44,
              height: 44,
              color: '#b45309',
            },
          },
          {
            selector: 'node[type = "CRIME_DOMAIN"]',
            style: {
              shape: 'hexagon',
              'background-color': '#e0e7ff',
              'border-width': 2.5,
              'border-color': '#4f46e5',
              width: 42,
              height: 42,
              color: '#4338ca',
            },
          },
          {
            selector: 'node[type = "WEAPON"]',
            style: {
              shape: 'tag',
              'background-color': '#ffe4e6',
              'border-width': 2.5,
              'border-color': '#e11d48',
              width: 38,
              height: 38,
              color: '#be123c',
            },
          },
          {
            selector: 'node[?isCenter]',
            style: {
              'border-width': 5,
              'border-color': '#0284c7',
              'background-color': '#38bdf8',
              width: 60,
              height: 60,
              'font-size': '13px',
              'font-weight': 800,
              color: '#0c4a6e',
            },
          },
          {
            selector: 'edge',
            style: {
              width: 2,
              'line-color': '#cbd5e1',
              'target-arrow-color': '#cbd5e1',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'arrow-scale': 0.8,
              opacity: 0.8,
              label: 'data(label)',
              'font-size': '9px',
              'font-weight': 500,
              color: '#64748b',
              'text-rotation': 'autorotate',
              'text-background-color': '#ffffff',
              'text-background-opacity': 0.9,
              'text-background-padding': '2px',
            },
          },
          {
            selector: 'edge[category = "VERY HIGH"]',
            style: {
              'line-color': '#059669',
              'target-arrow-color': '#059669',
              width: 3.5,
              opacity: 1.0,
            },
          },
          {
            selector: 'edge[category = "HIGH"]',
            style: {
              'line-color': '#0284c7',
              'target-arrow-color': '#0284c7',
              width: 2.8,
              opacity: 0.9,
            },
          },
          {
            selector: 'edge[category = "MODERATE"]',
            style: {
              'line-color': '#f59e0b',
              'target-arrow-color': '#f59e0b',
              width: 2.0,
              opacity: 0.7,
            },
          },
          {
            selector: 'edge[relationship_type = "similar_incident_profile"]',
            style: {
              'line-style': 'dashed',
            },
          },
          {
            selector: '.highlighted',
            style: {
              'border-color': '#0284c7',
              'border-width': 4,
              opacity: 1.0,
              'z-index': 999,
            },
          },
          {
            selector: '.dimmed',
            style: {
              opacity: 0.2,
            },
          },
        ],
        layout: {
          name: layoutName,
          padding: 50,
          animate: true,
          animationDuration: 500,
        } as any,
      });

      // Events
      cy.on('tap', 'node', (evt: EventObject) => {
        const node = evt.target;
        setSelectedElement({ type: 'node', data: node.data() });
        if (node.data('type') === 'CASE') {
          setLoadingRelated(true);
          fetchCaseRelationships(node.id(), minConfidence, 4)
            .then((rels) => setNodeRelatedCases(rels))
            .catch(() => setNodeRelatedCases([]))
            .finally(() => setLoadingRelated(false));
        } else {
          setNodeRelatedCases([]);
        }
        if (onSelectNode) onSelectNode(node.id(), node.data('type'));
      });

      cy.on('tap', 'edge', (evt: EventObject) => {
        const edge = evt.target;
        setSelectedElement({ type: 'edge', data: edge.data() });
        const src = edge.data('source');
        const tgt = edge.data('target');
        if (src && tgt && src.startsWith('IND-CASE') && tgt.startsWith('IND-CASE')) {
          setInvestigationPair({ sourceId: src, targetId: tgt, isOpen: true });
        }
      });

      cy.on('mouseover', 'node', (evt: EventObject) => {
        const node = evt.target;
        const connectedEdges = node.connectedEdges();
        const connectedNodes = connectedEdges.connectedNodes();

        cy.elements().addClass('dimmed');
        node.removeClass('dimmed').addClass('highlighted');
        connectedEdges.removeClass('dimmed').addClass('highlighted');
        connectedNodes.removeClass('dimmed').addClass('highlighted');

        setHoveredNodeInfo({
          id: node.id(),
          label: node.data('label') || node.id(),
          type: node.data('type'),
          connections: connectedEdges.length,
        });
      });

      cy.on('mouseout', 'node', () => {
        cy.elements().removeClass('dimmed').removeClass('highlighted');
        setHoveredNodeInfo(null);
      });

      cyRef.current = cy;
    } catch (e) {
      console.error('Cytoscape render error:', e);
    }

    return () => {
      if (cyRef.current) {
        try {
          cyRef.current.destroy();
        } catch (e) {
          // ignore
        }
        cyRef.current = null;
      }
    };
  }, [filteredNodes, filteredEdges, layoutName, centerNodeId]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(undefined, 40);

  return (
    <div style={{ position: 'relative', width: '100%', height, backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Top Left Toolbar */}
      <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10, backgroundColor: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
        <select
          value={layoutName}
          onChange={(e) => setLayoutName(e.target.value as any)}
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: 500,
          }}
        >
          <option value="concentric">Concentric (Hub & Spoke)</option>
          <option value="cose">Force-Directed</option>
          <option value="circle">Circular</option>
          <option value="breadthfirst">Tree Hierarchy</option>
        </select>

        <div style={{ height: '16px', width: '1px', backgroundColor: 'var(--border-subtle)' }} />

        <button onClick={handleZoomIn} className="btn btn-ghost" style={{ padding: '5px' }} title="Zoom In">
          <ZoomIn size={14} />
        </button>
        <button onClick={handleZoomOut} className="btn btn-ghost" style={{ padding: '5px' }} title="Zoom Out">
          <ZoomOut size={14} />
        </button>
        <button onClick={handleFit} className="btn btn-ghost" style={{ padding: '5px' }} title="Fit View">
          <Maximize2 size={14} />
        </button>

        <button
          onClick={() => setShowGuide(!showGuide)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #bae6fd',
            backgroundColor: showGuide ? '#e0f2fe' : '#f0f9ff',
            color: '#0284c7',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          <HelpCircle size={13} />
          <span>Legend</span>
        </button>
      </div>

      {/* Top Center Hovered Node Pill */}
      {hoveredNodeInfo && (
        <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', zIndex: 15, backgroundColor: '#0f172a', color: '#ffffff', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <span style={{ fontWeight: 700 }}>{hoveredNodeInfo.label}</span>
          <span style={{ opacity: 0.6 }}>•</span>
          <span style={{ opacity: 0.8 }}>{hoveredNodeInfo.type}</span>
          <span style={{ opacity: 0.6 }}>•</span>
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>{hoveredNodeInfo.connections} links</span>
        </div>
      )}

      {/* Top Right Entity Filter Pills */}
      <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', flexWrap: 'wrap', gap: '5px', zIndex: 10 }}>
        {Object.entries(activeTypes).map(([type, isActive]) => {
          const colorMap: Record<string, string> = {
            CASE: '#0284c7',
            CITY: '#059669',
            CRIME: '#d97706',
            CRIME_DOMAIN: '#4f46e5',
            WEAPON: '#e11d48',
          };
          const color = colorMap[type] || '#475569';
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '4px',
                border: `1px solid ${isActive ? color : '#e2e8f0'}`,
                backgroundColor: isActive ? '#ffffff' : '#f8fafc',
                color: isActive ? color : '#94a3b8',
                cursor: 'pointer',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
              }}
            >
              {type}
            </button>
          );
        })}
      </div>

      {/* How to Read Popover */}
      {showGuide && (
        <div style={{ position: 'absolute', top: '56px', left: '12px', width: '380px', backgroundColor: '#ffffff', border: '1px solid var(--border-medium)', borderRadius: '8px', boxShadow: 'var(--shadow-lg)', padding: '16px', zIndex: 25, fontSize: '12px', lineHeight: 1.5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={15} color="var(--accent-cyan)" />
              <span>Entity & Relationship Legend</span>
            </div>
            <button onClick={() => setShowGuide(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={15} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#e0f2fe', border: '2px solid #0284c7' }} />
              <span><strong>CASE:</strong> Real incident report dossier node</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#d1fae5', border: '2px solid #059669' }} />
              <span><strong>CITY:</strong> Municipal jurisdiction (29 cities)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#fef3c7', border: '2px solid #d97706' }} />
              <span><strong>CRIME:</strong> Statutory crime classification</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#e0e7ff', border: '2px solid #4f46e5' }} />
              <span><strong>CRIME DOMAIN:</strong> Broad crime category</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#ffe4e6', border: '2px solid #e11d48' }} />
              <span><strong>WEAPON:</strong> Weapon category deployed</span>
            </div>
            <div style={{ marginTop: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              Dashed lines represent <em>similar incident profiles</em> discovered through empirical concordance.
            </div>
          </div>
        </div>
      )}

      {/* Selected Element Drawer */}
      {selectedElement && (
        <div style={{ position: 'absolute', bottom: '16px', right: '16px', width: '340px', maxHeight: '440px', overflowY: 'auto', backgroundColor: '#ffffff', border: '1px solid var(--border-medium)', borderRadius: '8px', boxShadow: 'var(--shadow-lg)', padding: '16px', zIndex: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              {selectedElement.type === 'node' ? `${selectedElement.data.type} NODE` : 'RELATIONSHIP LINK EXPLAINER'}
            </span>
            <button onClick={() => setSelectedElement(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={15} />
            </button>
          </div>

          {selectedElement.type === 'node' ? (
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2px', fontFamily: 'var(--font-mono)' }}>
                {selectedElement.data.id}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                {selectedElement.data.label}
              </div>

              {selectedElement.data.properties && (
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border-subtle)', padding: '10px', borderRadius: '6px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {Object.entries(selectedElement.data.properties).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{k.replace(/_/g, ' ')}:</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{String(v || 'N/A')}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedElement.data.type === 'CASE' && onSelectCase && (
                <button
                  onClick={() => onSelectCase(selectedElement.data.id)}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '14px', fontSize: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                >
                  <span>Open Case Dossier</span>
                  <ArrowRight size={13} />
                </button>
              )}

              {/* Top Relationships for Case (Section 12) */}
              {selectedElement.data.type === 'CASE' && (
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Top Related Cases
                  </div>

                  {loadingRelated ? (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
                      Retrieving top related cases...
                    </div>
                  ) : nodeRelatedCases.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {nodeRelatedCases.map((rel, idx) => (
                        <div
                          key={rel.target_case || idx}
                          style={{
                            padding: '8px 10px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '6px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                              {rel.target_case}
                            </span>
                            <ConfidenceBadge confidence={rel.confidence} category={rel.category} />
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            {rel.edge_label || rel.relationship_type_label || 'Similar Incident Profile'}
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() =>
                                setInvestigationPair({
                                  sourceId: selectedElement.data.id,
                                  targetId: rel.target_case,
                                  isOpen: true,
                                })
                              }
                              className="btn btn-secondary"
                              style={{ flex: 1, padding: '3px 6px', fontSize: '10.5px' }}
                            >
                              Why related?
                            </button>
                            {onSelectCase && (
                              <button
                                onClick={() => onSelectCase(rel.target_case)}
                                className="btn btn-ghost"
                                style={{ padding: '3px 6px', fontSize: '10.5px' }}
                              >
                                View
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      No related cases found above confidence threshold.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 700 }}>
                  {selectedElement.data.source} ↔ {selectedElement.data.target}
                </span>
                <ConfidenceBadge confidence={selectedElement.data.confidence} category={selectedElement.data.category} />
              </div>

              <div style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'capitalize', marginBottom: '10px' }}>
                Connection: {selectedElement.data.relationship_type.replace(/_/g, ' ')}
              </div>

              {selectedElement.data.evidence?.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                    Why These Cases Are Connected:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {selectedElement.data.evidence.map((ev: string, i: number) => (
                      <div key={i} style={{ fontSize: '11.5px', color: 'var(--text-secondary)', backgroundColor: '#f8fafc', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                        • {ev}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explain Relationship Button */}
              {selectedElement.data.source?.startsWith('IND-CASE') &&
                selectedElement.data.target?.startsWith('IND-CASE') && (
                  <button
                    onClick={() =>
                      setInvestigationPair({
                        sourceId: selectedElement.data.source,
                        targetId: selectedElement.data.target,
                        isOpen: true,
                      })
                    }
                    className="btn btn-primary"
                    style={{ width: '100%', marginBottom: '8px', fontSize: '11px', padding: '7px' }}
                  >
                    Why Related? (Full Explanation)
                  </button>
                )}

              {onSelectCase && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button onClick={() => onSelectCase(selectedElement.data.source)} className="btn btn-secondary" style={{ flex: 1, fontSize: '11px', padding: '6px' }}>
                    View {selectedElement.data.source}
                  </button>
                  <button onClick={() => onSelectCase(selectedElement.data.target)} className="btn btn-secondary" style={{ flex: 1, fontSize: '11px', padding: '6px' }}>
                    View {selectedElement.data.target}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Forensic Relationship Investigation Drawer (Sections 1-15) */}
      <RelationshipDetailDrawer
        sourceCaseId={investigationPair.sourceId}
        targetCaseId={investigationPair.targetId}
        isOpen={investigationPair.isOpen}
        onClose={() => setInvestigationPair((prev) => ({ ...prev, isOpen: false }))}
        onSelectCase={onSelectCase}
      />
    </div>
  );
};
