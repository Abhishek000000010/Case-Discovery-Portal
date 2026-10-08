import React, { useEffect, useState } from 'react';
import { Compass, AlertTriangle, MapPin, Tag, ShieldCheck, Layers, Calendar, Clock, Crosshair } from 'lucide-react';
import { fetchPatterns, fetchAnomalies } from '../services/api';
import { AnomalyCard } from '../components/AnomalyCard';
import { CasePattern, AnomalyItem } from '../types/relationship';

interface PatternsProps {
  onSelectCase: (caseId: string) => void;
  onExploreGraph: (entityId: string) => void;
}

export const Patterns: React.FC<PatternsProps> = ({ onSelectCase, onExploreGraph }) => {
  const [patterns, setPatterns] = useState<CasePattern[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [patData, anomData] = await Promise.all([
          fetchPatterns(),
          fetchAnomalies(),
        ]);
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
            <span>Recurrent Incident Patterns & Statistical Outliers</span>
          </h1>
          <p className="page-subtitle">
            Autonomous empirical mining of recurring multi-incident profiles, weapon tactics in urban centers, and investigative outliers across 40,160 cases.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>
          Computing recurring empirical patterns and anomaly distributions from real dataset...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Section 1: Behavioral & Empirical Crime Series */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Layers size={18} color="var(--accent-indigo)" />
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Empirically Discovered Incident Patterns ({patterns.length})
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
              {patterns.map((pat) => (
                <div
                  key={pat.pattern_id}
                  className="glass-panel"
                  style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '3px solid var(--accent-indigo)' }}
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
                        {pat.crime_description}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-indigo)', fontFamily: 'var(--font-mono)', backgroundColor: '#f5f3ff', padding: '2px 7px', borderRadius: '4px' }}>
                        {pat.case_count} Occurrences
                      </span>
                    </div>

                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                      {pat.name}
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
                      {pat.description}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <MapPin size={12} color="var(--accent-emerald)" />
                        <span>City: <strong>{pat.city}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Crosshair size={12} color="var(--accent-purple)" />
                        <span>Weapon: <strong>{pat.weapon}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={12} color="var(--accent-cyan)" />
                        <span>Window: <strong>{pat.time_window}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
                      Corroborating Cases Sample:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {(pat.case_ids || []).slice(0, 10).map((cid: string) => (
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

          {/* Section 2: Investigative Anomalies */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <AlertTriangle size={18} color="var(--accent-amber)" />
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Statistical Anomalies & Investigation Outliers ({anomalies.length})
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
                <strong>Investigative Ethics & Analytical Notice:</strong> These anomalies detect statistical outliers in police deployment counts, reporting delays, and investigation closure durations based strictly on empirical distributions.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
              {anomalies.map((anom) => (
                <AnomalyCard
                  key={anom.anomaly_id}
                  anomaly={anom}
                  onSelectCase={onSelectCase}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
