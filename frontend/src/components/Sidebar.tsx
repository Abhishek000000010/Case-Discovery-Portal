import React from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  Share2,
  Users,
  Compass,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'cases' | 'case-detail' | 'graph' | 'entities' | 'patterns' | 'evaluation';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  selectedCaseId?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  selectedCaseId,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cases', label: 'Cases Repository', icon: FolderGit2 },
    { id: 'graph', label: 'Graph Explorer', icon: Share2 },
    { id: 'entities', label: 'Entities & People', icon: Users },
    { id: 'patterns', label: 'Patterns & Anomalies', icon: Compass },
    { id: 'evaluation', label: 'Benchmark Evaluation', icon: CheckCircle2 },
  ];

  return (
    <aside style={{
      width: '250px',
      height: '100vh',
      backgroundColor: '#ffffff',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '20px 18px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}>
            <ShieldCheck size={18} />
          </div>
          <div>
            <h1 style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.02em', color: 'var(--text-primary)', lineHeight: 1.2 }}>
              INTELLIGENCE
            </h1>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Case Discovery Portal
            </span>
          </div>
        </div>

        <div style={{
          marginTop: '6px',
          padding: '3px 8px',
          background: '#f8fafc',
          border: '1px solid var(--border-subtle)',
          borderRadius: '4px',
          fontSize: '10px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          textAlign: 'center',
          fontWeight: 600,
        }}>
          DECISION SUPPORT SYSTEM
        </div>
      </div>

      {/* Nav List */}
      <nav style={{ flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 10px 8px', fontWeight: 700 }}>
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id as NavTab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                background: isActive ? '#f0f9ff' : 'transparent',
                color: isActive ? '#0284c7' : 'var(--text-secondary)',
                border: isActive ? '1px solid #bae6fd' : '1px solid transparent',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Icon size={16} color={isActive ? '#0284c7' : 'var(--text-muted)'} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {selectedCaseId && (
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 10px 6px', fontWeight: 700 }}>
              Active Dossier
            </div>
            <button
              onClick={() => onSelectTab('case-detail')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                background: currentTab === 'case-detail' ? '#f0fdf4' : '#f8fafc',
                color: currentTab === 'case-detail' ? '#15803d' : 'var(--text-primary)',
                border: currentTab === 'case-detail' ? '1px solid #bbf7d0' : '1px solid var(--border-subtle)',
                fontSize: '12px',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#15803d' }} />
              <span>{selectedCaseId}</span>
            </button>
          </div>
        )}
      </nav>

      {/* Dataset Notice Footer */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: '#f8fafc',
        fontSize: '11px',
        color: 'var(--text-muted)',
      }}>
        <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>
          Synthetic Benchmark
        </div>
        <div>120 Cases • Non-real records for intelligence evaluation.</div>
      </div>
    </aside>
  );
};
