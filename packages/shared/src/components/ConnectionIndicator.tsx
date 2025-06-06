import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import type { ConnectionStatus } from '../offline';

interface ConnectionIndicatorProps {
  status: ConnectionStatus;
  className?: string;
}

export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({ 
  status, 
  className 
}) => {
  const getIcon = () => {
    switch (status) {
      case 'online':
        return <Wifi className="w-4 h-4" />;
      case 'offline':
        return <WifiOff className="w-4 h-4" />;
      case 'syncing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      default:
        return <WifiOff className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'text-green-500 bg-green-50 border-green-200';
      case 'offline':
        return 'text-red-500 bg-red-50 border-red-200';
      case 'syncing':
        return 'text-ocean-500 bg-ocean-50 border-ocean-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'Connected';
      case 'offline':
        return 'Offline';
      case 'syncing':
        return 'Syncing';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={clsx(
      'inline-flex items-center gap-2 px-3 py-2 rounded-lg border font-maritime text-sm',
      getStatusColor(),
      className
    )}>
      {getIcon()}
      <span className="font-medium">{getStatusText()}</span>
    </div>
  );
};