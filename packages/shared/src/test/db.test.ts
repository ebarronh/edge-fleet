import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EdgeFleetDB, db } from '../db';
import type { Vessel, Position, SensorData } from '../types';

describe('EdgeFleetDB', () => {
  let testDb: EdgeFleetDB;

  beforeEach(async () => {
    testDb = new EdgeFleetDB();
    await testDb.open();
    await testDb.transaction('rw', testDb.vessels, testDb.positions, testDb.sensorData, testDb.syncQueue, async () => {
      await testDb.vessels.clear();
      await testDb.positions.clear();
      await testDb.sensorData.clear();
      await testDb.syncQueue.clear();
    });
  });

  afterEach(async () => {
    if (testDb.isOpen()) {
      await testDb.close();
    }
  });

  describe('Vessel Operations', () => {
    it('should add and retrieve vessels', async () => {
      const vessel: Vessel = {
        id: 'test-vessel-1',
        name: 'Test Vessel',
        type: 'cargo',
        status: 'active',
        lastSeen: new Date()
      };

      await testDb.vessels.add(vessel);
      const retrieved = await testDb.vessels.get('test-vessel-1');
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test Vessel');
      expect(retrieved?.type).toBe('cargo');
    });

    it('should update vessel last seen on position update', async () => {
      const vessel: Vessel = {
        id: 'test-vessel-2',
        name: 'Test Vessel 2',
        type: 'tanker',
        status: 'active',
        lastSeen: new Date('2023-01-01')
      };

      await testDb.vessels.add(vessel);

      const position: Omit<Position, 'id' | 'vesselId' | 'createdAt'> = {
        latitude: 37.7749,
        longitude: -122.4194,
        heading: 45,
        speed: 12.5,
        timestamp: new Date()
      };

      await testDb.updateVesselPosition('test-vessel-2', position);

      const updatedVessel = await testDb.vessels.get('test-vessel-2');
      expect(updatedVessel?.status).toBe('active');
      expect(updatedVessel?.lastSeen.getTime()).toBeGreaterThan(vessel.lastSeen.getTime());
    });
  });

  describe('Position Operations', () => {
    it('should add position data and create sync queue item', async () => {
      const vessel: Vessel = {
        id: 'test-vessel-3',
        name: 'Test Vessel 3',
        type: 'container',
        status: 'active',
        lastSeen: new Date()
      };

      await testDb.vessels.add(vessel);

      const position: Omit<Position, 'id' | 'vesselId' | 'createdAt'> = {
        latitude: 40.7128,
        longitude: -74.0060,
        heading: 90,
        speed: 8.2,
        timestamp: new Date()
      };

      await testDb.updateVesselPosition('test-vessel-3', position);

      const positions = await testDb.getVesselPositions('test-vessel-3');
      expect(positions).toHaveLength(1);
      expect(positions[0].latitude).toBe(40.7128);

      const syncItems = await testDb.getPendingSyncItems();
      expect(syncItems.length).toBeGreaterThan(0);
      expect(syncItems[0].type).toBe('position');
    });

    it('should retrieve latest position for vessel', async () => {
      const vessel: Vessel = {
        id: 'test-vessel-4',
        name: 'Test Vessel 4',
        type: 'cargo',
        status: 'active',
        lastSeen: new Date()
      };

      await testDb.vessels.add(vessel);

      // Add multiple positions
      const positions = [
        { latitude: 30.0, longitude: -90.0, heading: 0, speed: 10, timestamp: new Date('2023-01-01') },
        { latitude: 31.0, longitude: -91.0, heading: 45, speed: 12, timestamp: new Date('2023-01-02') },
        { latitude: 32.0, longitude: -92.0, heading: 90, speed: 15, timestamp: new Date('2023-01-03') }
      ];

      for (const pos of positions) {
        await testDb.updateVesselPosition('test-vessel-4', pos);
      }

      const latest = await testDb.getVesselLatestPosition('test-vessel-4');
      expect(latest).toBeDefined();
      expect(latest?.latitude).toBe(32.0);
      expect(latest?.speed).toBe(15);
    });
  });

  describe('Sensor Data Operations', () => {
    it('should add and retrieve sensor data', async () => {
      const sensorData: Omit<SensorData, 'id' | 'vesselId' | 'createdAt'> = {
        type: 'engine_rpm',
        value: 1200,
        unit: 'rpm',
        timestamp: new Date()
      };

      await testDb.addSensorData('test-vessel-5', sensorData);

      const retrieved = await testDb.getVesselSensorData('test-vessel-5', 'engine_rpm');
      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].value).toBe(1200);
      expect(retrieved[0].unit).toBe('rpm');
    });

    it('should filter sensor data by type', async () => {
      const sensorDataItems = [
        { type: 'engine_rpm' as const, value: 1200, unit: 'rpm', timestamp: new Date() },
        { type: 'fuel_consumption' as const, value: 5.5, unit: 'L/h', timestamp: new Date() },
        { type: 'engine_rpm' as const, value: 1300, unit: 'rpm', timestamp: new Date() }
      ];

      for (const data of sensorDataItems) {
        await testDb.addSensorData('test-vessel-6', data);
      }

      const rpmData = await testDb.getVesselSensorData('test-vessel-6', 'engine_rpm');
      const fuelData = await testDb.getVesselSensorData('test-vessel-6', 'fuel_consumption');

      expect(rpmData).toHaveLength(2);
      expect(fuelData).toHaveLength(1);
      expect(fuelData[0].value).toBe(5.5);
    });
  });

  describe('Sync Queue Operations', () => {
    it('should track sync queue size', async () => {
      const initialSize = await testDb.getSyncQueueSize();
      
      await testDb.addToSyncQueue('position', 'positions', 'INSERT', { test: 'data' });
      await testDb.addToSyncQueue('sensor_data', 'sensor_data', 'INSERT', { test: 'data2' });

      const newSize = await testDb.getSyncQueueSize();
      expect(newSize).toBe(initialSize + 2);
    });

    it('should mark sync items as completed', async () => {
      await testDb.addToSyncQueue('position', 'positions', 'INSERT', { test: 'data' });
      
      const pendingItems = await testDb.getPendingSyncItems();
      expect(pendingItems).toHaveLength(1);
      
      const itemId = pendingItems[0].id!;
      await testDb.markSyncItemCompleted(itemId);

      const item = await testDb.syncQueue.get(itemId);
      expect(item?.status).toBe('completed');
      expect(item?.syncedAt).toBeDefined();
    });

    it('should mark sync items as failed with error message', async () => {
      await testDb.addToSyncQueue('sensor_data', 'sensor_data', 'INSERT', { test: 'data' });
      
      const pendingItems = await testDb.getPendingSyncItems();
      const itemId = pendingItems[0].id!;
      
      await testDb.markSyncItemFailed(itemId, 'Network error');

      const item = await testDb.syncQueue.get(itemId);
      expect(item?.status).toBe('failed');
      expect(item?.errorMessage).toBe('Network error');
      expect(item?.retryCount).toBe(1);
    });

    it('should clear completed sync items', async () => {
      // Add some items
      await testDb.addToSyncQueue('position', 'positions', 'INSERT', { test: 'data1' });
      await testDb.addToSyncQueue('position', 'positions', 'INSERT', { test: 'data2' });
      
      const items = await testDb.getPendingSyncItems();
      
      // Mark first as completed
      await testDb.markSyncItemCompleted(items[0].id!);
      
      // Clear completed items
      await testDb.clearCompletedSyncItems();
      
      const remainingItems = await testDb.syncQueue.toArray();
      expect(remainingItems).toHaveLength(1);
      expect(remainingItems[0].status).toBe('pending');
    });
  });
});