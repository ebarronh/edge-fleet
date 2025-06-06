import { useState, useEffect } from 'react';
import { Compass, Ship, Activity, AlertTriangle, Wifi, Clock, MapPin } from 'lucide-react';
import { db } from '@edge-fleet/shared';
import type { Vessel, Position } from '@edge-fleet/shared';
import { SyncVerificationDashboard } from './components/SyncVerificationDashboard';

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
        const positions: Record<string, Position> = {};
        for (const vessel of allVessels) {
          const latestPosition = await db.getVesselLatestPosition(vessel.id);
          if (latestPosition) {
            positions[vessel.id] = latestPosition;
          }
        }
        setPositions(positions as any);
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
        {/* Map Placeholder */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
          <div className="bg-gradient-to-r from-blue-600/80 to-indigo-600/80 p-4 rounded-t-lg">
            <h2 className="text-xl font-semibold text-white">Fleet Positions</h2>
          </div>
          <div className="p-4">
            <div className="h-96 rounded-lg bg-blue-900/50 border border-blue-600/30 flex items-center justify-center">
              <div className="text-center">
                <Compass className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                <p className="text-blue-200 text-lg font-semibold">Fleet Tracking Map</p>
                <p className="text-blue-300 text-sm">{vessels.length} vessels in Pacific shipping lanes</p>
                
                {/* Vessel Position Grid */}
                <div className="mt-6 relative">
                  <div className="bg-blue-950/50 rounded-lg p-4 border border-blue-600/20">
                    {/* Pacific Ocean Grid */}
                    <div className="grid grid-cols-6 gap-1 mb-2">
                      {Array.from({ length: 24 }, (_, i) => (
                        <div key={i} className="h-8 bg-blue-900/20 rounded border border-blue-700/10"></div>
                      ))}
                    </div>
                    
                    {/* Vessel Markers */}
                    <div className="absolute inset-4">
                      {vessels.map((vessel, index) => {
                        const position = positions[vessel.id];
                        const xPos = position ? ((position.longitude + 125) / 5) * 100 : (index * 33);
                        const yPos = position ? ((40 - position.latitude) / 5) * 100 : 50;
                        
                        return (
                          <div 
                            key={vessel.id}
                            className="absolute transition-all duration-1000"
                            style={{ 
                              left: `${Math.max(0, Math.min(95, xPos))}%`, 
                              top: `${Math.max(0, Math.min(95, yPos))}%`,
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                            <div className="relative group">
                              <div className={`w-3 h-3 rounded-full ${
                                vessel.status === 'offline' ? 'bg-red-500' : 'bg-green-500'
                              } animate-pulse`}></div>
                              
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                  {vessel.name}
                                  {position && (
                                    <div className="text-gray-400">
                                      {position.speed.toFixed(1)} kt
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Legend */}
                    <div className="flex justify-center gap-4 mt-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-400">Active</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-red-400">Offline</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
              return (
                <div key={vessel.id} className={`bg-white/5 border rounded-lg p-4 ${vessel.status === 'offline' ? 'border-red-500/30 bg-red-900/10' : 'border-white/10'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{vessel.name}</h3>
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