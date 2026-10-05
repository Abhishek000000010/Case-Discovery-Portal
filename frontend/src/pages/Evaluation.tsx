import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, XCircle, Sliders, RefreshCw, Shield, HelpCircle } from 'lucide-react';
import { fetchEvaluation } from '../services/api';

interface EvaluationProps {
  onSelectCase: (caseId: string) => void;
}

export const Evaluation: React.FC<EvaluationProps> = ({ onSelectCase }) => {
  const [evalResult, setEvalResult] = useState<any>(null);
  const [threshold, setThreshold] = useState(0.50);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runEvaluation();
  }, [threshold]);

  async function runEvaluation() {
    try {
      setLoading(true);
      const res = await fetchEvaluation(threshold);
      setEvalResult(res);
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
            <CheckCircle2 size={24} color="var(--accent-emerald)" />
            <span>Benchmark Ground-Truth Evaluation</span>
          </h1>
          <p className="page-subtitle">
            Scientific evaluation measuring engine discovery performance against isolated benchmark test ground truth.
          </p>
        </div>

        {/* Confidence slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-surface)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <Sliders size={14} color="var(--accent-cyan)" />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Confidence Cutoff: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{(threshold * 100).toFixed(0)}%</strong>
            </span>
            <input
              type="range"
              min="0.30"
              max="0.80"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              style={{ width: '90px', cursor: 'pointer' }}
            />
          </div>

          <button
            onClick={runEvaluation}
            className="btn btn-secondary"
            style={{ padding: '6px 12px' }}
          >
            <RefreshCw size={13} />
            <span>Recalculate</span>
          </button>
        </div>
      </div>

      {/* Critical Architecture Notice */}
      <div style={{
        padding: '14px 18px',
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '8px',
        fontSize: '12.5px',
        color: '#0369a1',
        marginBottom: '20px',
        lineHeight: 1.5,
      }}>
        <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Shield size={15} /> STRICT ISOLATION ARCHITECTURE:
        </div>
        <div>
          The production relationship discovery engine executes completely autonomously without access to ground truth. Ground truth data is exclusively accessed by this evaluation service for validation and metrics reporting.
        </div>
      </div>

      {loading || !evalResult ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>
          Computing benchmark confusion matrix and negative controls...
        </div>
      ) : (
        <div>
          {/* Key Evaluation Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}>
            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>RECALL ON GROUND TRUTH</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                {(evalResult.metrics.recall * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {evalResult.metrics.matched_relationships} of {evalResult.metrics.ground_truth_total} benchmark pairs detected
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>DISCOVERED CANDIDATES</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {evalResult.metrics.discovered_total}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Autonomous relationship hypotheses
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>BENCHMARK PRECISION</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-indigo)', fontFamily: 'var(--font-mono)' }}>
                {(evalResult.metrics.precision * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Relative to incomplete synthetic benchmark
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>F1 COMPOSITE SCORE</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-purple)', fontFamily: 'var(--font-mono)' }}>
                {evalResult.metrics.f1_score.toFixed(3)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Harmonic mean of precision and recall
              </div>
            </div>
          </div>

          {/* Category-Level Evaluation Table (Requirement #27) */}
          {evalResult.category_level_evaluation && (
            <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <CheckCircle2 size={16} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Category-Level Ground Truth Recall Breakdown
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Detailed evaluation of relationship discovery across distinct categories (MO, behavioural sequences, patterns, entities, and spatial-temporal correlations).
              </p>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-medium)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '8px 10px', textTransform: 'uppercase', fontSize: '11px' }}>Relationship Category</th>
                      <th style={{ padding: '8px 10px', textTransform: 'uppercase', fontSize: '11px' }}>Ground Truth Benchmark</th>
                      <th style={{ padding: '8px 10px', textTransform: 'uppercase', fontSize: '11px' }}>Engine Detected</th>
                      <th style={{ padding: '8px 10px', textTransform: 'uppercase', fontSize: '11px' }}>Category Recall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(evalResult.category_level_evaluation).map(([cat, val]: [string, any]) => (
                      <tr key={cat} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                          {cat.replace(/_/g, ' ')}
                        </td>
                        <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                          {val.ground_truth_count}
                        </td>
                        <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                          {val.detected_count}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            backgroundColor: val.recall >= 0.8 ? '#dcfce7' : val.recall >= 0.5 ? '#fef3c7' : '#f1f5f9',
                            color: val.recall >= 0.8 ? '#15803d' : val.recall >= 0.5 ? '#b45309' : '#64748b',
                          }}>
                            {val.detection_rate_pct}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Matched Samples & Negative Control Checks */}
          <div className="grid-two-col">
            {/* Matched Samples */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="var(--accent-emerald)" />
                <span>Verified Ground-Truth Matches (Sample)</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {evalResult.matched_samples?.map((m: any, idx: number) => {
                  const [c1, c2] = m.case_pair.split(' ↔ ');
                  return (
                    <div key={idx} style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                          {m.case_pair}
                        </span>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
                          {(m.confidence * 100).toFixed(0)}% Conf
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                        Discovered: <strong>{m.discovered_type}</strong> • GT: <strong>{m.gt_type}</strong>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {m.evidence?.join('; ')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Negative Control Checks */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={16} color="var(--accent-cyan)" />
                <span>Negative Control Specificity Validation</span>
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Testing engine selectivity against un-correlated case pairs to ensure the algorithm does not produce false phantom links.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {evalResult.negative_control_checks?.map((nc: any, idx: number) => (
                  <div key={idx} style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {nc.case_pair}
                      </span>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Unrelated cross-type control test
                      </div>
                    </div>

                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono)',
                      backgroundColor: nc.correctly_rejected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                      color: nc.correctly_rejected ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                      border: `1px solid ${nc.correctly_rejected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                    }}>
                      {nc.correctly_rejected ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      <span>{nc.correctly_rejected ? 'CORRECTLY REJECTED' : 'FALSE POSITIVE'}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
