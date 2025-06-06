import { db } from './db';
import { SyncItem } from './types';

export type ConnectionStatus = 'online' | 'offline' | 'syncing';

export interface SyncStats {
  pendingItems: number;
  totalDataSize: string;
  compressedSize: string;
  bandwidthSaved: string;
  costSaved: string;
}

export class OfflineManager {
  private _isOnline: boolean = true;
  private _status: ConnectionStatus = 'online';
  private listeners: Array<(status: ConnectionStatus) => void> = [];
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Check if manually set to offline mode
    if (typeof window !== 'undefined') {
      const isManuallyOffline = localStorage.getItem('edgefleet-offline-mode') === 'true';
      if (isManuallyOffline) {
        this._isOnline = false;
        this._status = 'offline';
      }
      
      // Listen for actual network changes
      window.addEventListener('online', () => {
        if (!this.isManuallyOffline) {
          this.setOnline();
        }
      });
      
      window.addEventListener('offline', () => {
        this.setOffline();
      });
    }

    // Start sync interval when online
    if (this._status !== 'offline') {
      this.startSyncInterval();
    }
  }

  get isOnline(): boolean {
    return this._isOnline && this._status !== 'offline';
  }

  get status(): ConnectionStatus {
    return this._status;
  }

  get isManuallyOffline(): boolean {
    return localStorage.getItem('edgefleet-offline-mode') === 'true';
  }

  setOnline() {
    this._isOnline = true;
    this._status = 'online';
    localStorage.setItem('edgefleet-offline-mode', 'false');
    this.notifyListeners();
    this.startSyncInterval();
    // Trigger immediate sync
    this.syncToCloud();
  }

  setOffline() {
    this._isOnline = false;
    this._status = 'offline';
    localStorage.setItem('edgefleet-offline-mode', 'true');
    this.notifyListeners();
    this.stopSyncInterval();
  }

  toggleOffline() {
    if (this.isOnline) {
      this.setOffline();
    } else {
      this.setOnline();
    }
  }

  addListener(callback: (status: ConnectionStatus) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this._status));
  }

  private startSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.syncToCloud();
      }
    }, 30000);
  }

  private stopSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncToCloud(): Promise<void> {
    if (!this.isOnline) {
      return;
    }

    this._status = 'syncing';
    this.notifyListeners();

    try {
      const pendingItems = await db.getPendingSyncItems();
      
      if (pendingItems.length === 0) {
        this._status = 'online';
        this.notifyListeners();
        return;
      }

      console.log(`Syncing ${pendingItems.length} items to cloud...`);

      // Group items by type for batch processing
      const groupedItems = this.groupSyncItems(pendingItems);

      for (const [type, items] of Object.entries(groupedItems)) {
        await this.syncItemGroup(type, items);
      }

      // Clean up completed items
      await db.clearCompletedSyncItems();

      console.log('Sync completed successfully');
      this._status = 'online';
      this.notifyListeners();

    } catch (error) {
      console.error('Sync failed:', error);
      this._status = 'online'; // Return to online but with failed items still pending
      this.notifyListeners();
    }
  }

  private groupSyncItems(items: SyncItem[]): Record<string, SyncItem[]> {
    return items.reduce((groups, item) => {
      if (!groups[item.type]) {
        groups[item.type] = [];
      }
      groups[item.type].push(item);
      return groups;
    }, {} as Record<string, SyncItem[]>);
  }

  private async syncItemGroup(type: string, items: SyncItem[]): Promise<void> {
    // This would integrate with your Supabase client
    // For now, we'll simulate the sync
    console.log(`Syncing ${items.length} ${type} items...`);

    for (const item of items) {
      try {
        // Mark as syncing
        if (item.id) {
          await db.syncQueue.update(item.id, { status: 'syncing' });
        }

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // Mark as completed
        if (item.id) {
          await db.markSyncItemCompleted(item.id);
        }

      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        if (item.id) {
          await db.markSyncItemFailed(item.id, error instanceof Error ? error.message : 'Unknown error');
        }
      }
    }
  }

  async getSyncStats(): Promise<SyncStats> {
    const pendingItems = await db.getSyncQueueSize();
    
    // Simulate data size calculations
    const avgItemSize = 0.5; // KB per item
    const totalSize = pendingItems * avgItemSize;
    const compressionRatio = 0.75;
    const compressedSize = totalSize * compressionRatio;
    const bandwidthSaved = totalSize - compressedSize;
    
    // Simulate cost calculation ($0.09 per GB)
    const costPerKB = 0.00009;
    const costSaved = bandwidthSaved * costPerKB;

    return {
      pendingItems,
      totalDataSize: `${totalSize.toFixed(1)}KB`,
      compressedSize: `${compressedSize.toFixed(1)}KB`,
      bandwidthSaved: `${bandwidthSaved.toFixed(1)}KB`,
      costSaved: `$${costSaved.toFixed(2)}`
    };
  }
}

// Create singleton instance
export const offlineManager = new OfflineManager();