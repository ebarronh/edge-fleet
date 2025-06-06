import { useState, useEffect } from 'react';
import { Anchor, Compass, MapPin, Zap, Wifi, WifiOff } from 'lucide-react';

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

// Simple gauge component
const SimpleGauge = ({ value, max, label, unit, color }: { 
  value: number; 
  max: number; 
  label: string; 
  unit: string; 
  color: string; 
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-300">{label}</span>
        <span className="text-xs text-gray-400">{unit}</span>
      </div>
      <div className="relative w-24 h-24 mx-auto mb-2">
        <svg className="transform -rotate-90 w-24 h-24">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-700"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${percentage * 2.51} 251`}
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-white">{value.toFixed(1)}</span>
        </div>
      </div>
      <div className="text-center text-xs text-gray-400">{label}</div>
    </div>
  );
};

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
  const [isOnline, setIsOnline] = useState(true);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket server
    const connectWebSocket = () => {
      try {
        const websocket = new WebSocket('ws://localhost:3999');
        
        websocket.onopen = () => {
          console.log('Connected to WebSocket server');
          setWs(websocket);
          
          // Identify this vessel to the server
          websocket.send(JSON.stringify({
            type: 'vessel-connected',
            vessel: {
              id: VESSEL_ID,
              name: vesselData.name,
              port: window.location.port,
              type: vesselData.type,
              status: 'active'
            }
          }));
        };

        websocket.onclose = () => {
          console.log('WebSocket connection closed');
          setWs(null);
          // Reconnect after 5 seconds
          setTimeout(connectWebSocket, 5000);
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
        // Retry connection after 5 seconds
        setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    // Update sensor data every 2 seconds
    const interval = setInterval(() => {
      setSensorData(generateSensorData());
    }, 2000);

    // Simulate occasional offline status
    const connectivityInterval = setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance to toggle
        setIsOnline(prev => !prev);
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(connectivityInterval);
      if (ws) {
        ws.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Send status updates when online status changes
  useEffect(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'vessel-status-update',
        vessel: {
          id: VESSEL_ID,
          name: vesselData.name,
          status: isOnline ? 'active' : 'offline',
          position: vesselData.position,
          sensorData: sensorData,
          timestamp: new Date().toISOString()
        }
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, ws]);

  // Send position updates periodically
  useEffect(() => {
    if (ws && ws.readyState === WebSocket.OPEN && isOnline) {
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
  }, [ws, isOnline]);

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
              {isOnline ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-600/20 border border-green-500/30 rounded-lg">
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span className="text-green-300 text-sm font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-600/20 border border-red-500/30 rounded-lg">
                  <WifiOff className="w-4 h-4 text-red-400" />
                  <span className="text-red-300 text-sm font-medium">OFFLINE</span>
                </div>
              )}
              
              <button
                onClick={() => setIsOnline(prev => !prev)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isOnline 
                    ? 'bg-red-600/20 border border-red-500/30 text-red-300 hover:bg-red-600/30' 
                    : 'bg-green-600/20 border border-green-500/30 text-green-300 hover:bg-green-600/30'
                }`}
              >
                {isOnline ? 'Go Offline' : 'Go Online'}
              </button>
              
              <div className="text-right text-white">
                <div className="text-sm font-medium">All synced</div>
                <div className="text-xs text-white/60">Last update: {currentTime}</div>
              </div>
            </div>
          </div>
        </div>

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
              <SimpleGauge 
                value={sensorData.engineRPM} 
                max={2000} 
                label="Engine Speed" 
                unit="RPM" 
                color="#10b981" 
              />
              <SimpleGauge 
                value={sensorData.fuelRate} 
                max={30} 
                label="Fuel Rate" 
                unit="L/h" 
                color="#f59e0b" 
              />
              <SimpleGauge 
                value={sensorData.engineTemp} 
                max={120} 
                label="Engine Temp" 
                unit="°C" 
                color="#ef4444" 
              />
              <SimpleGauge 
                value={sensorData.oilPressure} 
                max={60} 
                label="Oil Pressure" 
                unit="PSI" 
                color="#3b82f6" 
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
              <SimpleGauge 
                value={sensorData.speed} 
                max={25} 
                label="Speed" 
                unit="kt" 
                color="#06b6d4" 
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