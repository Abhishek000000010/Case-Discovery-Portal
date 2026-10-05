import React from 'react';
import { Shield, FileText } from 'lucide-react';
import { CaseEvidence, CaseWitness } from '../types/case';

interface EvidencePanelProps {
  evidence: CaseEvidence[];
  witnesses: CaseWitness[];
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ evidence, witnesses }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
      {/* Evidence items */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Shield size={14} /> Physical & Digital Evidence ({evidence.length})
        </div>

        {evidence.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
            No physical/digital evidence registered.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {evidence.map((ev) => (
              <div key={ev.evidence_id} style={{ padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-purple)', fontWeight: 600 }}>
                    {ev.evidence_id}
                  </span>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    {ev.type.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {ev.description || 'No description available'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Witnesses */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileText size={14} /> Witness Statements ({witnesses.length})
        </div>

        {witnesses.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
            No witness statements recorded.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {witnesses.map((w, idx) => (
              <div key={idx} style={{ padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-person)', fontWeight: 600 }}>
                    {w.person_id}
                  </span>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {w.statement_id ? `Statement Ref: ${w.statement_id}` : 'Recorded statement on file'}
                  </div>
                </div>
                <span className="badge badge-low" style={{ fontSize: '10px' }}>
                  Statement
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
