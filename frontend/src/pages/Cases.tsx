import React, { useEffect, useState } from 'react';
import { FolderGit2, Grid, List as ListIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { CaseModel } from '../types/case';
import { CaseCard } from '../components/CaseCard';
import { FilterPanel } from '../components/FilterPanel';
import { fetchCases } from '../services/api';

interface CasesProps {
  onSelectCase: (caseId: string) => void;
}

export const Cases: React.FC<CasesProps> = ({ onSelectCase }) => {
  const [cases, setCases] = useState<CaseModel[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [crimeType, setCrimeType] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState('reported_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    loadCasesList();
  }, [page, searchQuery, crimeType, severity, status, sortBy, sortOrder]);

  async function loadCasesList() {
    try {
      setLoading(true);
      const res = await fetchCases({
        q: searchQuery,
        crime_type: crimeType,
        severity,
        status,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        page_size: 15,
      });
      setCases(res.cases || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleResetFilters = () => {
    setSearchQuery('');
    setCrimeType('all');
    setSeverity('all');
    setStatus('all');
    setSortBy('reported_date');
    setSortOrder('desc');
    setPage(1);
  };

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FolderGit2 size={24} color="var(--accent-cyan)" />
            <span>Case File Intelligence Repository</span>
          </h1>
          <p className="page-subtitle">
            Catalog of {total} structured case reports with automated cross-incident relationship tracking.
          </p>
        </div>

        {/* View mode toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--bg-surface)', padding: '3px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '6px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: viewMode === 'grid' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: viewMode === 'grid' ? 'var(--text-accent)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
            title="Grid Card View"
          >
            <Grid size={16} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            style={{
              padding: '6px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: viewMode === 'table' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: viewMode === 'table' ? 'var(--text-accent)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
            title="Data Table View"
          >
            <ListIcon size={16} />
          </button>
        </div>
      </div>

      {/* Filter & Search Panel */}
      <FilterPanel
        searchQuery={searchQuery}
        onSearchChange={(q) => { setSearchQuery(q); setPage(1); }}
        crimeType={crimeType}
        onCrimeTypeChange={(ct) => { setCrimeType(ct); setPage(1); }}
        severity={severity}
        onSeverityChange={(s) => { setSeverity(s); setPage(1); }}
        status={status}
        onStatusChange={(st) => { setStatus(st); setPage(1); }}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        onReset={handleResetFilters}
      />

      {/* Cases Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>
          Loading cases directory...
        </div>
      ) : cases.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No cases match the specified search and filter criteria. Try resetting filters.
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}>
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
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>
                <th style={{ padding: '12px 16px' }}>Case ID</th>
                <th style={{ padding: '12px 16px' }}>Classification</th>
                <th style={{ padding: '12px 16px' }}>Date</th>
                <th style={{ padding: '12px 16px' }}>Location</th>
                <th style={{ padding: '12px 16px' }}>Severity</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>People</th>
                <th style={{ padding: '12px 16px' }}>Relationships</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr
                  key={c.case_id}
                  onClick={() => onSelectCase(c.case_id)}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {c.case_id}
                  </td>
                  <td style={{ padding: '12px 16px', textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                    {c.case_type.replace(/_/g, ' ')}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {c.incident_date || c.reported_date}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                    {c.location_names && c.location_names.length > 0 ? c.location_names[0] : 'N/A'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge badge-${c.severity.toLowerCase()}`}>
                      {c.severity}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textTransform: 'capitalize', color: 'var(--text-muted)' }}>
                    {c.status.replace(/_/g, ' ')}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>
                    {c.people_count ?? c.people_involved.length}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: (c.related_cases_count ?? 0) > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    }}>
                      {c.related_cases_count ?? 0} links
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCase(c.case_id);
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                    >
                      Dossier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing page {page} of {totalPages} ({total} total records)
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="btn btn-secondary"
              style={{ padding: '6px 12px' }}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="btn btn-secondary"
              style={{ padding: '6px 12px' }}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
