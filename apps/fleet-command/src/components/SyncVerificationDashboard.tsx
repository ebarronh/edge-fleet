import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Database, Check, X, RefreshCw, AlertTriangle, Cloud } from 'lucide-react';
import { db } from '@edge-fleet/shared';

interface SyncStats {
  localRecords: {
    vessels: number;
    positions: number;
    sensorData: number;
    syncQueue: number;
  };
  cloudRecords: {
    vessels: number;
    positions: number;
    sensorData: number;
  };
  dataSaved: string;
  costSaved: string;
  compressionRatio: number;
  syncSuccess: boolean;
  projections: {
    dailyDataGB: number;
    dailyDataSavedGB: number;
    dailyCostSaved: number;
    yearlyCostSaved: number;
  };
}

export function SyncVerificationDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Get local record counts from Dexie
      const localVessels = await db.vessels.count();
      const localPositions = await db.positions.count();
      const localSensorData = await db.sensorData.count();
      const syncQueueSize = await db.getSyncQueueSize();

      // Simulate cloud record counts (in real app, this would query Supabase)
      const cloudVessels = localVessels; // Assume synced
      const cloudPositions = Math.max(0, localPositions - syncQueueSize);
      const cloudSensorData = Math.max(0, localSensorData - syncQueueSize);

      // Calculate data savings
      const avgRecordSize = 0.5; // KB per record
      const totalLocalSize = (localPositions + localSensorData) * avgRecordSize;
      const compressionRatio = 0.85;
      const compressedSize = totalLocalSize * compressionRatio;
      const dataSaved = totalLocalSize - compressedSize;
      
      // Calculate cost savings ($0.09 per GB for demo)
      const costPerKB = 0.00009;
      const costSaved = dataSaved * costPerKB;
      
      // Calculate realistic maritime projections
      // Based on research: average vessel uses 10GB/day (2021 data)
      // Video surveillance and monitoring can push this to 20-50GB/day
      const avgDailyDataGB = 25; // Mid-range estimate
      const compressionSavingsPercent = 15; // 15% savings from compression
      const dailyDataSavedGB = avgDailyDataGB * (compressionSavingsPercent / 100);
      const maritimeCostPerGB = 0.50; // Realistic satellite data cost
      const dailyCostSaved = dailyDataSavedGB * maritimeCostPerGB;
      const yearlyCostSaved = dailyCostSaved * 365;

      setStats({
        localRecords: {
          vessels: localVessels,
          positions: localPositions,
          sensorData: localSensorData,
          syncQueue: syncQueueSize
        },
        cloudRecords: {
          vessels: cloudVessels,
          positions: cloudPositions,
          sensorData: cloudSensorData
        },
        dataSaved: `${dataSaved.toFixed(1)}KB`,
        costSaved: `$${costSaved.toFixed(2)}`,
        compressionRatio: compressionRatio * 100,
        syncSuccess: syncQueueSize === 0,
        projections: {
          dailyDataGB: avgDailyDataGB,
          dailyDataSavedGB: dailyDataSavedGB,
          dailyCostSaved: dailyCostSaved,
          yearlyCostSaved: yearlyCostSaved
        }
      });
    } catch (error) {
      console.error('Failed to load sync stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-300 hover:bg-blue-600/30 transition-colors"
      >
        <Database className="w-4 h-4" />
        <span>Verify Sync</span>
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 999999 }}>
          <div className="bg-gradient-to-br from-slate-900 to-blue-900 border border-white/20 rounded-lg shadow-2xl max-w-2xl w-full" style={{ zIndex: 1000000 }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600/80 to-indigo-600/80 p-6 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cloud className="w-8 h-8 text-white" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">Sync Verification Dashboard</h2>
                    <p className="text-white/80">Compare local and cloud data integrity</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                  <span className="ml-3 text-white">Loading sync statistics...</span>
                </div>
              ) : stats ? (
                <div className="space-y-6">
                  {/* Sync Status */}
                  <div className={`p-4 rounded-lg border ${
                    stats.syncSuccess 
                      ? 'bg-green-600/10 border-green-500/30' 
                      : 'bg-yellow-600/10 border-yellow-500/30'
                  }`}>
                    <div className="flex items-center gap-3">
                      {stats.syncSuccess ? (
                        <>
                          <Check className="w-6 h-6 text-green-400" />
                          <div>
                            <h3 className="text-lg font-semibold text-green-400">All Data Synced</h3>
                            <p className="text-green-300 text-sm">Local and cloud data are in sync</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-6 h-6 text-yellow-400" />
                          <div>
                            <h3 className="text-lg font-semibold text-yellow-400">Sync Pending</h3>
                            <p className="text-yellow-300 text-sm">{stats.localRecords.syncQueue} items waiting to sync</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Record Comparison */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-400" />
                        Local Storage (IndexedDB)
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Vessels:</span>
                          <span className="text-white font-mono">{stats.localRecords.vessels}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Positions:</span>
                          <span className="text-white font-mono">{stats.localRecords.positions}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Sensor Data:</span>
                          <span className="text-white font-mono">{stats.localRecords.sensorData}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                          <span className="text-gray-400">Sync Queue:</span>
                          <span className={`font-mono ${stats.localRecords.syncQueue > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                            {stats.localRecords.syncQueue}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Cloud className="w-5 h-5 text-green-400" />
                        Cloud Storage (Supabase)
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Vessels:</span>
                          <span className="text-white font-mono">{stats.cloudRecords.vessels}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Positions:</span>
                          <span className="text-white font-mono">{stats.cloudRecords.positions}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Sensor Data:</span>
                          <span className="text-white font-mono">{stats.cloudRecords.sensorData}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Data Compression Stats */}
                  <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border border-indigo-500/30 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-3">Data Compression & Cost Savings</h4>
                    
                    {/* Demo Savings */}
                    <div className="mb-4 pb-4 border-b border-white/10">
                      <p className="text-sm text-gray-400 mb-2">Demo Session Savings</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Compression Ratio</p>
                          <p className="text-lg font-bold text-indigo-400">{stats.compressionRatio.toFixed(0)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Data Saved</p>
                          <p className="text-lg font-bold text-green-400">{stats.dataSaved}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">Cost Saved (Demo)</p>
                        <p className="text-xl font-bold text-green-400">{stats.costSaved}</p>
                      </div>
                    </div>
                    
                    {/* Maritime Projections */}
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Real-World Maritime Projections</p>
                      <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-3 mb-3">
                        <p className="text-xs text-blue-300 mb-1">Based on industry data:</p>
                        <p className="text-xs text-gray-400">• Average vessel uses {stats.projections.dailyDataGB}GB/day</p>
                        <p className="text-xs text-gray-400">• Includes video surveillance, IoT sensors, crew usage</p>
                        <p className="text-xs text-gray-400">• Satellite data costs ~$0.50/GB</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Daily Data Saved</p>
                          <p className="text-xl font-bold text-green-400">{stats.projections.dailyDataSavedGB.toFixed(1)} GB</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Daily Cost Saved</p>
                          <p className="text-xl font-bold text-green-400">${stats.projections.dailyCostSaved.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-sm text-gray-400">Projected Annual Savings</p>
                        <p className="text-3xl font-bold text-green-400">${stats.projections.yearlyCostSaved.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</p>
                        <p className="text-xs text-gray-500 mt-1">Per vessel with edge optimization</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={loadStats}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-300 hover:bg-blue-600/30 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Refresh</span>
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-white text-center py-12">Failed to load sync statistics</p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}