import React from 'react';
import { Wifi, WifiOff, Waves } from 'lucide-react';
import { clsx } from 'clsx';
import type { ConnectionStatus } from '../offline';

interface OfflineToggleProps {
  status: ConnectionStatus;
  onToggle: () => void;
  pendingItems?: number;
  className?: string;
}

export const OfflineToggle: React.FC<OfflineToggleProps> = ({
  status,
  onToggle,
  pendingItems = 0,
  className
}) => {
  const isOffline = status === 'offline';
  const isSyncing = status === 'syncing';

  return (
    <div className={clsx('flex items-center gap-3', className)}>
      {/* Main Toggle Button */}
      <button
        onClick={onToggle}
        disabled={isSyncing}
        className={clsx(
          'relative inline-flex items-center gap-3 px-4 py-2 rounded-lg font-maritime text-sm font-medium',
          'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
          isOffline
            ? 'bg-red-100 text-red-800 border-red-200 border focus:ring-red-500'
            : 'bg-green-100 text-green-800 border-green-200 border focus:ring-green-500',
          isSyncing && 'opacity-75 cursor-not-allowed',
          !isSyncing && 'hover:shadow-md'
        )}
      >
        <div className="flex items-center gap-2">
          {isSyncing ? (
            <Waves className="w-4 h-4 animate-pulse" />
          ) : isOffline ? (
            <WifiOff className="w-4 h-4" />
          ) : (
            <Wifi className="w-4 h-4" />
          )}
          
          <span>
            {isSyncing ? 'Syncing...' : isOffline ? 'OFFLINE MODE' : 'ONLINE'}
          </span>
        </div>

        {/* Status indicator dot */}
        <div className={clsx(
          'w-2 h-2 rounded-full',
          isOffline ? 'bg-red-500' : 'bg-green-500',
          isSyncing && 'animate-pulse'
        )} />
      </button>

      {/* Pending items badge */}
      {isOffline && pendingItems > 0 && (
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 border border-amber-200 rounded-lg">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <span className="text-sm font-maritime text-amber-800">
            {pendingItems} queued
          </span>
        </div>
      )}

      {/* Sync success indicator */}
      {status === 'online' && pendingItems === 0 && (
        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 border border-green-200 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-sm font-maritime text-green-800">
            All synced
          </span>
        </div>
      )}
    </div>
  );
};