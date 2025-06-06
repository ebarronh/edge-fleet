import { useState, useEffect } from 'react';
import { initSupabase, getAllVessels, checkConnection, Vessel } from '@edgefleet/supabase-client';
import './App.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3999';

function App() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsSocket, setWsSocket] = useState<WebSocket | null>(null);

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

    // Fetch vessels every 5 seconds
    const interval = setInterval(fetchVessels, 5000);
    fetchVessels();

    return () => {
      clearInterval(interval);
      if (wsSocket) {
        wsSocket.close();
      }
    };
  }, []);

  const checkSupabaseConnection = async () => {
    try {
      const connected = await checkConnection();
      setSupabaseConnected(connected);
    } catch (error) {
      console.error('Supabase connection check failed:', error);
      setSupabaseConnected(false);
    }
  };

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
        ws.send(JSON.stringify({ type: 'fleet-command-connected' }));
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
          if (message.type === 'vessel-update') {
            fetchVessels();
          }
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

  const fetchVessels = async () => {
    try {
      const vesselData = await getAllVessels();
      setVessels(vesselData);
    } catch (error) {
      console.error('Failed to fetch vessels:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚢 Fleet Command Center</h1>
        
        <div className="connection-status">
          <div className={`status ${supabaseConnected ? 'connected' : 'disconnected'}`}>
            <span className="indicator"></span>
            Supabase: {supabaseConnected ? 'Connected' : 'Disconnected'}
          </div>
          <div className={`status ${wsConnected ? 'connected' : 'disconnected'}`}>
            <span className="indicator"></span>
            WebSocket: {wsConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        <div className="vessels-section">
          <h2>Active Vessels ({vessels.length})</h2>
          {vessels.length === 0 ? (
            <p className="no-vessels">No vessels registered</p>
          ) : (
            <div className="vessels-grid">
              {vessels.map((vessel) => (
                <div key={vessel.id} className="vessel-card">
                  <h3>{vessel.name}</h3>
                  <div className={`vessel-status ${vessel.status}`}>
                    Status: {vessel.status}
                  </div>
                  <div className="vessel-details">
                    <small>ID: {vessel.id}</small>
                    {vessel.last_position && (
                      <div>Position: {JSON.stringify(vessel.last_position)}</div>
                    )}
                    <div>Last seen: {new Date(vessel.created_at || '').toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
