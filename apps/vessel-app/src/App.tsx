import { useState, useEffect } from 'react';
import { Anchor, Compass, MapPin, Zap, Wifi, Database, CloudOff, Cloud } from 'lucide-react';
import { db, offlineManager } from '@edge-fleet/shared';
import type { ConnectionStatus } from '@edge-fleet/shared';
import { AnimatedGauge } from './components/AnimatedGauge';

// Mock data for fallback mode
const getVesselId = () => {
  const port = window.location.port || '3001';
  return `vessel-${port}`;
};

const VESSEL_ID = getVesselId();

// Mock vessel data based on port
const getVesselData = (vesselId: string) => {
  const vesselMap: Record<string, {
    id: string;
    name: string;
    type: string;
    status: string;
    position: { latitude: number; longitude: number; speed: number; heading: number };
  }> = {
    'vessel-3001': {
      id: 'vessel-3001',
      name: 'MV Pacific Explorer',
      type: 'cargo',
      status: 'active',
      position: { latitude: 37.7749, longitude: -122.4194, speed: 12.5, heading: 245 }
    },
    'vessel-3002': {
      id: 'vessel-3002', 
      name: 'SS Northern Star',
      type: 'tanker',
      status: 'active',
      position: { latitude: 38.1749, longitude: -123.4194, speed: 8.2, heading: 180 }
    },
    'vessel-3003': {
      id: 'vessel-3003',
      name: 'MV Coastal Pioneer', 
      type: 'container',
      status: 'active',
      position: { latitude: 39.2749, longitude: -121.4194, speed: 15.1, heading: 95 }
    }
  };
  
  return vesselMap[vesselId] || vesselMap['vessel-3001'];
};

const vesselData = getVesselData(VESSEL_ID);


// Mock sensor data generator  
const generateSensorData = () => ({
  engineRPM: 1159.6 + (Math.random() - 0.5) * 50,
  fuelRate: 15.8 + (Math.random() - 0.5) * 2,
  engineTemp: 85 + (Math.random() - 0.5) * 10,
  oilPressure: 45 + (Math.random() - 0.5) * 5,
  speed: vesselData.position.speed + (Math.random() - 0.5) * 2,
  heading: vesselData.position.heading + (Math.random() - 0.5) * 10
});

console.log('Vessel App starting:', vesselData.name, 'on port:', window.location.port);

