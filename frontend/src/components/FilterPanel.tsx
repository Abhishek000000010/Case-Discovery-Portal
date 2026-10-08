import React from 'react';
import { X, ArrowUpDown } from 'lucide-react';

interface FilterPanelProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  city: string;
  onCityChange: (val: string) => void;
  citiesList?: string[];
  crimeType: string;
  onCrimeTypeChange: (val: string) => void;
  crimeTypesList?: string[];
  crimeDomain: string;
  onCrimeDomainChange: (val: string) => void;
  domainsList?: string[];
  weapon: string;
  onWeaponChange: (val: string) => void;
  weaponsList?: string[];
  status: string;
  onStatusChange: (val: string) => void;
  sortBy: string;
  onSortByChange: (val: string) => void;
  sortOrder: string;
  onSortOrderChange: (val: string) => void;
  onReset: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  searchQuery,
  onSearchChange,
  city,
  onCityChange,
  citiesList = [],
  crimeType,
  onCrimeTypeChange,
  crimeTypesList = [],
  crimeDomain,
  onCrimeDomainChange,
  domainsList = [],
  weapon,
  onWeaponChange,
  weaponsList = [],
  status,
  onStatusChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onReset,
}) => {
  return (
    <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', flex: 1 }}>
          {/* Keyword Search */}
          <input
            type="text"
            className="form-input"
            placeholder="Search case ID, report #..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ minWidth: '180px' }}
          />

          {/* City / Jurisdiction */}
          <select
            className="form-input"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
          >
            <option value="all">All Jurisdictions (Cities)</option>
            {citiesList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Crime Description */}
          <select
            className="form-input"
            value={crimeType}
            onChange={(e) => onCrimeTypeChange(e.target.value)}
          >
            <option value="all">All Crime Classifications</option>
            {crimeTypesList.map((ct) => (
              <option key={ct} value={ct}>
                {ct}
              </option>
            ))}
          </select>

          {/* Crime Domain */}
          <select
            className="form-input"
            value={crimeDomain}
            onChange={(e) => onCrimeDomainChange(e.target.value)}
          >
            <option value="all">All Crime Domains</option>
            {domainsList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Weapon Used */}
          <select
            className="form-input"
            value={weapon}
            onChange={(e) => onWeaponChange(e.target.value)}
          >
            <option value="all">All Weapon Categories</option>
            {weaponsList.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>

          {/* Status Select */}
          <select
            className="form-input"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="open">Open Cases</option>
            <option value="closed">Closed Cases</option>
          </select>

          {/* Sort By */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Sort:</span>
            <select
              className="form-input"
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
            >
              <option value="case_id">Case ID</option>
              <option value="incident_date">Incident Date</option>
              <option value="police_deployed">Police Deployed</option>
              <option value="closure_duration_days">Closure Duration</option>
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
