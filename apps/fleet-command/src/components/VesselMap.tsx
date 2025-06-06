import { useEffect, useRef, Suspense } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
interface IconDefaultWithUrl extends L.Icon.Default {
  _getIconUrl?: () => void;
}
delete (L.Icon.Default.prototype as IconDefaultWithUrl)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface VesselPosition {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'offline' | 'maintenance';
  position: {
    latitude: number;
    longitude: number;
    heading: number;
    speed: number;
  };
  emoji: string;
  color: string;
}

interface VesselMapProps {
  vessels: VesselPosition[];
}

// Create custom icons for vessels
const createVesselIcon = (emoji: string, color: string, status: 'active' | 'offline' | 'maintenance') => {
  const isOffline = status === 'offline';
  const isMaintenance = status === 'maintenance';
  const bgColor = isOffline ? '#666' : isMaintenance ? '#f59e0b' : color.includes('blue') ? '#2563eb' : color.includes('emerald') ? '#10b981' : '#a855f7';
  
  return L.divIcon({
    html: `
      <div class="vessel-marker ${isOffline ? 'offline' : ''}" style="background: ${bgColor}">
        <span class="vessel-emoji">${emoji}</span>
        ${isOffline ? '<div class="offline-indicator"></div>' : ''}
      </div>
    `,
    className: 'custom-vessel-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

export function VesselMap({ vessels }: VesselMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Add custom CSS for vessel markers
    const style = document.createElement('style');
    style.textContent = `
      .custom-vessel-marker {
        background: none !important;
        border: none !important;
      }
      .vessel-marker {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        border: 2px solid white;
        position: relative;
        transition: transform 0.2s;
      }
      .vessel-marker:hover {
        transform: scale(1.1);
      }
      .vessel-marker.offline {
        opacity: 0.7;
      }
      .vessel-emoji {
        font-size: 24px;
        line-height: 1;
      }
      .offline-indicator {
        position: absolute;
        top: -4px;
        right: -4px;
        width: 12px;
        height: 12px;
        background: #ef4444;
        border: 2px solid white;
        border-radius: 50%;
        animation: pulse 2s infinite;
      }
      @keyframes pulse {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.2);
          opacity: 0.8;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
      .leaflet-popup-content {
        margin: 12px;
        min-width: 200px;
      }
      .vessel-popup {
        text-align: center;
      }
      .vessel-popup h3 {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: bold;
      }
      .vessel-popup .status {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        margin-bottom: 8px;
      }
      .vessel-popup .status.active {
        background: #10b981;
        color: white;
      }
      .vessel-popup .status.offline {
        background: #ef4444;
        color: white;
      }
      .vessel-popup .details {
        font-size: 14px;
        color: #666;
      }
      .vessel-popup .details div {
        margin: 4px 0;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Calculate center based on vessel positions
  const calculateCenter = (): [number, number] => {
    if (vessels.length === 0) return [37.7749, -122.4194]; // Default to San Francisco
    
    const avgLat = vessels.reduce((sum, v) => sum + v.position.latitude, 0) / vessels.length;
    const avgLng = vessels.reduce((sum, v) => sum + v.position.longitude, 0) / vessels.length;
    
    return [avgLat, avgLng];
  };

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-white/20">
      <MapContainer
        center={calculateCenter()}
        zoom={10}
        className="h-full w-full"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {vessels.map((vessel) => (
          <Marker
            key={vessel.id}
            position={[vessel.position.latitude, vessel.position.longitude]}
            icon={createVesselIcon(vessel.emoji, vessel.color, vessel.status)}
          >
            <Popup>
              <div className="vessel-popup">
                <h3>{vessel.emoji} {vessel.name}</h3>
                <span className={`status ${vessel.status}`}>
                  {vessel.status.toUpperCase()}
                </span>
                <div className="details">
                  <div>Type: {vessel.type}</div>
                  <div>Speed: {vessel.position.speed.toFixed(1)} kt</div>
                  <div>Heading: {vessel.position.heading.toFixed(0)}°</div>
                  <div>Position: {vessel.position.latitude.toFixed(4)}°N, {Math.abs(vessel.position.longitude).toFixed(4)}°W</div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Add range circles for active vessels */}
        {vessels.filter(v => v.status === 'active').map((vessel) => (
          <CircleMarker
            key={`range-${vessel.id}`}
            center={[vessel.position.latitude, vessel.position.longitude]}
            radius={30}
            pathOptions={{
              color: vessel.color.includes('blue') ? '#2563eb' : vessel.color.includes('emerald') ? '#10b981' : '#a855f7',
              fillColor: vessel.color.includes('blue') ? '#2563eb' : vessel.color.includes('emerald') ? '#10b981' : '#a855f7',
              fillOpacity: 0.1,
              weight: 1,
              opacity: 0.3
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}