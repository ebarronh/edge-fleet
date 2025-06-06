import { useState, useEffect } from 'react';
import { initSupabase, registerVessel, updateVesselStatus, logSync, checkConnection } from '@edgefleet/supabase-client';
import './App.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3999';
const VESSEL_PORT = import.meta.env.VITE_PORT || '3001';
const VESSEL_ID = `vessel-${VESSEL_PORT}`;
const VESSEL_NAME = `Vessel ${VESSEL_PORT}`;

function App() {
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [vesselRegistered, setVesselRegistered] = useState(false);
  const [wsSocket, setWsSocket] = useState<WebSocket | null>(null);
  const [position, setPosition] = useState({ lat: 0, lng: 0 });

  useEffect(() => {
    // Initialize Supabase
    try {
      initSupabase(SUPABASE_URL, SUPABASE_ANON_KEY);
      checkSupabaseConnection();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
    }

    // Connect to WebSocket
    connectWebSocket();

    // Generate random position updates every 10 seconds
    const positionInterval = setInterval(updatePosition, 10000);
    updatePosition();

    return () => {
      clearInterval(positionInterval);
      if (wsSocket) {
        wsSocket.close();
      }
    };
  }, []);

  const checkSupabaseConnection = async () => {
    try {
      const connected = await checkConnection();
      setSupabaseConnected(connected);
      
      if (connected && !vesselRegistered) {
        await registerVesselInSupabase();
      }
    } catch (error) {
      console.error('Supabase connection check failed:', error);
      setSupabaseConnected(false);
    }
  };

  const registerVesselInSupabase = async () => {
    try {
      await registerVessel({
        id: VESSEL_ID,
        name: VESSEL_NAME,
        status: 'online',
        last_position: position
      });
      
      await logSync({
        vessel_id: VESSEL_ID,
        action: 'vessel_registered',
        data: { name: VESSEL_NAME, port: VESSEL_PORT }
      });
      
      setVesselRegistered(true);
      console.log('Vessel registered successfully');
    } catch (error) {
      console.error('Failed to register vessel:', error);
    }
  };

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
        ws.send(JSON.stringify({ 
          type: 'vessel-connected', 
          vessel: { id: VESSEL_ID, name: VESSEL_NAME, port: VESSEL_PORT }
        }));
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket message:', message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      setWsSocket(ws);
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setWsConnected(false);
    }
  };

  const updatePosition = () => {
    const newPosition = {
      lat: (Math.random() - 0.5) * 180,
      lng: (Math.random() - 0.5) * 360
    };
    setPosition(newPosition);
    
    if (supabaseConnected && vesselRegistered) {
      updateVesselStatus(VESSEL_ID, 'online', newPosition).catch(error => {
        console.error('Failed to update vessel position:', error);
      });
    }

    if (wsConnected && wsSocket) {
      wsSocket.send(JSON.stringify({
        type: 'position-update',
        vessel: { id: VESSEL_ID, position: newPosition }
      }));
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>⛵ {VESSEL_NAME}</h1>
        <p className="vessel-id">ID: {VESSEL_ID}</p>
        
        <div className="connection-status">
          <div className={`status ${supabaseConnected ? 'connected' : 'disconnected'}`}>
            <span className="indicator"></span>
            Supabase: {supabaseConnected ? 'Connected' : 'Disconnected'}
          </div>
          <div className={`status ${wsConnected ? 'connected' : 'disconnected'}`}>
            <span className="indicator"></span>
            WebSocket: {wsConnected ? 'Connected' : 'Disconnected'}
          </div>
          <div className={`status ${vesselRegistered ? 'connected' : 'disconnected'}`}>
            <span className="indicator"></span>
            Registered: {vesselRegistered ? 'Yes' : 'No'}
          </div>
        </div>

        <div className="vessel-info">
          <h2>Vessel Status</h2>
          <div className="info-grid">
            <div className="info-item">
              <strong>Port:</strong> {VESSEL_PORT}
            </div>
            <div className="info-item">
              <strong>Status:</strong> Online
            </div>
            <div className="info-item">
              <strong>Position:</strong> 
              <br />
              Lat: {position.lat.toFixed(4)}°
              <br />
              Lng: {position.lng.toFixed(4)}°
            </div>
          </div>
          
          <button 
            onClick={updatePosition} 
            className="update-position-btn"
            disabled={!supabaseConnected}
          >
            Update Position
          </button>
        </div>
      </header>
    </div>
  );
}

export default App;
