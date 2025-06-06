import { useState, useEffect } from 'react';
import { Compass, Ship, Activity, AlertTriangle, Database } from 'lucide-react';

// Only import what we absolutely need from shared package
import {
  db,
  type Vessel,
  type Position
} from '@edge-fleet/shared';

// Import sync verification component
import SyncVerification from './components/SyncVerification';

function App() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [positions, setPositions] = useState<Record<string, Position>>({});
  const [selectedVesselForSync, setSelectedVesselForSync] = useState<string | null>(null);

  useEffect(() => {
    initializeFleet();
  }, []);

  const initializeFleet = async () => {
    try {
      const vesselsData = await db.vessels.toArray();
      setVessels(vesselsData);
      
      // Load latest positions
      const positionData: Record<string, Position> = {};
      for (const vessel of vesselsData) {
        const latestPosition = await db.getVesselLatestPosition(vessel.id);
        if (latestPosition) {
          positionData[vessel.id] = latestPosition;
        }
      }
      setPositions(positionData);
      
      console.log('Fleet Command initialized with', vesselsData.length, 'vessels');
    } catch (error) {
      console.error('Failed to initialize fleet:', error);
    }
  };

  const getFleetStats = () => {
    const activeVessels = vessels.filter(v => v.status === 'active').length;
    const offlineVessels = vessels.filter(v => v.status === 'offline').length;
    const totalPositions = Object.keys(positions).length;
    
    return { activeVessels, offlineVessels, totalPositions };
  };

  const stats = getFleetStats();

  return (
    <div style={{ minHeight: '100vh', padding: '16px', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ backgroundColor: '#2563eb', color: 'white', padding: '24px', borderRadius: '8px 8px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '8px', backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '8px' }}>
                <Compass size={32} />
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Fleet Command Center</h1>
                <p style={{ color: '#dbeafe', margin: '4px 0 0 0' }}>Maritime Operations Control</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setSelectedVesselForSync(vessels[0]?.id || 'vessel-3001')}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '14px',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              >
                <Database size={16} />
                Verify Sync
              </button>
            </div>
          </div>
        </div>

        {/* Fleet Stats */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Activity size={24} color="#16a34a" />
                <div>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a', margin: 0 }}>{stats.activeVessels}</p>
                  <p style={{ fontSize: '14px', color: '#166534', margin: '4px 0 0 0' }}>Active Vessels</p>
                </div>
              </div>
            </div>
            
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertTriangle size={24} color="#dc2626" />
                <div>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626', margin: 0 }}>{stats.offlineVessels}</p>
                  <p style={{ fontSize: '14px', color: '#991b1b', margin: '4px 0 0 0' }}>Offline Vessels</p>
                </div>
              </div>
            </div>
            
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Ship size={24} color="#2563eb" />
                <div>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>{vessels.length}</p>
                  <p style={{ fontSize: '14px', color: '#1e40af', margin: '4px 0 0 0' }}>Total Fleet</p>
                </div>
              </div>
            </div>
            
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Compass size={24} color="#64748b" />
                <div>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#64748b', margin: 0 }}>{stats.totalPositions}</p>
                  <p style={{ fontSize: '14px', color: '#475569', margin: '4px 0 0 0' }}>Tracked Positions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
        {/* Map Placeholder */}
        <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ backgroundColor: '#2563eb', color: 'white', padding: '16px 24px', borderRadius: '8px 8px 0 0' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Fleet Positions</h2>
          </div>
          <div style={{ padding: '16px' }}>
            <div style={{ height: '400px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
              <div style={{ textAlign: 'center' }}>
                <Compass size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                <p>Map will be displayed here</p>
                <p style={{ fontSize: '14px' }}>({Object.keys(positions).length} vessels tracked)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vessel List */}
        <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ backgroundColor: '#2563eb', color: 'white', padding: '16px 24px', borderRadius: '8px 8px 0 0' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Vessel Status</h2>
          </div>
          <div style={{ padding: '16px', maxHeight: '400px', overflowY: 'auto' }}>
            {vessels.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280' }}>
                <Ship size={48} style={{ opacity: 0.5, marginBottom: '12px' }} />
                <p>No vessels in fleet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {vessels.map((vessel) => (
                  <div key={vessel.id} style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>{vessel.name}</h3>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
                          {vessel.type} - {vessel.status}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {positions[vessel.id] && (
                          <div>
                            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                              {positions[vessel.id].latitude.toFixed(4)}°, {positions[vessel.id].longitude.toFixed(4)}°
                            </p>
                            <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0' }}>
                              {positions[vessel.id].speed.toFixed(1)} kt
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sync Verification Modal */}
      {selectedVesselForSync && (
        <SyncVerification
          vesselId={selectedVesselForSync}
          showAutomatically={true}
          onClose={() => setSelectedVesselForSync(null)}
        />
      )}
    </div>
  );
}

export default App;