import React from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  Share2,
  Building2,
  Compass,
  CheckCircle2,
  ShieldCheck,
  Fingerprint,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'cases'
  | 'case-detail'
  | 'graph'
  | 'intelligence-graph'
  | 'entities'
  | 'patterns';

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
    { id: 'intelligence-graph', label: 'Case Intelligence', icon: Fingerprint },
    { id: 'entities', label: 'Entity Directory', icon: Building2 },
    { id: 'patterns', label: 'Patterns & Anomalies', icon: Compass },
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
            color: '#ffffff',
          }}>
            <ShieldCheck size={18} />
          </div>
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}>
              Crime Intelligence
            </div>
            <div style={{
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              Discovery Portal
            </div>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{
        flex: 1,
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        overflowY: 'auto',
      }}>
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
                gap: '12px',
                padding: '9px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: isActive ? '#f0f9ff' : 'transparent',
                color: isActive ? '#0284c7' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'background-color 0.15s, color 0.15s',
              }}
            >
              <Icon size={16} color={isActive ? '#0284c7' : 'var(--text-muted)'} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Active Selected Case Indicator */}
        {selectedCaseId && (
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              padding: '0 12px 6px',
            }}>
              Active Investigation
            </div>
            <button
              onClick={() => onSelectTab('case-detail')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: currentTab === 'case-detail' ? '1px solid #bae6fd' : '1px solid transparent',
                backgroundColor: currentTab === 'case-detail' ? '#f0f9ff' : '#f8fafc',
                color: currentTab === 'case-detail' ? '#0284c7' : 'var(--text-secondary)',
                width: '100%',
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
        <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
          Dual Graph Architecture
        </div>
        <div>• Real Network: 40,160 Cases</div>
        <div>• Case Intelligence: 15 Demo Cases</div>
      </div>
    </aside>
  );
};
