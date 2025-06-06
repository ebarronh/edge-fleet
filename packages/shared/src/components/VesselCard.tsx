import React from 'react';
import { Ship, MapPin, Gauge, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import type { Vessel, Position } from '../types';
import { ConnectionIndicator } from './ConnectionIndicator';

interface VesselCardProps {
  vessel: Vessel;
  position?: Position;
  isOffline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const VesselCard: React.FC<VesselCardProps> = ({
  vessel,
  position,
  isOffline = false,
  className,
  onClick
}) => {
  const getVesselTypeIcon = (type: string) => {
    // All vessel types use ship icon for simplicity
    return <Ship className="w-5 h-5" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'offline':
        return 'text-red-600';
      case 'maintenance':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatLastSeen = (lastSeen: Date) => {
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else {
      const hours = Math.floor(minutes / 60);
      return `${hours}h ago`;
    }
  };

  return (
    <div
      className={clsx(
        'bg-white rounded-xl border border-navy-200 p-6 transition-all duration-200',
        'hover:shadow-lg hover:border-ocean-300 cursor-pointer',
        isOffline && 'border-red-200 bg-red-50',
        className
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={clsx(
            'p-2 rounded-lg',
            isOffline ? 'bg-red-100 text-red-600' : 'bg-ocean-100 text-ocean-600'
          )}>
            {getVesselTypeIcon(vessel.type)}
          </div>
          <div>
            <h3 className="font-navigation font-semibold text-navy-900">
              {vessel.name}
            </h3>
            <p className="text-sm text-navy-600 capitalize">
              {vessel.type} vessel
            </p>
          </div>
        </div>
        
        <ConnectionIndicator 
          status={isOffline ? 'offline' : 'online'} 
          className="text-xs"
        />
      </div>

      {/* Status and Position */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={clsx(
              'w-2 h-2 rounded-full',
              vessel.status === 'active' ? 'bg-green-500' : 
              vessel.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
            )} />
            <span className={clsx(
              'text-sm font-medium capitalize',
              getStatusColor(vessel.status)
            )}>
              {vessel.status}
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-navy-600">
            <Clock className="w-4 h-4" />
            {formatLastSeen(vessel.lastSeen)}
          </div>
        </div>

        {position && (
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-navy-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-navy-500" />
              <div>
                <p className="text-xs text-navy-500">Position</p>
                <p className="text-sm font-maritime">
                  {position.latitude.toFixed(4)}°N
                </p>
                <p className="text-sm font-maritime">
                  {Math.abs(position.longitude).toFixed(4)}°W
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-navy-500" />
              <div>
                <p className="text-xs text-navy-500">Speed</p>
                <p className="text-sm font-maritime">
                  {position.speed.toFixed(1)} kt
                </p>
                <p className="text-xs text-navy-500">
                  {position.heading.toFixed(0)}° heading
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {isOffline && (
        <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-medium">
            OFFLINE MODE - Data queued for sync
          </p>
        </div>
      )}
    </div>
  );
};