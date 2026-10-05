import React, { useState, useEffect, useRef } from 'react';
import { Search, RotateCw, Activity, X, User, Car, FileText } from 'lucide-react';
import { fetchGlobalSearch, rebuildRelationships } from '../services/api';

interface TopBarProps {
  onSelectCase: (caseId: string) => void;
  onNavigate: (tab: any) => void;
  onRebuildComplete?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onSelectCase,
  onNavigate,
  onRebuildComplete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const data = await fetchGlobalSearch(searchQuery);
        setResults(data);
        setIsOpen(true);
      } catch (err) {
        console.error(err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRebuild = async () => {
    try {
      setIsRebuilding(true);
      await rebuildRelationships();
      if (onRebuildComplete) onRebuildComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRebuilding(false);
    }
  };

  const hasResults = results && (
    results.cases?.length > 0 ||
    results.people?.length > 0 ||
    results.vehicles?.length > 0 ||
    results.locations?.length > 0 ||
    results.objects?.length > 0
  );

  return (
    <header style={{
      height: '58px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      {/* Global Search Bar */}
      <div ref={dropdownRef} style={{ position: 'relative', width: '460px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
          border: '1px solid var(--border-medium)',
          borderRadius: '6px',
          padding: '6px 12px',
          gap: '8px',
          transition: 'all 0.15s ease',
        }}>
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search cases, people, vehicles, locations, modus operandi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '13px',
              width: '100%',
              fontFamily: 'var(--font-sans)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setResults(null); }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isOpen && hasResults && (
          <div style={{
            position: 'absolute',
            top: '44px',
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-medium)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '10px',
            zIndex: 50,
          }}>
            {/* Cases */}
            {results.cases?.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={12} /> Cases ({results.cases.length})
                </div>
                {results.cases.slice(0, 4).map((c: any) => (
                  <div
                    key={c.case_id}
                    onClick={() => {
                      onSelectCase(c.case_id);
                      setIsOpen(false);
                    }}
                    style={{
                      padding: '7px 10px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'transparent',
                      marginBottom: '3px',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)', marginRight: '8px' }}>
                        {c.case_id}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {c.case_type} • {c.summary.substring(0, 45)}...
                      </span>
                    </div>
                    <span className={`badge badge-${c.severity}`}>{c.severity}</span>
                  </div>
                ))}
              </div>
            )}

            {/* People */}
            {results.people?.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={12} /> People ({results.people.length})
                </div>
                {results.people.slice(0, 3).map((p: any) => (
                  <div
                    key={p.person_id}
                    onClick={() => {
                      onNavigate('entities');
                      setIsOpen(false);
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      background: 'transparent',
                      marginBottom: '3px',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span>
                      <strong style={{ color: 'var(--text-primary)' }}>{p.name}</strong> ({p.person_id})
                      {p.aliases?.length > 0 && ` • alias: ${p.aliases.join(', ')}`}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{p.cases_involved?.length} cases</span>
                  </div>
                ))}
              </div>
            )}

            {/* Vehicles */}
            {results.vehicles?.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-amber)', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Car size={12} /> Vehicles ({results.vehicles.length})
                </div>
                {results.vehicles.slice(0, 3).map((v: any) => (
                  <div
                    key={v.vehicle_id}
                    onClick={() => {
                      onNavigate('entities');
                      setIsOpen(false);
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      background: 'transparent',
                      marginBottom: '3px',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{v.registration || v.vehicle_id}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{v.color} {v.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Controls & Operational Telemetry */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={handleRebuild}
          disabled={isRebuilding}
          className="btn btn-secondary"
          title="Re-run relationship engine discovery across all cases"
        >
          <RotateCw size={13} className={isRebuilding ? 'animate-spin' : ''} />
          <span>{isRebuilding ? 'Recomputing...' : 'Rebuild Engine'}</span>
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '4px',
          fontSize: '11px',
          color: '#047857',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
        }}>
          <Activity size={13} />
          <span>DISCOVERY ACTIVE</span>
        </div>
      </div>
    </header>
  );
};
