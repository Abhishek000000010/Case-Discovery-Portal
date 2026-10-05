import React, { useEffect, useState } from 'react';
import {
  FolderGit2,
  Users,
  MapPin,
  Car,
  Share2,
  AlertTriangle,
  Flame,
  Compass,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { RelationshipCard } from '../components/RelationshipCard';
import { fetchStats, fetchPatterns, fetchCaseRelationships } from '../services/api';
import { RelationshipExplanation } from '../types/relationship';

interface DashboardProps {
  onSelectCase: (caseId: string) => void;
  onNavigate: (tab: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectCase, onNavigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [topRelationships, setTopRelationships] = useState<RelationshipExplanation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [statsData, patternsData] = await Promise.all([
          fetchStats(),
          fetchPatterns(),
        ]);
        setStats(statsData);
        setPatterns(patternsData);

        // Fetch sample high confidence relationships for display
        if (statsData.total_cases > 0) {
          const sampleRels = await fetchCaseRelationships('CASE003', 0.70);
          setTopRelationships(sampleRels.slice(0, 4));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading || !stats) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>
          Loading intelligence metrics and graph relationships...
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Flame size={22} color="var(--accent-cyan)" />
            <span>Intelligence Operations Center</span>
          </h1>
          <p className="page-subtitle">
            Autonomous multi-relational case relationship discovery & entity resolution platform.
          </p>
        </div>

        <button
          onClick={() => onNavigate('cases')}
          className="btn btn-primary"
        >
          <span>Browse Case Repository</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid-stats">
        <StatCard
          title="Total Cases Indexed"
          value={stats.total_cases}
          subtitle="Structured case records"
          icon={FolderGit2}
          color="var(--entity-case)"
        />
        <StatCard
          title="Persons of Interest"
          value={stats.total_persons}
          subtitle="Resolved identity profiles"
          icon={Users}
          color="var(--entity-person)"
        />
        <StatCard
          title="Jurisdiction Locations"
          value={stats.total_locations}
          subtitle="Co-located geocoded scenes"
          icon={MapPin}
          color="var(--entity-location)"
        />
        <StatCard
          title="Vehicles Profiled"
          value={stats.total_vehicles}
          subtitle="Tracked transport units"
          icon={Car}
          color="var(--entity-vehicle)"
        />
        <StatCard
          title="Discovered Relationships"
          value={stats.total_relationships}
          subtitle={`${stats.high_confidence_relationships} high confidence links`}
          icon={Share2}
          color="var(--accent-indigo)"
          badge="AUTOMATED"
        />
        <StatCard
          title="Potential Recurrences"
          value={stats.potential_anomalies_count}
          subtitle="Cross-incident frequency flags"
          icon={AlertTriangle}
          color="var(--accent-amber)"
          badge="REVIEW"
        />
      </div>

      {/* Two Column Layout: Discovered Behavioral Patterns & High-Confidence Relationships */}
      <div className="grid-two-col">
        {/* Left Column: Discovered Crime Patterns & Clusters */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={17} color="var(--accent-cyan)" />
              <span>Dynamically Discovered Case Series & Patterns</span>
            </h2>
            <button
              onClick={() => onNavigate('patterns')}
              className="btn btn-ghost"
              style={{ fontSize: '12px' }}
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {patterns.slice(0, 4).map((pat) => (
              <div
                key={pat.pattern_id}
                className="glass-panel"
                style={{ padding: '16px 18px', borderLeft: '3px solid var(--accent-cyan)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#0369a1',
                    padding: '2px 7px',
                    backgroundColor: '#e0f2fe',
                    borderRadius: '4px',
                  }}>
                    {pat.category}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Confidence: {(pat.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {pat.title}
                </div>

                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  {pat.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Related Cases:</span>
                  {pat.case_ids.map((cid: string) => (
                    <button
                      key={cid}
                      onClick={() => onSelectCase(cid)}
                      style={{
                        fontSize: '11px',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        backgroundColor: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        color: '#0284c7',
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                      }}
                    >
                      {cid}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: High Confidence Discovered Links & Crime Mix */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={17} color="var(--accent-indigo)" />
              <span>High-Confidence Relationship Alerts</span>
            </h2>
          </div>

          {topRelationships.length > 0 ? (
            <div>
              {topRelationships.map((rel, idx) => (
                <RelationshipCard
                  key={rel.relationship_id || idx}
                  relationship={rel}
                  onSelectCase={onSelectCase}
                  onExploreGraph={(cid) => {
                    onSelectCase(cid);
                    onNavigate('graph');
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No relationships to display at this threshold.
            </div>
          )}

          {/* Crime Distribution Summary */}
          <div className="glass-panel" style={{ padding: '16px', marginTop: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Indexed Crime Classifications
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(stats.crime_type_distribution || {}).map(([ctype, count]: any) => (
                <div key={ctype}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                    <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                      {ctype.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {count}
                    </span>
                  </div>
                  <div style={{ height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${(count / stats.total_cases) * 100}%`,
                      backgroundColor: 'var(--accent-cyan)',
                      borderRadius: '2px',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
