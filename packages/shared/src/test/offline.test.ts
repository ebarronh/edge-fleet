import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OfflineManager } from '../offline';

describe('OfflineManager', () => {
  let offlineManager: OfflineManager;
  let mockLocalStorage: Record<string, string>;

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      })
    });

    // Mock window events
    vi.stubGlobal('window', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });

    offlineManager = new OfflineManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Connection Status', () => {
    it('should start online by default', () => {
      expect(offlineManager.isOnline).toBe(true);
      expect(offlineManager.status).toBe('online');
    });

    it('should toggle offline mode', () => {
      offlineManager.setOffline();
      
      expect(offlineManager.isOnline).toBe(false);
      expect(offlineManager.status).toBe('offline');
      expect(mockLocalStorage['edgefleet-offline-mode']).toBe('true');
    });

    it('should toggle back online', () => {
      offlineManager.setOffline();
      offlineManager.setOnline();
      
      expect(offlineManager.isOnline).toBe(true);
      expect(offlineManager.status).toBe('online');
      expect(mockLocalStorage['edgefleet-offline-mode']).toBe('false');
    });

    it('should toggle between online and offline', () => {
      expect(offlineManager.isOnline).toBe(true);
      
      offlineManager.toggleOffline();
      expect(offlineManager.isOnline).toBe(false);
      
      offlineManager.toggleOffline();
      expect(offlineManager.isOnline).toBe(true);
    });
  });

  describe('Status Listeners', () => {
    it('should notify listeners on status change', () => {
      const listener = vi.fn();
      const unsubscribe = offlineManager.addListener(listener);
      
      offlineManager.setOffline();
      expect(listener).toHaveBeenCalledWith('offline');
      
      offlineManager.setOnline();
      expect(listener).toHaveBeenCalledWith('online');
      
      unsubscribe();
    });

    it('should remove listeners correctly', () => {
      const listener = vi.fn();
      const unsubscribe = offlineManager.addListener(listener);
      
      unsubscribe();
      offlineManager.setOffline();
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      offlineManager.addListener(listener1);
      offlineManager.addListener(listener2);
      
      offlineManager.setOffline();
      
      expect(listener1).toHaveBeenCalledWith('offline');
      expect(listener2).toHaveBeenCalledWith('offline');
    });
  });

  describe('Manual Offline Mode', () => {
    it('should detect manual offline mode from localStorage', () => {
      mockLocalStorage['edgefleet-offline-mode'] = 'true';
      
      expect(offlineManager.isManuallyOffline).toBe(true);
    });

    it('should respect manual offline mode even when network is online', () => {
      mockLocalStorage['edgefleet-offline-mode'] = 'true';
      offlineManager = new OfflineManager();
      
      // Even though we haven't called setOffline, it should read from localStorage
      expect(offlineManager.isManuallyOffline).toBe(true);
    });
  });

  describe('Sync Stats', () => {
    it('should calculate sync stats', async () => {
      const stats = await offlineManager.getSyncStats();
      
      expect(stats).toHaveProperty('pendingItems');
      expect(stats).toHaveProperty('totalDataSize');
      expect(stats).toHaveProperty('compressedSize');
      expect(stats).toHaveProperty('bandwidthSaved');
      expect(stats).toHaveProperty('costSaved');
      
      expect(typeof stats.pendingItems).toBe('number');
      expect(typeof stats.totalDataSize).toBe('string');
      expect(stats.costSaved).toMatch(/^\$\d+\.\d{2}$/);
    });

    it('should show zero pending items when no sync queue', async () => {
      const stats = await offlineManager.getSyncStats();
      expect(stats.pendingItems).toBe(0);
    });
  });

  describe('Sync Process', () => {
    it('should not sync when offline', async () => {
      offlineManager.setOffline();
      
      // Mock console.log to capture sync messages
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await offlineManager.syncToCloud();
      
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('Syncing'));
      
      consoleSpy.mockRestore();
    });

    it('should change status to syncing during sync', async () => {
      const listener = vi.fn();
      offlineManager.addListener(listener);
      
      // Mock a sync that takes some time
      const originalSyncToCloud = offlineManager.syncToCloud;
      offlineManager.syncToCloud = vi.fn().mockImplementation(async () => {
        // Simulate async work
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      
      const syncPromise = offlineManager.syncToCloud();
      
      // Status should change to syncing, then back to online
      expect(listener).toHaveBeenCalledWith('syncing');
      
      await syncPromise;
      
      // Restore original method
      offlineManager.syncToCloud = originalSyncToCloud;
    });
  });
});