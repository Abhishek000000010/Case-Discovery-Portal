import React, { useEffect, useState } from 'react';
import { FolderGit2, Grid, List as ListIcon, ChevronLeft, ChevronRight, MapPin, Calendar, Wrench, ArrowRight } from 'lucide-react';
import { CaseModel } from '../types/case';
import { CaseCard } from '../components/CaseCard';
import { FilterPanel } from '../components/FilterPanel';
import { fetchCases, fetchCities, fetchCrimes, fetchDomains, fetchWeapons } from '../services/api';

interface CasesProps {
  onSelectCase: (caseId: string) => void;
  onExploreGraph?: (caseId: string) => void;
}

export const Cases: React.FC<CasesProps> = ({ onSelectCase, onExploreGraph }) => {
  const [cases, setCases] = useState<CaseModel[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [city, setCity] = useState('all');
  const [crimeType, setCrimeType] = useState('all');
  const [crimeDomain, setCrimeDomain] = useState('all');
  const [weapon, setWeapon] = useState('all');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState('case_id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Dimension filter lists
  const [citiesList, setCitiesList] = useState<string[]>([]);
  const [crimesList, setCrimesList] = useState<string[]>([]);
  const [domainsList, setDomainsList] = useState<string[]>([]);
  const [weaponsList, setWeaponsList] = useState<string[]>([]);

  useEffect(() => {
    async function loadDimensions() {
      try {
        const [c, cr, d, w] = await Promise.all([
          fetchCities(),
          fetchCrimes(),
          fetchDomains(),
          fetchWeapons(),
        ]);
        setCitiesList(c.map((item) => item.name));
        setCrimesList(cr.map((item) => item.name));
        setDomainsList(d.map((item) => item.name));
        setWeaponsList(w.map((item) => item.name));
      } catch (err) {
        console.error('Failed to load dimensions:', err);
      }
    }
    loadDimensions();
  }, []);

  useEffect(() => {
    loadCasesList();
  }, [page, pageSize, searchQuery, city, crimeType, crimeDomain, weapon, status, sortBy, sortOrder]);

  async function loadCasesList() {
    try {
      setLoading(true);
      const res = await fetchCases({
        q: searchQuery,
        city,
        crime_description: crimeType,
        crime_domain: crimeDomain,
        weapon,
        status,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        page_size: pageSize,
      });
      setCases(res.cases || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleResetFilters = () => {
    setSearchQuery('');
    setCity('all');
    setCrimeType('all');
    setCrimeDomain('all');
    setWeapon('all');
    setStatus('all');
    setSortBy('case_id');
    setSortOrder('asc');
    setPage(1);
  };

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Header bar */}
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1 className="page-title">Case Incident Dossier Repository</h1>
          <p className="page-subtitle">
            Browse and filter {total.toLocaleString()} real Indian crime incident records.
          </p>
        </div>

        {/* View mode toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-medium)',
            borderRadius: '6px',
            padding: '2px',
          }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: viewMode === 'grid' ? '#f0f9ff' : 'transparent',
                color: viewMode === 'grid' ? '#0284c7' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Grid size={14} />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: viewMode === 'table' ? '#f0f9ff' : 'transparent',
                color: viewMode === 'table' ? '#0284c7' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <ListIcon size={14} />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        searchQuery={searchQuery}
        onSearchChange={(q) => { setSearchQuery(q); setPage(1); }}
        city={city}
        onCityChange={(c) => { setCity(c); setPage(1); }}
        citiesList={citiesList}
        crimeType={crimeType}
        onCrimeTypeChange={(ct) => { setCrimeType(ct); setPage(1); }}
        crimeTypesList={crimesList}
        crimeDomain={crimeDomain}
        onCrimeDomainChange={(cd) => { setCrimeDomain(cd); setPage(1); }}
        domainsList={domainsList}
        weapon={weapon}
        onWeaponChange={(w) => { setWeapon(w); setPage(1); }}
        weaponsList={weaponsList}
        status={status}
        onStatusChange={(s) => { setStatus(s); setPage(1); }}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        onReset={handleResetFilters}
      />

      {/* Results Count & Pagination Controls Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        fontSize: '12px',
        color: 'var(--text-secondary)',
      }}>
        <div>
          Showing <strong>{cases.length}</strong> of <strong>{total.toLocaleString()}</strong> case files
          {searchQuery && <span> matching "{searchQuery}"</span>}
          {city !== 'all' && <span> in {city}</span>}
          {crimeType !== 'all' && <span> ({crimeType})</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn btn-secondary"
            style={{ padding: '5px 8px' }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="btn btn-secondary"
            style={{ padding: '5px 8px' }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Loading case repository records...
        </div>
      ) : cases.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No case records found matching the active filters.
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {cases.map((c) => (
            <CaseCard
              key={c.case_id}
              caseData={c}
              onSelect={onSelectCase}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="glass-panel" style={{ overflowX: 'auto', marginBottom: '24px' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-medium)', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Case ID</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Report #</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Crime Classification</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Jurisdiction</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Weapon</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Incident Date</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Victim</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => {
                const dateStr = (c.incident?.date_of_occurrence || c.incident?.time_of_occurrence || '').split('T')[0];
                const isClosed = c.investigation?.case_closed;
                return (
                  <tr
                    key={c.case_id}
                    onClick={() => onSelectCase(c.case_id)}
                    style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                    className="table-row-hover"
                  >
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      {c.case_id}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                      #{c.source?.source_report_number}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {c.incident?.crime_description}
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>
                        {c.incident?.crime_domain}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} color="var(--accent-emerald)" />
                        {c.location?.city}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {c.weapon?.used || 'None Specified'}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                      {dateStr || 'Unspecified'}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                      {c.victim?.age ? `Age ${c.victim.age}` : 'Age ?'}, {c.victim?.gender || 'N/A'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: 600,
                        backgroundColor: isClosed ? '#f0fdf4' : '#fff7ed',
                        color: isClosed ? '#15803d' : '#c2410c',
                      }}>
                        {isClosed ? 'Closed' : 'Open'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectCase(c.case_id); }}
                        className="btn btn-ghost"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Bottom Pagination */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="btn btn-secondary"
          style={{ fontSize: '12px', padding: '6px 14px' }}
        >
          <ChevronLeft size={14} />
          <span>Previous Page</span>
        </button>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="btn btn-secondary"
          style={{ fontSize: '12px', padding: '6px 14px' }}
        >
          <span>Next Page</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
