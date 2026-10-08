import React, { useEffect, useState } from 'react';
import { Building, Shield, Crosshair, Layers, Search } from 'lucide-react';
import { CityEntity, CrimeDescriptionEntity, WeaponEntity, CrimeDomainEntity } from '../types/entity';
import { fetchCities, fetchCrimes, fetchWeapons, fetchDomains } from '../services/api';
import { EntityCard } from '../components/EntityCard';

interface EntitiesProps {
  onSelectCase: (caseId: string) => void;
  onExploreGraph: (entityId: string) => void;
}

export const Entities: React.FC<EntitiesProps> = ({ onSelectCase, onExploreGraph }) => {
  const [activeTab, setActiveTab] = useState<'cities' | 'crimes' | 'weapons' | 'domains'>('cities');
  const [cities, setCities] = useState<CityEntity[]>([]);
  const [crimes, setCrimes] = useState<CrimeDescriptionEntity[]>([]);
  const [weapons, setWeapons] = useState<WeaponEntity[]>([]);
  const [domains, setCrimeDomains] = useState<CrimeDomainEntity[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAllEntities() {
      try {
        setLoading(true);
        const [cData, crData, wData, dData] = await Promise.all([
          fetchCities(),
          fetchCrimes(),
          fetchWeapons(),
          fetchDomains(),
        ]);
        setCities(cData);
        setCrimes(crData);
        setWeapons(wData);
        setCrimeDomains(dData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAllEntities();
  }, []);

  // Search filtering
  const filteredCities = cities.filter((c) => {
    const s = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(s) || c.city_id.toLowerCase().includes(s);
  });

  const filteredCrimes = crimes.filter((cr) => {
    const s = searchTerm.toLowerCase();
    return cr.name.toLowerCase().includes(s) || cr.crime_id.toLowerCase().includes(s);
  });

  const filteredWeapons = weapons.filter((w) => {
    const s = searchTerm.toLowerCase();
    return w.name.toLowerCase().includes(s) || w.weapon_id.toLowerCase().includes(s);
  });

  const filteredDomains = domains.filter((d) => {
    const s = searchTerm.toLowerCase();
    return d.name.toLowerCase().includes(s) || d.domain_id.toLowerCase().includes(s);
  });

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Building size={24} color="var(--accent-emerald)" />
            <span>Structured Dimensional Entity Catalog</span>
          </h1>
          <p className="page-subtitle">
            Ground-truth dimensional catalog across 29 cities, 21 crime classifications, 6 weapons, and 4 legal domains.
          </p>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-surface)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
          <Search size={14} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search dimensional entities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '12px',
              width: '200px',
            }}
          />
        </div>
      </div>

      {/* Entity Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
        {[
          { id: 'cities', label: `Cities (${filteredCities.length})`, icon: Building, color: 'var(--accent-emerald)' },
          { id: 'crimes', label: `Crime Classifications (${filteredCrimes.length})`, icon: Shield, color: 'var(--accent-cyan)' },
          { id: 'weapons', label: `Weapons (${filteredWeapons.length})`, icon: Crosshair, color: 'var(--accent-purple)' },
          { id: 'domains', label: `Crime Domains (${filteredDomains.length})`, icon: Layers, color: '#0369a1' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                border: 'none',
                background: 'transparent',
                borderBottom: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
                color: isActive ? tab.color : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Entity Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>
          Retrieving real dataset dimensional entities...
        </div>
      ) : activeTab === 'cities' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filteredCities.map((c) => (
            <EntityCard
              key={c.city_id}
              type="CITY"
              id={c.city_id}
              title={c.name}
              subtitle={`Municipal Police Jurisdiction • Top crime: ${c.top_crime || 'General'}`}
              caseCount={c.case_count}
              onExploreGraph={onExploreGraph}
            />
          ))}
        </div>
      ) : activeTab === 'crimes' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredCrimes.map((cr) => (
            <EntityCard
              key={cr.crime_id}
              type="CRIME"
              id={cr.crime_id}
              title={cr.name}
              subtitle={`Statutory Incident Classification • Top city: ${cr.top_city || 'Multiple'}`}
              caseCount={cr.case_count}
              onExploreGraph={onExploreGraph}
            />
          ))}
        </div>
      ) : activeTab === 'weapons' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filteredWeapons.map((w) => (
            <EntityCard
              key={w.weapon_id}
              type="WEAPON"
              id={w.weapon_id}
              title={w.name}
              subtitle={`Tactical Weapon Category • Top Crime: ${w.top_crime || 'Multiple'}`}
              caseCount={w.case_count}
              onExploreGraph={onExploreGraph}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filteredDomains.map((d) => (
            <EntityCard
              key={d.domain_id}
              type="DOMAIN"
              id={d.domain_id}
              title={d.name}
              subtitle="Statutory Legal Domain"
              caseCount={d.case_count}
              onExploreGraph={onExploreGraph}
            />
          ))}
        </div>
      )}
    </div>
  );
};
