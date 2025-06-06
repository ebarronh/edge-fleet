import React from 'react';
import { Database, Upload, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import type { SyncStats } from '../offline';

interface SyncStatusProps {
  stats: SyncStats;
  isVisible?: boolean;
  className?: string;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({
  stats,
  isVisible = true,
  className
}) => {
  if (!isVisible || stats.pendingItems === 0) {
    return null;
  }

  return (
    <div className={clsx(
      'bg-gradient-to-r from-ocean-50 to-navy-50 border border-ocean-200 rounded-xl p-4',
      'shadow-lg backdrop-blur-sm',
      className
    )}>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-ocean-100 rounded-lg">
          <Database className="w-5 h-5 text-ocean-600" />
        </div>
        <div>
          <h3 className="font-navigation font-semibold text-navy-900">
            Sync Queue
          </h3>
          <p className="text-sm text-navy-600">
            {stats.pendingItems} items pending sync
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-navy-500" />
            <span className="text-sm text-navy-600">Data Optimized</span>
          </div>
          <div className="font-maritime text-sm">
            <span className="text-navy-800 font-semibold">
              {stats.totalDataSize}
            </span>
            <span className="text-navy-500 mx-2">→</span>
            <span className="text-green-600 font-semibold">
              {stats.compressedSize}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-navy-600">Savings</span>
          </div>
          <div className="font-maritime text-sm">
            <div className="text-green-600 font-semibold">
              {stats.bandwidthSaved} saved
            </div>
            <div className="text-green-600 font-semibold">
              {stats.costSaved} cost reduction
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-navy-600 mb-1">
          <span>Ready to sync</span>
          <span>{stats.pendingItems} items</span>
        </div>
        <div className="w-full bg-navy-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-ocean-500 to-ocean-600 h-2 rounded-full transition-all duration-300"
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
};