import React from 'react';
import { Filter, X, ArrowUpDown } from 'lucide-react';

interface FilterPanelProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  crimeType: string;
  onCrimeTypeChange: (val: string) => void;
  severity: string;
  onSeverityChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  sortBy: string;
  onSortByChange: (val: string) => void;
  sortOrder: string;
  onSortOrderChange: (val: string) => void;
  onReset: () => void;
  crimeTypesList?: string[];
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  searchQuery,
  onSearchChange,
  crimeType,
  onCrimeTypeChange,
  severity,
  onSeverityChange,
  status,
  onStatusChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onReset,
  crimeTypesList = [
    'burglary',
    'theft',
    'robbery',
    'missing_person',
    'unidentified_body',
    'homicide',
    'assault',
    'vehicle_theft',
    'fraud',
  ],
}) => {
  return (
    <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', flex: 1 }}>
          {/* Keyword Search */}
          <input
            type="text"
            className="form-input"
            placeholder="Filter by summary or tag..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ minWidth: '220px' }}
          />

          {/* Crime Type Select */}
          <select
            className="form-input"
            value={crimeType}
            onChange={(e) => onCrimeTypeChange(e.target.value)}
          >
            <option value="all">All Crime Classifications</option>
            {crimeTypesList.map((ct) => (
              <option key={ct} value={ct}>
                {ct.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          {/* Severity Select */}
          <select
            className="form-input"
            value={severity}
            onChange={(e) => onSeverityChange(e.target.value)}
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Status Select */}
          <select
            className="form-input"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="all">All Case Statuses</option>
            <option value="open">Open</option>
            <option value="under_investigation">Under Investigation</option>
            <option value="closed">Closed</option>
          </select>

          {/* Sort By */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Sort:</span>
            <select
              className="form-input"
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
            >
              <option value="reported_date">Reported Date</option>
              <option value="incident_date">Incident Date</option>
              <option value="severity">Severity Rank</option>
              <option value="case_id">Case ID</option>
            </select>

            <button
              onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="btn btn-secondary"
              style={{ padding: '8px' }}
              title={`Toggle Sort Order (Currently ${sortOrder.toUpperCase()})`}
            >
              <ArrowUpDown size={14} />
            </button>
          </div>
        </div>

        {/* Reset button */}
        <button
          onClick={onReset}
          className="btn btn-ghost"
          style={{ fontSize: '12px' }}
        >
          <X size={13} />
          <span>Reset Filters</span>
        </button>
      </div>
    </div>
  );
};
