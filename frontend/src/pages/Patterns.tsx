import React, { useEffect, useState } from 'react';
import { Compass, AlertTriangle, MapPin, Tag, ArrowRight, ShieldCheck, Layers, Calendar, Clock } from 'lucide-react';
import { fetchPatterns, fetchAnomalies, fetchClusters } from '../services/api';
import { AnomalyCard } from '../components/AnomalyCard';
import { CaseCluster } from '../types/relationship';

interface PatternsProps {
  onSelectCase: (caseId: string) => void;
  onExploreGraph: (entityId: string) => void;
}

export const Patterns: React.FC<PatternsProps> = ({ onSelectCase, onExploreGraph }) => {
  const [clusters, setClusters] = useState<CaseCluster[]>([]);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [clusterData, patData, anomData] = await Promise.all([
          fetchClusters().catch(() => []),
          fetchPatterns(),
          fetchAnomalies(),
        ]);
        setClusters(clusterData);
        setPatterns(patData);
        setAnomalies(anomData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Compass size={24} color="var(--accent-cyan)" />
            <span>Behavioral Patterns & Anomaly Detection</span>
          </h1>
          <p className="page-subtitle">
            Autonomous detection of recurring Modus Operandi techniques, geographic crime clusters, and unusual entity recurrence.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>
          Computing recurring behavioral patterns and anomaly signatures...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Section 1: Discovered Multi-Case Semantic Clusters (Agglomerative Feature Vectors) */}
          {clusters && clusters.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Layers size={18} color="var(--accent-indigo)" />
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Discovered Case Clusters & Series ({clusters.length})
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                {clusters.map((cl) => (
                  <div
                    key={cl.cluster_id}
                    className="glass-panel"
                    style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '3px solid var(--accent-indigo)' }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span style={{
                          fontSize: '10.5px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: '#4338ca',
                          padding: '2px 8px',
                          backgroundColor: '#e0e7ff',
                          borderRadius: '4px',
                        }}>
                          {cl.dominant_crime_type.replace(/_/g, ' ')}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-indigo)', fontFamily: 'var(--font-mono)', backgroundColor: '#f5f3ff', padding: '2px 7px', borderRadius: '4px' }}>
                          {cl.case_count} Cases
                        </span>
                      </div>

                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                        {cl.name}
                      </div>

                      <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '12px' }}>
                        {cl.narrative_summary}
                      </p>

                      {/* Common MO */}
                      {cl.common_mo && cl.common_mo.length > 0 && (
                        <div style={{ marginBottom: '10px' }}>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                            Common Behaviour / MO:
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {cl.common_mo.map((mo, i) => (
                              <span key={i} style={{ fontSize: '10.5px', backgroundColor: '#f1f5f9', color: 'var(--text-secondary)', padding: '1px 6px', borderRadius: '3px' }}>
                                {mo}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Locations & Time Period */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                        {cl.locations && cl.locations.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={11} color="var(--accent-cyan)" />
                            <span>Locations: {cl.locations.join(', ')}</span>
                          </div>
                        )}
                        {cl.time_period && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={11} color="var(--accent-blue)" />
                            <span>Time Span: {cl.time_period}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
                        Clustered Case Files:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {cl.case_ids.map((cid: string) => (
                          <button
                            key={cid}
                            onClick={() => onSelectCase(cid)}
                            style={{
                              fontSize: '11px',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #cbd5e1',
                              color: 'var(--accent-indigo)',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {cid}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Behavioral & Geographic Series */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Tag size={18} color="var(--accent-cyan)" />
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Recurring Modus Operandi & Tactical Series ({patterns.length})
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
              {patterns.map((pat) => (
                <div
                  key={pat.pattern_id}
                  className="glass-panel"
                  style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--accent-cyan)',
                        padding: '2px 8px',
                        backgroundColor: '#e0f2fe',
                        border: '1px solid #bae6fd',
                        borderRadius: '4px',
                      }}>
                        {pat.category}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Confidence: {(pat.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                      {pat.title}
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                      {pat.description}
                    </p>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
                      Corroborating Cases ({pat.case_ids.length}):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {pat.case_ids.map((cid: string) => (
                        <button
                          key={cid}
                          onClick={() => onSelectCase(cid)}
                          style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            color: 'var(--accent-cyan)',
                            fontFamily: 'var(--font-mono)',
                            cursor: 'pointer',
                          }}
                        >
                          {cid}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Entity Recurrence Flags & Anomalies */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <AlertTriangle size={18} color="var(--accent-amber)" />
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Cross-Case Entity Frequency Flags ({anomalies.length})
              </h2>
            </div>

            <div style={{
              padding: '12px 16px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#92400e',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <ShieldCheck size={16} />
              <span>
                <strong>Investigative Ethics Notice:</strong> Entity recurrence does not constitute proof of culpability or fraud. These statistical indicators flag cross-incident overlap to assist investigative prioritization.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
              {anomalies.map((anom, idx) => (
                <AnomalyCard
                  key={idx}
                  anomaly={anom}
                  onSelectCase={onSelectCase}
                  onExploreGraph={onExploreGraph}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
