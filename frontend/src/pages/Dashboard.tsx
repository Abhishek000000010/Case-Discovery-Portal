import React, { useEffect, useState } from 'react';
import {
  FolderGit2,
  Building2,
  ShieldAlert,
  Wrench,
  CheckCircle2,
  Clock,
  Compass,
  ArrowRight,
  TrendingUp,
  Layers,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar, Legend, Sector
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { RelationshipCard } from '../components/RelationshipCard';
import { RelationshipDetailDrawer } from '../components/RelationshipDetailDrawer';
import { fetchStats, fetchAnalytics, fetchPatterns, fetchCaseRelationships } from '../services/api';
import { RelationshipExplanation, CasePattern } from '../types/relationship';

interface DashboardProps {
  onSelectCase: (caseId: string) => void;
  onNavigate: (tab: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectCase, onNavigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [patterns, setPatterns] = useState<CasePattern[]>([]);
  const [sampleRels, setSampleRels] = useState<RelationshipExplanation[]>([]);
  const [investigationPair, setInvestigationPair] = useState<{
    sourceId: string | null;
    targetId: string | null;
    isOpen: boolean;
  }>({ sourceId: null, targetId: null, isOpen: false });
  const [loading, setLoading] = useState(true);
  const [activeWeaponIndex, setActiveWeaponIndex] = useState(0);

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
    return (
      <g>
        <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill={fill} style={{ fontSize: '15px', fontWeight: 800 }}>
          {payload.weapon}
        </text>
        <text x={cx} y={cy + 15} dy={8} textAnchor="middle" fill="#64748b" style={{ fontSize: '13px', fontWeight: 600 }}>
          {`${(percent * 100).toFixed(1)}%`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 12}
          outerRadius={outerRadius + 16}
          fill={fill}
        />
      </g>
    );
  };

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [statsData, analyticsData, patternsData] = await Promise.all([
          fetchStats(),
          fetchAnalytics(),
          fetchPatterns(),
        ]);
        setStats(statsData);
        setAnalytics(analyticsData);
        setPatterns(patternsData);

        // Load sample relationships for representative first case
        const rels = await fetchCaseRelationships('IND-CASE-00001', 0.50, 4);
        setSampleRels(rels);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading || !stats) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
          Loading real crime intelligence metrics across 40,160 cases...
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Provenance & Neutrality Banner */}
      <div style={{
        backgroundColor: '#f8fafc',
        border: '1px solid var(--border-medium)',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={20} color="#0284c7" />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Data Source: Indian Crimes Dataset (Kaggle / Public Data)
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Data Type: Public Dataset Records • Synthetic Records in Primary Dataset: None • Municipal Jurisdictions: 29
            </div>
          </div>
        </div>

        <div style={{
          fontSize: '11px',
          fontWeight: 600,
          backgroundColor: '#eff6ff',
          color: '#1d4ed8',
          border: '1px solid #bfdbfe',
          padding: '4px 10px',
          borderRadius: '16px',
        }}>
          Decision-Support & Relationship Discovery
        </div>
      </div>

      {/* Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="page-title">Executive Investigative Dashboard</h1>
          <p className="page-subtitle">
            Dynamic intelligence and multi-signal relationship discovery across {stats.total_cases?.toLocaleString()} real Indian crime incident records.
          </p>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <StatCard
          title="Total Case Records"
          value={stats.total_cases?.toLocaleString() || '0'}
          subtitle="Real Indian incidents"
          icon={FolderGit2}
          color="cyan"
        />
        <StatCard
          title="Municipal Jurisdictions"
          value={stats.total_cities || '0'}
          subtitle={`Most active: ${stats.most_active_city?.name || 'N/A'}`}
          icon={Building2}
          color="emerald"
        />
        <StatCard
          title="Crime Classifications"
          value={stats.total_crime_types || '0'}
          subtitle={`Most common: ${stats.most_common_crime?.name || 'N/A'}`}
          icon={ShieldAlert}
          color="amber"
        />
        <StatCard
          title="Case Closure Rate"
          value={`${stats.closure_rate_percent || 0}%`}
          subtitle={`${stats.cases_closed?.toLocaleString()} Closed • ${stats.open_cases?.toLocaleString()} Open`}
          icon={CheckCircle2}
          color="blue"
        />
      </div>

      {/* Secondary Operational Metrics Grid */}
      <div className="grid grid-cols-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard
          title="Crime Domains"
          value={stats.total_crime_domains || '4'}
          subtitle="Violent, Property, Cyber, Other"
          icon={Layers}
          color="indigo"
        />
        <StatCard
          title="Weapon Categories"
          value={stats.total_weapons || '6'}
          subtitle="De-duplicated categories"
          icon={Wrench}
          color="rose"
        />
        <StatCard
          title="Avg Investigation Closure"
          value={`${stats.average_closure_duration_days || 0} days`}
          subtitle="Incident to resolution duration"
          icon={Clock}
          color="purple"
        />
        <StatCard
          title="Avg Report Delay"
          value={`${stats.average_report_delay_hours || 0} hrs`}
          subtitle={`Peak month: ${stats.highest_crime_month?.name || 'N/A'}`}
          icon={TrendingUp}
          color="cyan"
        />
      </div>

      {/* Analytics Visual Breakdown Grid */}
      {analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {/* Top Municipal Jurisdictions */}
          <div className="glass-panel" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={16} color="var(--accent-emerald)" />
                <span>Crime Distribution by Municipal Jurisdiction</span>
              </div>
              <button
                onClick={() => onNavigate('entities')}
                className="btn btn-ghost"
                style={{ fontSize: '11px', padding: '2px 6px' }}
              >
                View All
              </button>
            </div>

            <div style={{ height: '200px', marginTop: '10px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.top_cities?.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="city" type="category" width={80} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="var(--accent-emerald)" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Crime Types */}
          <div className="glass-panel" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={16} color="var(--accent-amber)" />
                <span>Top Crime Classifications</span>
              </div>
              <button
                onClick={() => onNavigate('entities')}
                className="btn btn-ghost"
                style={{ fontSize: '11px', padding: '2px 6px' }}
              >
                View All
              </button>
            </div>

            <div style={{ height: '200px', marginTop: '10px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.top_crimes?.slice(0, 6)} layout="horizontal" margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="crime" type="category" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} interval={0} tickFormatter={(val) => val.length > 10 ? val.substring(0,10)+'...' : val} />
                  <YAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={24}>
                    {analytics.top_crimes?.slice(0, 6).map((entry: any, index: number) => {
                      const colors = ['#f59e0b', '#fcd34d', '#fbbf24', '#f87171', '#ef4444', '#b91c1c'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weapon Deployments */}
          <div className="glass-panel" style={{ padding: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wrench size={16} color="var(--accent-rose)" />
              <span>Weapon Deployment Breakdown</span>
            </div>
            <div style={{ height: '200px', marginTop: '10px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Pie
                    data={analytics.weapons}
                    dataKey="count"
                    nameKey="weapon"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {analytics.weapons?.map((entry: any, index: number) => {
                      const colors = ['#f43f5e', '#fb923c', '#fbbf24', '#a3e635', '#2dd4bf', '#818cf8'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Time of Day Distribution */}
          <div className="glass-panel" style={{ padding: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="var(--accent-cyan)" />
              <span>Incident Occurrences by Hour of Day (24h Clock)</span>
            </div>
            <div style={{ height: '200px', marginTop: '10px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.hourly_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="hour" tickFormatter={(v) => `${v}h`} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="count" stroke="var(--accent-cyan)" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} activeDot={{ r: 6, fill: 'var(--accent-cyan)', stroke: '#fff', strokeWidth: 2 }} animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Recurrent Patterns & Sample Discovered Relationships */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Recurrent Patterns Column */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={17} color="var(--accent-cyan)" />
              <span>Discovered Recurrent Incident Patterns</span>
            </div>
            <button
              onClick={() => onNavigate('patterns')}
              className="btn btn-ghost"
              style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {patterns.slice(0, 3).map((pat) => (
              <div
                key={pat.pattern_id}
                className="glass-panel"
                style={{ padding: '14px', cursor: 'pointer' }}
                onClick={() => onNavigate('patterns')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {pat.pattern_id}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', backgroundColor: '#f0fdf4', padding: '1px 6px', borderRadius: '4px' }}>
                    {pat.case_count} Occurrences
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {pat.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {pat.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Empirical Relationships Column */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Sample Discovered Case Concordances
            </div>
            <button
              onClick={() => onNavigate('cases')}
              className="btn btn-ghost"
              style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Explore Cases</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {sampleRels.length > 0 ? (
            sampleRels.map((rel) => (
              <RelationshipCard
                key={rel.relationship_id}
                relationship={rel}
                currentCaseId="IND-CASE-00001"
                onSelectCase={onSelectCase}
                onWhyRelated={(src, tgt) =>
                  setInvestigationPair({ sourceId: src, targetId: tgt, isOpen: true })
                }
              />
            ))
          ) : (
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Select a case in the repository to inspect all statistically discovered relationships.
            </div>
          )}
        </div>
      </div>

      {/* Forensic Relationship Investigation Layer */}
      <RelationshipDetailDrawer
        sourceCaseId={investigationPair.sourceId}
        targetCaseId={investigationPair.targetId}
        isOpen={investigationPair.isOpen}
        onClose={() => setInvestigationPair((prev) => ({ ...prev, isOpen: false }))}
        onSelectCase={onSelectCase}
      />
    </div>
  );
};
