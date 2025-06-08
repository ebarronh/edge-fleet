import { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

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

interface SimpleMapProps {
  vessels: VesselPosition[];
}

export function SimpleMap({ vessels }: SimpleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  // Calculate map bounds
  const bounds = vessels.reduce((acc, vessel) => {
    return {
      minLat: Math.min(acc.minLat, vessel.position.latitude),
      maxLat: Math.max(acc.maxLat, vessel.position.latitude),
      minLng: Math.min(acc.minLng, vessel.position.longitude),
      maxLng: Math.max(acc.maxLng, vessel.position.longitude),
    };
  }, {
    minLat: vessels[0]?.position.latitude || 37.7749,
    maxLat: vessels[0]?.position.latitude || 37.7749,
    minLng: vessels[0]?.position.longitude || -122.4194,
    maxLng: vessels[0]?.position.longitude || -122.4194,
  });

  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const centerLng = (bounds.minLng + bounds.maxLng) / 2;
  const latRange = Math.max(bounds.maxLat - bounds.minLat, 2);
  const lngRange = Math.max(bounds.maxLng - bounds.minLng, 2);

  // Convert lat/lng to map coordinates
  const latLngToXY = (lat: number, lng: number) => {
    const x = ((lng - bounds.minLng) / lngRange) * 100;
    const y = ((bounds.maxLat - lat) / latRange) * 100;
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  return (
    <div ref={mapRef} className="h-full w-full bg-gradient-to-br from-blue-900/80 to-blue-800/80 rounded-lg relative overflow-hidden">
      {/* Ocean grid pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="grid grid-cols-12 grid-rows-8 h-full w-full">
          {Array.from({ length: 96 }).map((_, i) => (
            <div key={i} className="border border-blue-600/30"></div>
          ))}
        </div>
      </div>
      
      {/* Map title */}
      <div className="absolute top-4 left-4 bg-blue-900/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-blue-600/30">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Pacific Ocean Region
        </h3>
      </div>

      {/* Vessel markers */}
      <div className="absolute inset-0">
        {vessels.map((vessel) => {
          const { x, y } = latLngToXY(vessel.position.latitude, vessel.position.longitude);
          const isOffline = vessel.status === 'offline';
          
          return (
            <div
              key={vessel.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
              style={{ 
                left: `${x}%`, 
                top: `${y}%`,
                zIndex: isOffline ? 10 : 20
              }}
            >
              {/* Range circle */}
              {!isOffline && (
                <div 
                  className="absolute -inset-8 rounded-full animate-pulse opacity-20"
                  style={{ 
                    background: vessel.color.includes('blue') ? '#2563eb' : 
                               vessel.color.includes('emerald') ? '#10b981' : '#a855f7'
                  }}
                />
              )}
              
              {/* Vessel marker */}
              <div 
                className={`relative w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shadow-lg transition-transform hover:scale-110 ${
                  isOffline ? 'opacity-70' : ''
                }`}
                style={{ 
                  background: isOffline ? '#666' : 
                    vessel.color.includes('blue') ? '#2563eb' : 
                    vessel.color.includes('emerald') ? '#10b981' : '#a855f7'
                }}
              >
                <span className="text-2xl">{vessel.emoji}</span>
                
                {/* Offline indicator */}
                {isOffline && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white animate-pulse" />
                )}
              </div>
              
              {/* Vessel info tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                  <div className="font-semibold">{vessel.name}</div>
                  <div className="text-gray-400">{vessel.type} vessel</div>
                  <div className="text-gray-400">Speed: {vessel.position.speed.toFixed(1)} kt</div>
                  <div className="text-gray-400">Heading: {vessel.position.heading.toFixed(0)}°</div>
                  {isOffline && <div className="text-red-400 mt-1">OFFLINE</div>}
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                  <div className="w-2 h-2 bg-gray-900 transform rotate-45"></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-blue-900/80 backdrop-blur-sm px-4 py-3 rounded-lg border border-blue-600/30">
        <div className="text-xs text-white space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Active Vessel</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span>Offline Vessel</span>
          </div>
        </div>
      </div>

      {/* Coordinates */}
      <div className="absolute bottom-4 left-4 text-xs text-blue-300">
        <div>Center: {centerLat.toFixed(2)}°N, {Math.abs(centerLng).toFixed(2)}°W</div>
      </div>
    </div>
  );
}