function App() {
  const [sensorData, setSensorData] = useState(generateSensorData());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(offlineManager.status as ConnectionStatus);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [syncQueueSize, setSyncQueueSize] = useState(0);
  const [syncStats, setSyncStats] = useState<{ pendingItems: number; totalDataSize: string; compressedSize: string; bandwidthSaved: string; costSaved: string } | null>(null);
  
  // Initialize vessel in database on mount
  useEffect(() => {
    const initVessel = async () => {
      try {
        // Check if vessel exists
        const existingVessel = await db.vessels.get(VESSEL_ID);
        if (!existingVessel) {
          // Create vessel if it doesn't exist
          await db.vessels.add({
            id: VESSEL_ID,
            name: vesselData.name,
            type: vesselData.type as 'cargo' | 'tanker' | 'container',
            status: offlineManager.status === 'offline' ? 'offline' : 'active',
            lastSeen: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      } catch (error) {
        console.error('Failed to initialize vessel in DB:', error);
      }
    };
    
    initVessel();
  }, []);

  // Listen to offline manager status changes
  useEffect(() => {
    const unsubscribe = offlineManager.addListener(async (status) => {
      setConnectionStatus(status);
      
      // Update vessel status in database when connection status changes
      try {
        await db.vessels.update(VESSEL_ID, {
          status: status === 'offline' ? 'offline' : 'active',
          lastSeen: new Date()
        });
      } catch (error) {
        console.error('Failed to update vessel status in DB:', error);
      }
    });

    // Update sync queue size periodically
    const syncInterval = setInterval(async () => {
      const size = await db.getSyncQueueSize();
      setSyncQueueSize(size);
      
      if (connectionStatus === 'syncing' || size > 0) {
        const stats = await offlineManager.getSyncStats();
        setSyncStats(stats);
      }
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(syncInterval);
    };
  }, [connectionStatus]);

  useEffect(() => {
    // Connect to WebSocket server only when online
    const connectWebSocket = () => {
      if ((connectionStatus as string) === 'offline') {
        // Close existing connection when going offline
        if (ws) {
          ws.close();
          setWs(null);
        }
        return;
      }
      
      try {
        const websocket = new WebSocket('ws://localhost:3999');
        
        websocket.onopen = () => {
          console.log('Connected to WebSocket server');
          setWs(websocket);
          
          // Identify this vessel to the server with current connection status
          websocket.send(JSON.stringify({
            type: 'vessel-connected',
            vessel: {
              id: VESSEL_ID,
              name: vesselData.name,
              port: window.location.port,
              type: vesselData.type,
              status: 'active' // When we connect, we're active
            }
          }));
        };

        websocket.onclose = () => {
          console.log('WebSocket connection closed');
          setWs(null);
          // Reconnect after 5 seconds if still online
          if ((connectionStatus as string) !== 'offline') {
            setTimeout(connectWebSocket, 5000);
          }
        };

        websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        websocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('Received message:', message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        // Retry connection after 5 seconds if online
        if ((connectionStatus as string) !== 'offline') {
          setTimeout(connectWebSocket, 5000);
        }
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionStatus]);

  useEffect(() => {

    // Update sensor data and persist to IndexedDB every 2 seconds
    const interval = setInterval(async () => {
      const newSensorData = generateSensorData();
      setSensorData(newSensorData);
      
      // Persist sensor data to IndexedDB
      try {
        await db.addSensorData(VESSEL_ID, {
          type: 'engine_rpm',
          value: newSensorData.engineRPM,
          unit: 'RPM',
          timestamp: new Date()
        });
        
        await db.addSensorData(VESSEL_ID, {
          type: 'fuel_consumption',
          value: newSensorData.fuelRate,
          unit: 'L/h',
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Failed to persist sensor data:', error);
      }
    }, 2000);

    // Update position every 5 seconds and persist to IndexedDB
    const positionInterval = setInterval(async () => {
      const position = {
        latitude: vesselData.position.latitude + (Math.random() - 0.5) * 0.001,
        longitude: vesselData.position.longitude + (Math.random() - 0.5) * 0.001,
        heading: sensorData.heading,
        speed: sensorData.speed,
        timestamp: new Date()
      };
      
      try {
        await db.updateVesselPosition(VESSEL_ID, position);
      } catch (error) {
        console.error('Failed to persist position:', error);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(positionInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Send status updates when connection status changes
  useEffect(() => {
    if (connectionStatus === 'offline' && ws && ws.readyState === WebSocket.OPEN) {
      // When going offline, send the offline status and wait for confirmation before closing
      console.log('Going offline, sending status update...');
      
      const offlineMessage = JSON.stringify({
        type: 'vessel-status-update',
        vessel: {
          id: VESSEL_ID,
          name: vesselData.name,
          status: 'offline',
          position: vesselData.position,
          sensorData: sensorData,
          timestamp: new Date().toISOString()
        }
      });
      
      // Send the message and wait a bit longer to ensure it's transmitted
      ws.send(offlineMessage);
      
      // Also send a direct offline notification
      ws.send(JSON.stringify({
        type: 'vessel-going-offline',
        vessel: {
          id: VESSEL_ID,
          name: vesselData.name
        }
      }));
      
      // Close the connection after ensuring messages are sent
      setTimeout(() => {
        console.log('Closing WebSocket connection...');
        ws.close();
      }, 500); // Give more time for messages to be sent
      
    } else if (connectionStatus === 'online' && ws && ws.readyState === WebSocket.OPEN) {
      // When online, send active status
      ws.send(JSON.stringify({
        type: 'vessel-status-update',
        vessel: {
          id: VESSEL_ID,
          name: vesselData.name,
          status: 'active',
          position: vesselData.position,
          sensorData: sensorData,
          timestamp: new Date().toISOString()
        }
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionStatus, ws]);

  // Send position updates periodically when online
  useEffect(() => {
    if (ws && ws.readyState === WebSocket.OPEN && connectionStatus !== 'offline') {
      const positionInterval = setInterval(() => {
        ws.send(JSON.stringify({
          type: 'position-update',
          vessel: {
            id: VESSEL_ID,
            name: vesselData.name,
            position: {
              ...vesselData.position,
              speed: sensorData.speed,
              heading: sensorData.heading
            },
            timestamp: new Date().toISOString()
          }
        }));
      }, 5000); // Send position every 5 seconds

      return () => clearInterval(positionInterval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws, connectionStatus]);

  const currentTime = new Date().toLocaleTimeString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg mb-6">
        <div className="bg-gradient-to-r from-blue-600/80 to-indigo-600/80 p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <Anchor className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{vesselData.name}</h1>
                <p className="text-white/80">Bridge Control System</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {connectionStatus === 'offline' ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-600/20 border border-red-500/30 rounded-lg">
                  <CloudOff className="w-4 h-4 text-red-400" />
                  <span className="text-red-300 text-sm font-medium">OFFLINE MODE</span>
                </div>
              ) : connectionStatus === 'syncing' ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-600/20 border border-yellow-500/30 rounded-lg">
                  <Cloud className="w-4 h-4 text-yellow-400 animate-pulse" />
                  <span className="text-yellow-300 text-sm font-medium">SYNCING...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-600/20 border border-green-500/30 rounded-lg">
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span className="text-green-300 text-sm font-medium">ONLINE</span>
                </div>
              )}
              
              {syncQueueSize > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-lg">
                  <Database className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-300 text-sm font-medium">{syncQueueSize} pending</span>
                </div>
              )}
              
              <button
                onClick={() => offlineManager.toggleOffline()}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  connectionStatus === 'offline' 
                    ? 'bg-green-600/20 border border-green-500/30 text-green-300 hover:bg-green-600/30' 
                    : 'bg-red-600/20 border border-red-500/30 text-red-300 hover:bg-red-600/30'
                }`}
              >
                {connectionStatus === 'offline' ? 'Go Online' : 'Go Offline'}
              </button>
              
              <div className="text-right text-white">
                <div className="text-sm font-medium">
                  {syncQueueSize > 0 ? `${syncQueueSize} items queued` : 'All synced'}
                </div>
                <div className="text-xs text-white/60">Last update: {currentTime}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Stats Banner */}
        {syncStats && syncQueueSize > 0 && (
          <div className="px-6 py-3 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Database className="w-5 h-5 text-blue-400 animate-pulse" />
                <div className="text-sm text-white">
                  <span className="font-medium">Sync Queue:</span> {syncStats.pendingItems} items
                </div>
                <div className="text-sm text-white/70">
                  {syncStats.totalDataSize} → {syncStats.compressedSize} 
                  <span className="text-green-400 ml-2">({syncStats.bandwidthSaved} saved)</span>
                </div>
              </div>
              {connectionStatus === 'syncing' && (
                <div className="text-sm text-yellow-300">
                  Syncing to cloud...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Cards */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6 text-blue-400" />
                <div>
                  <h3 className="font-semibold text-white">Position</h3>
                  <p className="text-sm text-gray-300">
                    {vesselData.position.latitude.toFixed(6)}° N
                  </p>
                  <p className="text-sm text-gray-300">
                    {Math.abs(vesselData.position.longitude).toFixed(6)}° W
                  </p>
                  <p className="text-xs text-gray-400">Last update: {currentTime}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Compass className="w-6 h-6 text-blue-400" />
                <div>
                  <h3 className="font-semibold text-white">Navigation</h3>
                  <p className="text-sm text-gray-300">Speed: {sensorData.speed.toFixed(1)} kt</p>
                  <p className="text-sm text-gray-300">Heading: {sensorData.heading.toFixed(0)}°</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-green-400" />
                <div>
                  <h3 className="font-semibold text-white">Status</h3>
                  <p className="text-lg font-bold text-green-400">OPERATIONAL</p>
                  <p className="text-sm text-gray-400">Vessel ID: {VESSEL_ID}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engine Systems */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
          <div className="bg-gradient-to-r from-green-600/80 to-emerald-600/80 p-4 rounded-t-lg">
            <h2 className="text-xl font-semibold text-white">Engine Systems</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <AnimatedGauge 
                value={sensorData.engineRPM} 
                max={2000} 
                label="Engine Speed" 
                unit="RPM" 
                color="#10b981"
                criticalThreshold={1800}
              />
              <AnimatedGauge 
                value={sensorData.fuelRate} 
                max={30} 
                label="Fuel Rate" 
                unit="L/h" 
                color="#f59e0b"
                criticalThreshold={25}
              />
              <AnimatedGauge 
                value={sensorData.engineTemp} 
                max={120} 
                label="Engine Temp" 
                unit="°C" 
                color="#ef4444"
                criticalThreshold={100}
              />
              <AnimatedGauge 
                value={sensorData.oilPressure} 
                max={60} 
                label="Oil Pressure" 
                unit="PSI" 
                color="#3b82f6"
                criticalThreshold={50}
              />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
          <div className="bg-gradient-to-r from-blue-600/80 to-cyan-600/80 p-4 rounded-t-lg">
            <h2 className="text-xl font-semibold text-white">Navigation</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <AnimatedGauge 
                value={sensorData.speed} 
                max={25} 
                label="Speed" 
                unit="kt" 
                color="#06b6d4"
                criticalThreshold={20}
              />
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-center">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
                  <div 
                    className="absolute inset-2 flex items-center justify-center"
                    style={{ transform: `rotate(${sensorData.heading}deg)` }}
                  >
                    <div className="w-1 h-8 bg-red-500 rounded-full origin-bottom"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white mt-6">{sensorData.heading.toFixed(0)}°</span>
                  </div>
                  <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-xs text-white">N</div>
                  <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs text-white">E</div>
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs text-white">S</div>
                  <div className="absolute left-1 top-1/2 transform -translate-y-1/2 text-xs text-white">W</div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className="text-2xl font-bold text-white">{sensorData.heading.toFixed(0)}°</div>
              <div className="text-sm text-gray-400">Heading</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;