import { useState, useEffect } from 'react';
import { Compass, Ship, Activity, AlertTriangle, Wifi, Clock, MapPin } from 'lucide-react';
import { db } from '@edge-fleet/shared';
import type { Vessel } from '@edge-fleet/shared';
import { SyncVerificationDashboard } from './components/SyncVerificationDashboard';
import { VesselMap } from './components/VesselMap';
import { MapErrorBoundary } from './components/MapWrapper';

// Helper function to get vessel display info
const getVesselDisplayInfo = (vesselId: string, vesselType: string) => {
  const vesselInfo: Record<string, { emoji: string; color: string }> = {
    'vessel-3001': { emoji: '🚢', color: 'from-blue-600/80 to-indigo-600/80' },
    'vessel-3002': { emoji: '⛴️', color: 'from-emerald-600/80 to-teal-600/80' },
    'vessel-3003': { emoji: '🛳️', color: 'from-purple-600/80 to-pink-600/80' }
  };
  
  return vesselInfo[vesselId] || { 
    emoji: vesselType === 'cargo' ? '🚢' : vesselType === 'tanker' ? '⛴️' : '🛳️',
    color: 'from-gray-600/80 to-gray-700/80'
  };
};

function App() {
  const [vessels, setVessels] = useState<Vessel[]>([]);

  const [positions, setPositions] = useState<Record<string, { latitude: number; longitude: number; speed: number; heading: number }>>({
    'vessel-3001': { latitude: 37.7749, longitude: -122.4194, speed: 12.5, heading: 245 },
    'vessel-3002': { latitude: 38.1749, longitude: -123.4194, speed: 8.2, heading: 180 },
    'vessel-3003': { latitude: 39.2749, longitude: -121.4194, speed: 15.1, heading: 95 }
  });

  const [ws, setWs] = useState<WebSocket | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [wsConnected, setWsConnected] = useState(false);

  // Load vessels from IndexedDB on mount
  useEffect(() => {
    const loadVessels = async () => {
      try {
        const allVessels = await db.vessels.toArray();
        setVessels(allVessels);
        
        // Load latest positions for each vessel
        const positionsMap: Record<string, { latitude: number; longitude: number; speed: number; heading: number }> = {};
        for (const vessel of allVessels) {
          const latestPosition = await db.getVesselLatestPosition(vessel.id);
          if (latestPosition) {
            positionsMap[vessel.id] = {
              latitude: latestPosition.latitude,
              longitude: latestPosition.longitude,
              speed: latestPosition.speed,
              heading: latestPosition.heading
            };
          }
        }
        setPositions(positionsMap);
      } catch (error) {
        console.error('Failed to load vessels from IndexedDB:', error);
      }
    };
    
    loadVessels();
    
    // Refresh vessel data every 5 seconds
    const refreshInterval = setInterval(loadVessels, 5000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    // Connect to WebSocket server
    const connectWebSocket = () => {
      try {
        const websocket = new WebSocket('ws://localhost:3999');
        
        websocket.onopen = () => {
          console.log('Fleet Command connected to WebSocket server');
          setWs(websocket);
          setWsConnected(true);
          
          // Identify as fleet command
          websocket.send(JSON.stringify({
            type: 'fleet-command-connected'
          }));
        };

        websocket.onclose = () => {
          console.log('WebSocket connection closed');
          setWs(null);
          setWsConnected(false);
          // Reconnect after 5 seconds
          setTimeout(connectWebSocket, 5000);
        };

        websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          setWsConnected(false);
        };

        websocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('Fleet Command received:', message);
            
            if (message.type === 'vessel-status-update') {
              // Update vessel status in state and IndexedDB
              setVessels(prevVessels => 
                prevVessels.map(vessel => 
                  vessel.id === message.vessel.id 
                    ? { ...vessel, status: message.vessel.status, lastSeen: new Date() }
                    : vessel
                )
              );
              
              // Update in IndexedDB
              db.vessels.update(message.vessel.id, {
                status: message.vessel.status,
                lastSeen: new Date()
              });
              
              // Update position if provided
              if (message.vessel.position) {
                const position = message.vessel.position;
                setPositions(prevPositions => ({
                  ...prevPositions,
                  [message.vessel.id]: position
                }));
                
                // Save to IndexedDB
                db.updateVesselPosition(message.vessel.id, {
                  latitude: position.latitude,
                  longitude: position.longitude,
                  heading: position.heading || 0,
                  speed: position.speed || 0,
                  timestamp: new Date()
                });
              }
              
              setLastUpdate(new Date());
            } else if (message.type === 'vessel-update') {
              // Update vessel position
              if (message.vessel.position) {
                setPositions(prevPositions => ({
                  ...prevPositions,
                  [message.vessel.id]: message.vessel.position
                }));
              }
              setLastUpdate(new Date());
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate dynamic fleet stats
  const getFleetStats = () => {
    const activeVessels = vessels.filter(v => v.status === 'active').length;
    const offlineVessels = vessels.filter(v => v.status === 'offline').length;
    const totalPositions = Object.keys(positions).length;
    
    return { activeVessels, offlineVessels, totalPositions };
  };

  const stats = getFleetStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 p-4">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg mb-6">
        <div className="bg-gradient-to-r from-blue-600/80 to-indigo-600/80 p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <Compass className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Fleet Command Center</h1>
                <p className="text-white/80">Maritime Operations Control</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {wsConnected ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-600/20 border border-green-500/30 rounded-lg">
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span className="text-green-300 text-sm font-medium">Live Data</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-600/20 border border-red-500/30 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-red-300 text-sm font-medium">Offline Mode</span>
                </div>
              )}
              
              <div className="text-right text-white text-xs">
                <div>Last update: {lastUpdate.toLocaleTimeString()}</div>
              </div>
              
              <SyncVerificationDashboard />
            </div>
          </div>
        </div>

        {/* Fleet Stats */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.activeVessels}</p>
                  <p className="text-sm text-green-700">Active Vessels</p>
                </div>
              </div>
            </div>
            
            {stats.offlineVessels > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold text-red-600">{stats.offlineVessels}</p>
                    <p className="text-sm text-red-700">Offline Vessels</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Ship className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">{vessels.length}</p>
                  <p className="text-sm text-blue-700">Total Fleet</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Compass className="w-6 h-6 text-gray-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-600">{stats.totalPositions}</p>
                  <p className="text-sm text-gray-700">Tracked Positions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fleet Map */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
          <div className="bg-gradient-to-r from-blue-600/80 to-indigo-600/80 p-4 rounded-t-lg">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Fleet Positions
            </h2>
          </div>
          <div className="p-4">
            <div className="h-96">
              <MapErrorBoundary>
                <VesselMap 
                  vessels={vessels.map(vessel => {
                    const position = positions[vessel.id];
                    const displayInfo = getVesselDisplayInfo(vessel.id, vessel.type);
                    return {
                      id: vessel.id,
                      name: vessel.name,
                      type: vessel.type,
                      status: vessel.status,
                      position: position || { 
                        latitude: 37.7749, 
                        longitude: -122.4194, 
                        heading: 0, 
                        speed: 0 
                      },
                      emoji: displayInfo.emoji,
                      color: displayInfo.color
                    };
                  })}
                />
              </MapErrorBoundary>
            </div>
          </div>
        </div>

        {/* Vessel List */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
          <div className="bg-gradient-to-r from-blue-600/80 to-indigo-600/80 p-4 rounded-t-lg">
            <h2 className="text-xl font-semibold text-white">Vessel Status</h2>
          </div>
          <div className="p-4 space-y-4">
            {vessels.map((vessel) => {
              const position = positions[vessel.id];
              const displayInfo = getVesselDisplayInfo(vessel.id, vessel.type);
              return (
                <div key={vessel.id} className={`bg-white/5 border rounded-lg p-4 ${vessel.status === 'offline' ? 'border-red-500/30 bg-red-900/10' : 'border-white/10'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <span className="text-2xl">{displayInfo.emoji}</span>
                        {vessel.name}
                      </h3>
                      <p className="text-sm text-gray-300">{vessel.type} vessel</p>
                      {position && (
                        <p className="text-xs text-gray-400 mt-1">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {position.latitude.toFixed(4)}°, {position.longitude.toFixed(4)}°
                        </p>
                      )}
                      {vessel.status === 'offline' && vessel.lastSeen && (
                        <p className="text-xs text-red-300 mt-1">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Last seen: {new Date(vessel.lastSeen).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${vessel.status === 'offline' ? 'text-red-400' : 'text-green-400'}`}>
                        {vessel.status === 'offline' ? 'OFFLINE' : 'ACTIVE'}
                      </div>
                      {position && vessel.status === 'active' && (
                        <div className="text-xs text-gray-400">
                          {position.speed.toFixed(1)} kt
                        </div>
                      )}
                      {vessel.status === 'offline' && (
                        <div className="text-xs text-red-300">
                          Connection lost
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;