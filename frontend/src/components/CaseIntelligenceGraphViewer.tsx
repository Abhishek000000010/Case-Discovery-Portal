import React, { useEffect, useRef, useState, useMemo } from 'react';
import cytoscape, { Core, EventObject } from 'cytoscape';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
} from 'lucide-react';
import {
  CaseEntityNode,
  CaseEntityEdge,
  EntityType,
} from '../types/intelligenceGraph';
import { CaseEntityDetailDrawer } from './CaseEntityDetailDrawer';
import { CaseRelationshipExplanationDrawer } from './CaseRelationshipExplanationDrawer';

interface CaseIntelligenceGraphViewerProps {
  nodes: CaseEntityNode[];
  edges: CaseEntityEdge[];
  caseId: string;
  selectedEventId?: string | null;
  onSelectEvent?: (eventId: string) => void;
  searchTerm?: string;
  activeTypes: Record<EntityType, boolean>;
  height?: string;
}

export const CaseIntelligenceGraphViewer: React.FC<CaseIntelligenceGraphViewerProps> = ({
  nodes,
  edges,
  caseId,
  selectedEventId,
  onSelectEvent,
  searchTerm = '',
  activeTypes,
  height = '640px',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const [layoutName, setLayoutName] = useState<'concentric' | 'cose' | 'breadthfirst' | 'circle'>('concentric');
  const [selectedNode, setSelectedNode] = useState<CaseEntityNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<CaseEntityEdge | null>(null);

  // Filter nodes based on active type checkboxes
  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (n.type === 'CASE') return true; // Always keep root case
      return activeTypes[n.type] ?? true;
    });
  }, [nodes, activeTypes]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  // Filter edges based on active nodes
  const filteredEdges = useMemo(() => {
    return edges.filter((e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target));
  }, [edges, filteredNodeIds]);

  // Cytoscape initialization and updates
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

    const elements: any[] = [];

    // Transform nodes
    filteredNodes.forEach((n) => {
      const isRoot = n.id === caseId || n.type === 'CASE';
      elements.push({
        group: 'nodes',
        data: {
          id: n.id,
          label: n.label,
          type: n.type,
          role: n.role || '',
          depth: n.depth,
          isRoot,
        },
      });
    });

    // Transform edges
    filteredEdges.forEach((e) => {
      elements.push({
        group: 'edges',
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          relationship_mode: e.relationship_mode,
          relationship_type: e.relationship_type,
        },
      });
    });

    try {
      const cy = cytoscape({
        container: containerRef.current,
        elements,
        boxSelectionEnabled: false,
        autounselectify: false,
        wheelSensitivity: 0.25,
        style: [
          // Base Node Style
          {
            selector: 'node',
            style: {
              'label': 'data(label)',
              'text-valign': 'bottom',
              'text-halign': 'center',
              'text-margin-y': 6,
              'font-size': '11px',
              'font-family': 'Inter, system-ui, sans-serif',
              'font-weight': 600,
              'color': '#1e293b',
              'text-background-opacity': 0.85,
              'text-background-color': '#ffffff',
              'text-background-padding': '3px',
              'text-background-shape': 'roundrectangle',
              'border-width': 2,
              'border-color': '#cbd5e1',
              'background-color': '#f8fafc',
              'width': 36,
              'height': 36,
              'transition-property': 'background-color, line-color, target-arrow-color, opacity, border-width, width, height',
              'transition-duration': 0.2,
            },
          },

          // ROOT CASE NODE (Emphasized)
          {
            selector: 'node[?isRoot], node[type = "CASE"]',
            style: {
              'background-color': '#0369a1',
              'border-color': '#0284c7',
              'border-width': 4,
              'width': 54,
              'height': 54,
              'shape': 'round-rectangle',
              'font-size': '12px',
              'font-weight': 700,
              'color': '#0369a1',
              'overlay-color': '#0284c7',
              'overlay-opacity': 0.15,
              'overlay-padding': 6,
            },
          },

          // PERSON NODES
          {
            selector: 'node[type = "PERSON"]',
            style: {
              'shape': 'ellipse',
              'width': 38,
              'height': 38,
              'background-color': '#059669',
              'border-color': '#10b981',
            },
          },
          // Person Role Variants
          {
            selector: 'node[role = "suspect"]',
            style: {
              'background-color': '#e11d48',
              'border-color': '#f43f5e',
            },
          },
          {
            selector: 'node[role = "victim"]',
            style: {
              'background-color': '#d97706',
              'border-color': '#f59e0b',
            },
          },
          {
            selector: 'node[role = "witness"]',
            style: {
              'background-color': '#0284c7',
              'border-color': '#38bdf8',
            },
          },

          // LOCATION NODES
          {
            selector: 'node[type = "LOCATION"]',
            style: {
              'shape': 'diamond',
              'width': 38,
              'height': 38,
              'background-color': '#10b981',
              'border-color': '#34d399',
            },
          },

          // WEAPON NODES
          {
            selector: 'node[type = "WEAPON"]',
            style: {
              'shape': 'triangle',
              'width': 36,
              'height': 36,
              'background-color': '#dc2626',
              'border-color': '#f87171',
            },
          },

          // VEHICLE NODES
          {
            selector: 'node[type = "VEHICLE"]',
            style: {
              'shape': 'round-rectangle',
              'width': 42,
              'height': 30,
              'background-color': '#ea580c',
              'border-color': '#fb923c',
            },
          },

          // OBJECT NODES
          {
            selector: 'node[type = "OBJECT"]',
            style: {
              'shape': 'rectangle',
              'width': 34,
              'height': 34,
              'background-color': '#4f46e5',
              'border-color': '#818cf8',
            },
          },

          // EVENT NODES
          {
            selector: 'node[type = "EVENT"]',
            style: {
              'shape': 'hexagon',
              'width': 40,
              'height': 40,
              'background-color': '#7c3aed',
              'border-color': '#a78bfa',
            },
          },

          // EVIDENCE NODES
          {
            selector: 'node[type = "EVIDENCE"]',
            style: {
              'shape': 'pentagon',
              'width': 36,
              'height': 36,
              'background-color': '#d97706',
              'border-color': '#fbbf24',
            },
          },

          // BASE EDGE STYLES (Solid for Explicit)
          {
            selector: 'edge',
            style: {
              'width': 1.8,
              'line-color': '#94a3b8',
              'target-arrow-color': '#94a3b8',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'arrow-scale': 0.9,
              'label': 'data(label)',
              'font-size': '9px',
              'font-family': 'var(--font-mono)',
              'font-weight': 600,
              'color': '#475569',
              'text-rotation': 'autorotate',
              'text-background-opacity': 0.9,
              'text-background-color': '#ffffff',
              'text-background-padding': '2px',
              'text-background-shape': 'roundrectangle',
              'text-margin-y': -4,
              'opacity': 0.85,
            },
          },

          // DERIVED EDGE STYLES (Dashed for Derived / Inferred)
          {
            selector: 'edge[relationship_mode = "derived"]',
            style: {
              'line-style': 'dashed',
              'line-dash-pattern': [6, 3],
              'line-color': '#8b5cf6',
              'target-arrow-color': '#8b5cf6',
              'width': 2,
              'color': '#6d28d9',
            },
          },

          // SELECTION & SPOTLIGHT STYLES
          {
            selector: 'node.selected-node',
            style: {
              'border-width': 4,
              'border-color': '#0284c7',
              'overlay-color': '#0284c7',
              'overlay-opacity': 0.25,
              'overlay-padding': 6,
            },
          },
          {
            selector: 'node.spotlighted',
            style: {
              'border-width': 4,
              'border-color': '#7c3aed',
              'overlay-color': '#7c3aed',
              'overlay-opacity': 0.25,
              'overlay-padding': 6,
            },
          },
          {
            selector: 'edge.spotlighted',
            style: {
              'line-color': '#7c3aed',
              'target-arrow-color': '#7c3aed',
              'width': 3,
              'opacity': 1,
            },
          },
          {
            selector: '.dimmed',
            style: {
              'opacity': 0.15,
            },
          },
        ],
      });

      // Apply Layout
      let layoutOptions: any;
      if (layoutName === 'concentric') {
        layoutOptions = {
          name: 'concentric',
          concentric: (node: any) => {
            if (node.data('isRoot')) return 10;
            if (node.data('type') === 'EVENT') return 6;
            if (node.data('type') === 'PERSON') return 4;
            return 2;
          },
          levelWidth: () => 2,
          padding: 40,
          animate: true,
          animationDuration: 300,
        };
      } else if (layoutName === 'cose') {
        layoutOptions = {
          name: 'cose',
          padding: 40,
          componentSpacing: 100,
          nodeOverlap: 20,
          animate: true,
          animationDuration: 400,
        };
      } else if (layoutName === 'breadthfirst') {
        layoutOptions = {
          name: 'breadthfirst',
          roots: `#${caseId}`,
          directed: true,
          padding: 40,
          spacingFactor: 1.25,
          animate: true,
          animationDuration: 300,
        };
      } else {
        layoutOptions = {
          name: 'circle',
          padding: 40,
          animate: true,
          animationDuration: 300,
        };
      }

      const layout = cy.layout(layoutOptions);
      layout.run();

      // Node Click Handler
      cy.on('tap', 'node', (evt: EventObject) => {
        const clickedCyNode = evt.target;
        const clickedId = clickedCyNode.id();
        const found = filteredNodes.find((n) => n.id === clickedId);
        if (found) {
          setSelectedNode(found);
          setSelectedEdge(null);

          // If clicked node is an event, notify timeline
          if (found.type === 'EVENT' && onSelectEvent) {
            onSelectEvent(found.id);
          }
        }
      });

      // Edge Click Handler
      cy.on('tap', 'edge', (evt: EventObject) => {
        const clickedCyEdge = evt.target;
        const edgeId = clickedCyEdge.id();
        const found = filteredEdges.find((e) => e.id === edgeId);
        if (found) {
          setSelectedEdge(found);
          setSelectedNode(null);
        }
      });

      // Background click
      cy.on('tap', (evt: EventObject) => {
        if (evt.target === cy) {
          setSelectedNode(null);
          setSelectedEdge(null);
        }
      });

      cyRef.current = cy;
    } catch (err) {
      console.error('Failed to initialize Cytoscape for Case Intelligence:', err);
    }
  }, [filteredNodes, filteredEdges, caseId, layoutName]);

  // Synchronize Spotlight with selected timeline event or search term
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.elements().removeClass('spotlighted dimmed');

    // Case 1: An event is selected from the timeline
    if (selectedEventId) {
      const evtNode = cy.getElementById(selectedEventId);
      if (evtNode && evtNode.length > 0) {
        // Collect connected elements
        const connectedEdges = evtNode.connectedEdges();
        const connectedNodes = evtNode.neighborhood().nodes();

        cy.elements().addClass('dimmed');
        evtNode.removeClass('dimmed').addClass('spotlighted');
        connectedEdges.removeClass('dimmed').addClass('spotlighted');
        connectedNodes.removeClass('dimmed');

        // Smoothly animate pan to event node
        cy.animate({
          center: { eles: evtNode },
          zoom: 1.25,
          duration: 350,
        });

        // Also open detail drawer for the event element
        const matched = filteredNodes.find((n) => n.id === selectedEventId);
        if (matched) {
          setSelectedNode(matched);
        }
        return;
      }
    }

    // Case 2: Search term within case is active
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      const matchingNodes = cy.nodes().filter((node) => {
        const label = (node.data('label') || '').toLowerCase();
        const id = (node.data('id') || '').toLowerCase();
        const type = (node.data('type') || '').toLowerCase();
        const role = (node.data('role') || '').toLowerCase();
        return label.includes(term) || id.includes(term) || type.includes(term) || role.includes(term);
      });

      if (matchingNodes.length > 0) {
        cy.elements().addClass('dimmed');
        matchingNodes.removeClass('dimmed').addClass('spotlighted');
        const edgesBetween = matchingNodes.edgesWith(matchingNodes);
        edgesBetween.removeClass('dimmed').addClass('spotlighted');

        cy.animate({
          fit: { eles: matchingNodes, padding: 50 },
          duration: 300,
        });
      }
    }
  }, [selectedEventId, searchTerm]);

  const handleZoomIn = () => {
    if (cyRef.current) cyRef.current.zoom(cyRef.current.zoom() * 1.25);
  };

  const handleZoomOut = () => {
    if (cyRef.current) cyRef.current.zoom(cyRef.current.zoom() * 0.8);
  };

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.elements().removeClass('spotlighted dimmed');
      cyRef.current.fit(undefined, 40);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height, backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
      {/* Cytoscape Canvas Container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating Toolbar Controls */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#ffffff',
          padding: '6px 10px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          border: '1px solid var(--border-subtle)',
          zIndex: 10,
        }}
      >
        {/* Layout switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <Layers size={13} color="#0284c7" />
          <select
            className="form-input"
            value={layoutName}
            onChange={(e) => setLayoutName(e.target.value as any)}
            style={{ fontSize: '11px', padding: '3px 8px', height: '26px' }}
          >
            <option value="concentric">Concentric (Root Center)</option>
            <option value="breadthfirst">Hierarchical (Tree)</option>
            <option value="cose">Force-Directed (Spread)</option>
            <option value="circle">Circular</option>
          </select>
        </div>

        <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-subtle)', margin: '0 4px' }} />

        {/* Zoom Controls */}
        <button
          onClick={handleZoomIn}
          style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-secondary)' }}
          title="Zoom In"
        >
          <ZoomIn size={15} />
        </button>
        <button
          onClick={handleZoomOut}
          style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-secondary)' }}
          title="Zoom Out"
        >
          <ZoomOut size={15} />
        </button>
        <button
          onClick={handleFit}
          style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-secondary)' }}
          title="Fit & Reset View"
        >
          <Maximize2 size={15} />
        </button>
      </div>

      {/* Floating Legend / Hint */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '11px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
          zIndex: 10,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#15803d', fontWeight: 600 }}>
          <span style={{ width: '14px', height: '2px', backgroundColor: '#94a3b8' }} /> Explicit Relationship
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#7e22ce', fontWeight: 600 }}>
          <span style={{ width: '14px', height: '2px', borderTop: '2px dashed #8b5cf6' }} /> Derived Progression
        </span>
        <span style={{ color: 'var(--text-muted)' }}>• Click any node or edge for deep explanation</span>
      </div>

      {/* Entity Detail Drawer */}
      <CaseEntityDetailDrawer
        node={selectedNode}
        edges={edges}
        allNodes={nodes}
        onClose={() => setSelectedNode(null)}
        onSelectConnectedNode={(id) => {
          const target = nodes.find((n) => n.id === id);
          if (target) setSelectedNode(target);
        }}
      />

      {/* Relationship Explanation Drawer */}
      <CaseRelationshipExplanationDrawer
        edge={selectedEdge}
        allNodes={nodes}
        onClose={() => setSelectedEdge(null)}
        onSelectNode={(id) => {
          const target = nodes.find((n) => n.id === id);
          if (target) {
            setSelectedNode(target);
            setSelectedEdge(null);
          }
        }}
      />
    </div>
  );
};
