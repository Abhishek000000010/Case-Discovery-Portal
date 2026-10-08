import React, { useState, useEffect, useRef } from 'react';
import { Search, RotateCw, Activity, X, Building2, ShieldAlert, Wrench, FileText, User, MapPin, Car } from 'lucide-react';
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
  const [isFocused, setIsFocused] = useState(false);
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
    results.cities?.length > 0 ||
    results.crime_types?.length > 0 ||
    results.weapons?.length > 0 ||
    results.persons?.length > 0 ||
    results.locations?.length > 0 ||
    results.vehicles?.length > 0
  );

  return (
    <header style={{
      height: '85px',
      flexShrink: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      {/* Search Section */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <div ref={dropdownRef} style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: isFocused ? '#ffffff' : '#f8fafc',
            border: `1px solid ${isFocused ? '#3b82f6' : '#e2e8f0'}`,
            boxShadow: isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'inset 0 1px 2px rgba(0,0,0,0.01)',
            borderRadius: '12px',
            padding: '0 16px',
            height: '42px',
            gap: '10px',
            transition: 'all 0.2s ease',
          }}>
            <Search size={18} color={isFocused ? "#3b82f6" : "#94a3b8"} style={{ transition: 'color 0.2s ease' }} />
            <input
              type="text"
              placeholder="Search persons, case ID, report number, city, crime type, weapon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { setIsOpen(true); setIsFocused(true); }}
              onBlur={() => setIsFocused(false)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#1e293b',
                fontSize: '14px',
                width: '100%',
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setResults(null); }}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                  borderRadius: '50%',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Enhanced Dropdown */}
          {isOpen && hasResults && (
            <div style={{
              position: 'absolute',
              top: '52px',
              left: 0,
              width: '100%',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              maxHeight: '480px',
              overflowY: 'auto',
              padding: '16px',
              zIndex: 50,
            }}>
              {/* Persons */}
              {results.persons?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#8b5cf6', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={14} /> Persons ({results.persons.length})
                  </div>
                  {results.persons.slice(0, 5).map((p: any) => (
                    <div
                      key={p.person_id}
                      onClick={() => { onSelectCase(p.case_id); setIsOpen(false); }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{p.name}</span>
                        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', backgroundColor: '#ede9fe', color: '#6d28d9', fontWeight: 600 }}>
                          {p.role}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                        {p.residence} • Involved in {p.crime_type} ({p.case_id})
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cases */}
              {results.cases?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0ea5e9', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={14} /> Cases ({results.cases.length})
                  </div>
                  {results.cases.slice(0, 5).map((c: any) => (
                    <div
                      key={c.case_id}
                      onClick={() => { onSelectCase(c.case_id); setIsOpen(false); }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0284c7', marginRight: '10px', fontSize: '13px' }}>
                          {c.case_id}
                        </span>
                        <span style={{ fontSize: '13px', color: '#475569' }}>
                          {c.crime_description} • {c.city}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', backgroundColor: c.status === 'Closed' ? '#dcfce7' : '#ffedd5', color: c.status === 'Closed' ? '#166534' : '#9a3412', fontWeight: 600 }}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Grid Layout for smaller sections */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Locations */}
                {results.locations?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} /> Locations
                    </div>
                    {results.locations.slice(0, 3).map((loc: any) => (
                      <div
                        key={loc.location_id}
                        onClick={() => { onSelectCase(loc.case_id); setIsOpen(false); }}
                        style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ fontWeight: 500, color: '#1e293b', fontSize: '13px' }}>{loc.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{loc.city}, {loc.state}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Vehicles */}
                {results.vehicles?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#3b82f6', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Car size={14} /> Vehicles
                    </div>
                    {results.vehicles.slice(0, 3).map((veh: any) => (
                      <div
                        key={veh.vehicle_id}
                        onClick={() => { onSelectCase(veh.case_id); setIsOpen(false); }}
                        style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ fontWeight: 500, color: '#1e293b', fontSize: '13px' }}>{veh.registration}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{veh.type}</div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Cities */}
                {results.cities?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#4f46e5', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={14} /> Cities
                    </div>
                    {results.cities.slice(0, 3).map((city: any) => (
                      <div
                        key={city.city_id}
                        onClick={() => { onNavigate('entities'); setIsOpen(false); }}
                        style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ fontWeight: 500, color: '#1e293b', fontSize: '13px' }}>{city.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{city.case_count} cases</div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Crime Types */}
                {results.crime_types?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldAlert size={14} /> Crimes
                    </div>
                    {results.crime_types.slice(0, 3).map((crime: any) => (
                      <div
                        key={crime.crime_id}
                        onClick={() => { onNavigate('entities'); setIsOpen(false); }}
                        style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ fontWeight: 500, color: '#1e293b', fontSize: '13px' }}>{crime.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{crime.case_count} cases</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={handleRebuild}
          disabled={isRebuilding}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '20px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#334155',
            cursor: isRebuilding ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
          onMouseEnter={(e) => !isRebuilding && (e.currentTarget.style.backgroundColor = '#f8fafc')}
          onMouseLeave={(e) => !isRebuilding && (e.currentTarget.style.backgroundColor = '#ffffff')}
        >
          <RotateCw size={14} className={isRebuilding ? 'animate-spin' : ''} color={isRebuilding ? '#94a3b8' : '#64748b'} />
          <span>{isRebuilding ? 'Indexing...' : 'Re-index Corpus'}</span>
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: 600,
          color: '#065f46',
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          padding: '6px 14px',
          borderRadius: '20px',
        }}>
          <Activity size={14} />
          <span>Real Dataset Engine (40,160 Cases)</span>
        </div>
      </div>
    </header>
  );
};
