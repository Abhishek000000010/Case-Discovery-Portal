import React, { useEffect, useState } from 'react';
import { Users, Car, MapPin, Box, Filter, Search } from 'lucide-react';
import { PersonEntity, VehicleEntity, LocationEntity, ObjectEntity } from '../types/entity';
import { fetchPersons, fetchVehicles, fetchLocations, fetchObjects } from '../services/api';
import { EntityCard } from '../components/EntityCard';

interface EntitiesProps {
  onSelectCase: (caseId: string) => void;
  onExploreGraph: (entityId: string) => void;
}

export const Entities: React.FC<EntitiesProps> = ({ onSelectCase, onExploreGraph }) => {
  const [activeTab, setActiveTab] = useState<'persons' | 'vehicles' | 'locations' | 'objects'>('persons');
  const [persons, setPersons] = useState<PersonEntity[]>([]);
  const [vehicles, setVehicles] = useState<VehicleEntity[]>([]);
  const [locations, setLocations] = useState<LocationEntity[]>([]);
  const [objects, setObjects] = useState<ObjectEntity[]>([]);

  const [onlyRecurring, setOnlyRecurring] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAllEntities() {
      try {
        setLoading(true);
        const [pData, vData, lData, oData] = await Promise.all([
          fetchPersons(onlyRecurring),
          fetchVehicles(),
          fetchLocations(),
          fetchObjects(),
        ]);
        setPersons(pData);
        setVehicles(vData);
        setLocations(lData);
        setObjects(oData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAllEntities();
  }, [onlyRecurring]);

  // Search filtering
  const filteredPersons = persons.filter((p) => {
    const s = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(s) || p.person_id.toLowerCase().includes(s) || (p.aliases || []).some(a => a.toLowerCase().includes(s));
  });

  const filteredVehicles = vehicles.filter((v) => {
    const s = searchTerm.toLowerCase();
    return (v.registration || '').toLowerCase().includes(s) || v.vehicle_id.toLowerCase().includes(s) || (v.type || '').toLowerCase().includes(s);
  });

  const filteredLocations = locations.filter((l) => {
    const s = searchTerm.toLowerCase();
    return l.name.toLowerCase().includes(s) || (l.city || '').toLowerCase().includes(s) || l.location_id.toLowerCase().includes(s);
  });

  const filteredObjects = objects.filter((o) => {
    const s = searchTerm.toLowerCase();
    return (o.description || '').toLowerCase().includes(s) || (o.type || '').toLowerCase().includes(s) || (o.serial_number || '').toLowerCase().includes(s);
  });

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Users size={24} color="var(--accent-emerald)" />
            <span>Entities & Cross-Case Disambiguation Explorer</span>
          </h1>
          <p className="page-subtitle">
            Catalog of tracked individuals, vehicles, locations, and evidence objects across all case files.
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-surface)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search current entity list..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '12px',
                width: '180px',
              }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={onlyRecurring}
              onChange={(e) => setOnlyRecurring(e.target.checked)}
              style={{ accentColor: 'var(--accent-amber)' }}
            />
            <span>High Recurrence Only</span>
          </label>
        </div>
      </div>

      {/* Entity Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
        {[
          { id: 'persons', label: `Persons (${filteredPersons.length})`, icon: Users },
          { id: 'vehicles', label: `Vehicles (${filteredVehicles.length})`, icon: Car },
          { id: 'locations', label: `Locations (${filteredLocations.length})`, icon: MapPin },
          { id: 'objects', label: `Evidence Objects (${filteredObjects.length})`, icon: Box },
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
                borderBottom: isActive ? '2px solid var(--accent-emerald)' : '2px solid transparent',
                color: isActive ? 'var(--accent-emerald)' : 'var(--text-muted)',
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
          Retrieving entity profiles and cross-case frequencies...
        </div>
      ) : activeTab === 'persons' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredPersons.map((p) => (
            <EntityCard
              key={p.person_id}
              type="PERSON"
              id={p.person_id}
              title={p.name}
              subtitle={`${p.occupation || 'Occupation unrecorded'} ${p.home_location_name ? `• Home: ${p.home_location_name}` : ''}`}
              caseCount={p.case_count}
              cases={p.cases}
              roleDistribution={p.role_distribution}
              isAnomaly={p.is_potential_anomaly}
              anomalyLabel={p.anomaly_label}
              notes={p.investigative_notes}
              onSelectCase={onSelectCase}
              onExploreGraph={onExploreGraph}
            />
          ))}
        </div>
      ) : activeTab === 'vehicles' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredVehicles.map((v) => (
            <EntityCard
              key={v.vehicle_id}
              type="VEHICLE"
              id={v.vehicle_id}
              title={v.registration || v.vehicle_id}
              subtitle={`${v.color || ''} ${v.type || ''} ${v.owner_name ? `• Registered to: ${v.owner_name}` : ''}`}
              caseCount={v.case_count}
              cases={v.cases}
              roleDistribution={v.role_distribution}
              isAnomaly={v.is_potential_anomaly}
              anomalyLabel={v.anomaly_label}
              notes={v.investigative_notes}
              onSelectCase={onSelectCase}
              onExploreGraph={onExploreGraph}
            />
          ))}
        </div>
      ) : activeTab === 'locations' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredLocations.map((l) => (
            <EntityCard
              key={l.location_id}
              type="LOCATION"
              id={l.location_id}
              title={l.name}
              subtitle={`${l.city || ''}, ${l.state || ''} • (${l.latitude}, ${l.longitude})`}
              caseCount={l.case_count}
              cases={l.cases}
              onSelectCase={onSelectCase}
              onExploreGraph={onExploreGraph}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredObjects.map((o) => (
            <EntityCard
              key={o.object_id}
              type="OBJECT"
              id={o.object_id}
              title={o.description || o.object_id}
              subtitle={`Classification: ${o.type || 'N/A'} ${o.serial_number ? `• Serial: ${o.serial_number}` : ''}`}
              caseCount={o.case_count}
              cases={o.cases}
              onSelectCase={onSelectCase}
              onExploreGraph={onExploreGraph}
            />
          ))}
        </div>
      )}
    </div>
  );
};
