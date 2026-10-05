import React, { useEffect, useState } from 'react';
import { Share2, Sliders, Layers, RefreshCw } from 'lucide-react';
import { GraphData } from '../types/graph';
import { fetchGraph, fetchCases } from '../services/api';
import { GraphViewer } from '../components/GraphViewer';

interface GraphExplorerProps {
  initialCenterId?: string;
  onSelectCase: (caseId: string) => void;
}

export const GraphExplorer: React.FC<GraphExplorerProps> = ({
  initialCenterId,
  onSelectCase,
}) => {
  const [centerId, setCenterId] = useState(initialCenterId || 'CASE003');
  const [depth, setDepth] = useState<number>(1);
  const [minConfidence, setMinConfidence] = useState(0.40);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [availableCases, setAvailableCases] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCaseList() {
      try {
        const res = await fetchCases({ page: 1, page_size: 120 });
        const ids = (res.cases || []).map((c: any) => c.case_id);
        setAvailableCases(ids);
      } catch (err) {
        console.error(err);
      }
    }
    loadCaseList();
  }, []);

  useEffect(() => {
    loadGraph();
  }, [centerId, depth, minConfidence]);

  async function loadGraph() {
    try {
      setLoading(true);
      const data = await fetchGraph({
        center_id: centerId,
        depth,
        min_confidence: minConfidence,
      });
      setGraphData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Share2 size={24} color="var(--accent-cyan)" />
            <span>Interactive Knowledge Graph Explorer</span>
          </h1>
          <p className="page-subtitle">
            Visual multi-hop network intelligence with dynamic depth traversal and edge explainability.
          </p>
        </div>

        {/* Global Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Focal Case Selection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Center Focal Node:</span>
            <select
              className="form-input"
              value={centerId}
              onChange={(e) => setCenterId(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}
            >
              {availableCases.map((cid) => (
                <option key={cid} value={cid}>
                  {cid}
                </option>
              ))}
            </select>
          </div>

          {/* Depth selection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Depth:</span>
            <button
              onClick={() => setDepth(1)}
              className={`btn ${depth === 1 ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '11px', padding: '5px 10px' }}
            >
              1 Hop
            </button>
            <button
              onClick={() => setDepth(2)}
              className={`btn ${depth === 2 ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '11px', padding: '5px 10px' }}
            >
              2 Hops (Multi-hop)
            </button>
          </div>

          <button
            onClick={loadGraph}
            className="btn btn-secondary"
            style={{ padding: '6px 12px' }}
            title="Refresh Graph"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Graph Canvas */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '620px', color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>
          Constructing network topology and projecting relationships...
        </div>
      ) : (
        <GraphViewer
          data={graphData}
          centerNodeId={centerId}
          onSelectCase={onSelectCase}
          minConfidence={minConfidence}
          onConfidenceChange={setMinConfidence}
          height="680px"
        />
      )}

      {/* Graph Legend & Navigation notes */}
      <div className="glass-panel" style={{ padding: '16px', marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', fontSize: '12px' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Node Legend:</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--entity-case)' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--entity-case)', borderRadius: '2px' }} /> Case File
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--entity-person)' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--entity-person)', borderRadius: '50%' }} /> Person / Witness
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--entity-location)' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--entity-location)', transform: 'rotate(45deg)' }} /> Location / Scene
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--entity-vehicle)' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--entity-vehicle)', borderRadius: '2px' }} /> Vehicle
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--entity-object)' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--entity-object)', borderRadius: '2px' }} /> Target Object
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--entity-event)' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--entity-event)', borderRadius: '2px' }} /> Event
          </span>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Click any node or relationship edge to open full inspector panel.
        </div>
      </div>
    </div>
  );
};
