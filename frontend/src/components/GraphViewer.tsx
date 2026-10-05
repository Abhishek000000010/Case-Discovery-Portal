import React, { useEffect, useRef, useState, useMemo } from 'react';
import cytoscape, { Core, EventObject } from 'cytoscape';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  ExternalLink,
  Sliders,
  HelpCircle,
  Eye,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import { GraphData } from '../types/graph';
import { ConfidenceBadge } from './ConfidenceBadge';

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
  minConfidence = 0.40,
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

  // Active filters for node types
  const [activeTypes, setActiveTypes] = useState<Record<string, boolean>>({
    CASE: true,
    PERSON: true,
    LOCATION: true,
    VEHICLE: true,
    OBJECT: true,
    EVENT: true,
  });

  const toggleType = (type: string) => {
    setActiveTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  // Prepare filtered elements
  const { filteredNodes, filteredEdges } = useMemo(() => {
    let nodes = data.nodes;
    if (filterMode === 'cases_only') {
      nodes = nodes.filter(n => n.type === 'CASE');
    } else {
      nodes = nodes.filter(n => activeTypes[n.type] !== false);
    }

    const validNodeIds = new Set(nodes.map(n => n.id));

    // When in cases_only mode, we can also synthesize direct case-to-case connections if present in edges
    const edges = data.edges.filter(e =>
      validNodeIds.has(e.source) &&
      validNodeIds.has(e.target) &&
      e.confidence >= minConfidence
    );

    return { filteredNodes: nodes, filteredEdges: edges };
  }, [data, filterMode, activeTypes, minConfidence]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up previous instance cleanly
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
      ...filteredNodes.map(n => {
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
      ...filteredEdges.map(e => ({
        group: 'edges' as const,
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          label: (e.relationship_type || 'RELATED').replace(/_/g, ' '),
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
              'label': 'data(label)',
              'font-family': 'Inter, system-ui, sans-serif',
              'font-size': '11px',
              'font-weight': 600,
              'color': '#0f172a',
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
              'width': 38,
              'height': 38,
              'transition-property': 'opacity, border-width, border-color',
              'transition-duration': 0.2,
            },
          },
          {
            selector: 'node[type = "CASE"]',
            style: {
              'shape': 'round-rectangle',
              'background-color': '#e0f2fe',
              'border-width': 3,
              'border-color': '#0284c7',
              'width': 48,
              'height': 48,
              'color': '#0369a1',
              'font-weight': 700,
            },
          },
          {
            selector: 'node[type = "PERSON"]',
            style: {
              'shape': 'ellipse',
              'background-color': '#dcfce7',
              'border-width': 2.5,
              'border-color': '#059669',
              'width': 40,
              'height': 40,
              'color': '#047857',
            },
          },
          {
            selector: 'node[type = "LOCATION"]',
            style: {
              'shape': 'diamond',
              'background-color': '#cffafe',
              'border-width': 2.5,
              'border-color': '#0891b2',
              'width': 44,
              'height': 44,
              'color': '#0e7490',
            },
          },
          {
            selector: 'node[type = "VEHICLE"]',
            style: {
              'shape': 'hexagon',
              'background-color': '#fef3c7',
              'border-width': 2.5,
              'border-color': '#d97706',
              'width': 42,
              'height': 42,
              'color': '#b45309',
            },
          },
          {
            selector: 'node[type = "OBJECT"]',
            style: {
              'shape': 'vee',
              'background-color': '#f3e8ff',
              'border-width': 2.5,
              'border-color': '#7c3aed',
              'width': 36,
              'height': 36,
              'color': '#6d28d9',
            },
          },
          {
            selector: 'node[type = "EVENT"]',
            style: {
              'shape': 'triangle',
              'background-color': '#ffe4e6',
              'border-width': 2.5,
              'border-color': '#e11d48',
              'width': 34,
              'height': 34,
              'color': '#be123c',
            },
          },
          {
            selector: 'node[?isCenter]',
            style: {
              'border-width': 5,
              'border-color': '#0284c7',
              'background-color': '#38bdf8',
              'width': 60,
              'height': 60,
              'font-size': '13px',
              'font-weight': 800,
              'color': '#0c4a6e',
            },
          },
          {
            selector: 'edge',
            style: {
              'width': 2,
              'line-color': '#94a3b8',
              'target-arrow-color': '#64748b',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'opacity': 0.75,
              'label': 'data(label)',
              'font-size': '9.5px',
              'font-family': 'Inter, system-ui, sans-serif',
              'font-weight': 600,
              'color': '#334155',
              'text-rotation': 'autorotate',
              'text-margin-y': -7,
              'text-background-color': '#ffffff',
              'text-background-opacity': 0.95,
              'text-background-padding': '3px',
              'text-border-width': 1,
              'text-border-color': '#e2e8f0',
              'text-border-opacity': 0.8,
              'transition-property': 'opacity, width, line-color',
              'transition-duration': 0.2,
            },
          },
          {
            selector: 'edge[category = "DIRECT"]',
            style: {
              'width': 3.5,
              'line-color': '#6366f1',
              'target-arrow-color': '#6366f1',
              'opacity': 0.95,
              'color': '#4338ca',
            },
          },
          {
            selector: 'edge[category = "STRONG"]',
            style: {
              'width': 2.8,
              'line-color': '#0284c7',
              'target-arrow-color': '#0284c7',
              'opacity': 0.9,
              'color': '#0369a1',
            },
          },
          {
            selector: 'edge[category = "MODERATE"]',
            style: {
              'width': 2,
              'line-style': 'dashed',
              'line-color': '#d97706',
              'target-arrow-color': '#d97706',
              'color': '#b45309',
            },
          },
          {
            selector: 'edge[category = "WEAK"]',
            style: {
              'width': 1.5,
              'line-style': 'dotted',
              'line-color': '#cbd5e1',
              'target-arrow-color': '#cbd5e1',
              'color': '#64748b',
            },
          },
          // Highlight classes for focus
          {
            selector: '.dimmed',
            style: {
              'opacity': 0.15,
            },
          },
          {
            selector: '.highlighted-node',
            style: {
              'opacity': 1,
              'border-width': 4,
              'border-color': '#2563eb',
            },
          },
          {
            selector: '.highlighted-edge',
            style: {
              'opacity': 1,
              'width': 4,
              'line-color': '#2563eb',
              'target-arrow-color': '#2563eb',
            },
          },
        ],
        layout: {
          name: layoutName,
          concentric: (node: any) => {
            if (node.data('isCenter')) return 10;
            if (node.data('type') === 'CASE') return 7;
            return 4;
          },
          levelWidth: () => 2,
          minNodeSpacing: 50,
          animate: false, // avoid async frame issues
        },
      });

      // Highlight neighborhood helper
      const highlightNeighborhood = (node: any) => {
        cy.elements().removeClass('highlighted-node highlighted-edge dimmed');
        const neighborhood = node.neighborhood().add(node);
        cy.elements().not(neighborhood).addClass('dimmed');
        node.addClass('highlighted-node');
        neighborhood.nodes().addClass('highlighted-node');
        neighborhood.edges().addClass('highlighted-edge');
      };

      const clearHighlight = () => {
        cy.elements().removeClass('highlighted-node highlighted-edge dimmed');
      };

      cy.on('mouseover', 'node', (evt: EventObject) => {
        const node = evt.target;
        const d = node.data();
        const connectedEdges = node.connectedEdges();
        setHoveredNodeInfo({
          id: d.id,
          label: d.label,
          type: d.type,
          connections: connectedEdges.length,
        });
        highlightNeighborhood(node);
      });

      cy.on('mouseout', 'node', () => {
        setHoveredNodeInfo(null);
        if (!selectedElement) {
          clearHighlight();
        }
      });

      cy.on('tap', 'node', (evt: EventObject) => {
        const node = evt.target;
        const nodeData = node.data();
        setSelectedElement({ type: 'node', data: nodeData });
        highlightNeighborhood(node);
        if (onSelectNode) {
          onSelectNode(nodeData.id, nodeData.type);
        }
      });

      cy.on('tap', 'edge', (evt: EventObject) => {
        const edge = evt.target;
        setSelectedElement({ type: 'edge', data: edge.data() });
      });

      cy.on('tap', (evt: EventObject) => {
        if (evt.target === cy) {
          setSelectedElement(null);
          clearHighlight();
        }
      });

      cyRef.current = cy;
    } catch (err) {
      console.error('Error creating cytoscape instance:', err);
    }

    return () => {
      if (cyRef.current) {
        try {
          cyRef.current.removeAllListeners();
          cyRef.current.stop();
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
  const handleFit = () => cyRef.current?.fit(undefined, 35);

  return (
    <div style={{ position: 'relative', width: '100%', height, backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
      {/* Cytoscape Canvas */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Top Left: Controls & View Mode Toggle */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(6px)',
        padding: '6px 12px',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      }}>
        {/* View Mode Toggle */}
        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
          <button
            onClick={() => setFilterMode('all')}
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: filterMode === 'all' ? '#ffffff' : 'transparent',
              color: filterMode === 'all' ? '#0f172a' : '#64748b',
              boxShadow: filterMode === 'all' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
            }}
          >
            All Entities
          </button>
          <button
            onClick={() => setFilterMode('cases_only')}
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: filterMode === 'cases_only' ? '#ffffff' : 'transparent',
              color: filterMode === 'cases_only' ? '#0284c7' : '#64748b',
              boxShadow: filterMode === 'cases_only' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
            }}
          >
            Cases Only
          </button>
        </div>

        <div style={{ height: '16px', width: '1px', backgroundColor: 'var(--border-subtle)' }} />

        {/* Layout dropdown */}
        <select
          value={layoutName}
          onChange={(e) => setLayoutName(e.target.value as any)}
          style={{
            backgroundColor: '#f8fafc',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            outline: 'none',
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
          }}
        >
          <option value="concentric">Concentric (Hub & Spoke)</option>
          <option value="cose">Force-Directed</option>
          <option value="circle">Circular</option>
          <option value="breadthfirst">Tree Hierarchy</option>
        </select>

        <div style={{ height: '16px', width: '1px', backgroundColor: 'var(--border-subtle)' }} />

        {/* Zoom & Fit */}
        <button onClick={handleZoomIn} className="btn btn-ghost" style={{ padding: '5px' }} title="Zoom In">
          <ZoomIn size={14} />
        </button>
        <button onClick={handleZoomOut} className="btn btn-ghost" style={{ padding: '5px' }} title="Zoom Out">
          <ZoomOut size={14} />
        </button>
        <button onClick={handleFit} className="btn btn-ghost" style={{ padding: '5px' }} title="Fit View">
          <Maximize2 size={14} />
        </button>

        {/* Guide button */}
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
          <span>How to read</span>
        </button>
      </div>

      {/* Top Center: Live Hovered Node Connection Pill */}
      {hoveredNodeInfo && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'none',
        }}>
          <span style={{ textTransform: 'capitalize', color: '#38bdf8' }}>{hoveredNodeInfo.type}:</span>
          <span>{hoveredNodeInfo.label}</span>
          <span style={{ backgroundColor: '#1e293b', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', color: '#94a3b8' }}>
            {hoveredNodeInfo.connections} connected link{hoveredNodeInfo.connections === 1 ? '' : 's'}
          </span>
        </div>
      )}

      {/* Top Right: Entity Type Toggle Filter Pills */}
      {filterMode === 'all' && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '5px',
          zIndex: 10,
        }}>
          {Object.entries(activeTypes).map(([type, isActive]) => {
            const colorMap: Record<string, string> = {
              CASE: '#0284c7',
              PERSON: '#059669',
              LOCATION: '#0891b2',
              VEHICLE: '#d97706',
              OBJECT: '#7c3aed',
              EVENT: '#e11d48',
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
                  transition: 'all 0.15s ease',
                }}
              >
                {type}
              </button>
            );
          })}
        </div>
      )}

      {/* How to Read Popover Guide */}
      {showGuide && (
        <div style={{
          position: 'absolute',
          top: '56px',
          left: '12px',
          width: '380px',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-medium)',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-lg)',
          padding: '16px',
          zIndex: 25,
          fontSize: '12px',
          lineHeight: 1.5,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={15} color="var(--accent-cyan)" />
              <span>How to Read This Relationship Graph</span>
            </div>
            <button onClick={() => setShowGuide(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)' }}>
            <div>
              <strong style={{ color: '#0284c7' }}>1. The Center Node:</strong> The primary focal case under investigation (e.g. <strong>{centerNodeId || 'CASE003'}</strong>) is shown in the center with a bright cyan highlight.
            </div>
            <div>
              <strong style={{ color: '#059669' }}>2. Surrounding Entities:</strong> Green circles are individuals (suspects/victims), yellow hexagons are vehicles, and blue diamonds are crime scenes.
            </div>
            <div>
              <strong style={{ color: '#4f46e5' }}>3. Connecting Lines:</strong> Connecting lines reveal shared evidence (same suspect, identical vehicle, overlapping MO). Thick lines indicate verified forensic or witness links.
            </div>
            <div style={{ backgroundColor: '#f0f9ff', padding: '8px', borderRadius: '6px', color: '#0369a1', fontSize: '11px' }}>
              💡 <strong>Pro Tip:</strong> Click any node to open its full intelligence dossier in the right-hand inspector. Switch to <strong>"Cases Only"</strong> at top-left to see direct case-to-case connections.
            </div>
          </div>
        </div>
      )}

      {/* Bottom Confidence Slider */}
      {onConfidenceChange && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          zIndex: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(6px)',
          padding: '6px 14px',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <Sliders size={13} color="var(--accent-cyan)" />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Min Match Confidence: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{(minConfidence * 100).toFixed(0)}%</strong>
          </span>
          <input
            type="range"
            min="0.2"
            max="0.9"
            step="0.05"
            value={minConfidence}
            onChange={(e) => onConfidenceChange(parseFloat(e.target.value))}
            style={{ width: '90px', cursor: 'pointer' }}
          />
        </div>
      )}

      {/* Element Inspector Drawer */}
      {selectedElement && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          width: '340px',
          maxHeight: '440px',
          overflowY: 'auto',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-medium)',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-lg)',
          padding: '16px',
          zIndex: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              {selectedElement.type === 'node' ? `${selectedElement.data.type} FILE` : 'RELATIONSHIP LINK EXPLAINER'}
            </span>
            <button
              onClick={() => setSelectedElement(null)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
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
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{Array.isArray(v) ? v.join(', ') : String(v || 'N/A')}</span>
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
                  <span>Open Full Case Dossier</span>
                  <ArrowRight size={13} />
                </button>
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

              {onSelectCase && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => onSelectCase(selectedElement.data.source)}
                    className="btn btn-secondary"
                    style={{ flex: 1, fontSize: '11px', padding: '6px' }}
                  >
                    View {selectedElement.data.source}
                  </button>
                  <button
                    onClick={() => onSelectCase(selectedElement.data.target)}
                    className="btn btn-secondary"
                    style={{ flex: 1, fontSize: '11px', padding: '6px' }}
                  >
                    View {selectedElement.data.target}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
