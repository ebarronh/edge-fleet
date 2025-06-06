import Dexie, { Table } from 'dexie';
import { Vessel, Position, SensorData, SyncItem } from './types';

export class EdgeFleetDB extends Dexie {
  vessels!: Table<Vessel>;
  positions!: Table<Position>;
  sensorData!: Table<SensorData>;
  syncQueue!: Table<SyncItem>;

  constructor() {
    super('EdgeFleetDB');
    
    this.version(1).stores({
      vessels: 'id, status, lastSeen, type',
      positions: '++id, vesselId, timestamp, latitude, longitude',
      sensorData: '++id, vesselId, type, timestamp',
      syncQueue: '++id, type, status, priority, timestamp'
    });

    // Add hooks for auto-sync
    this.vessels.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.vessels.hook('updating', (modifications, primKey, obj, trans) => {
      (modifications as any).updatedAt = new Date();
    });

    this.positions.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      this.addToSyncQueue('position', 'positions', 'INSERT', obj);
    });

    this.sensorData.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      this.addToSyncQueue('sensor_data', 'sensor_data', 'INSERT', obj);
    });
  }

  async addToSyncQueue(type: SyncItem['type'], tableName: string, operation: SyncItem['operation'], data: any, priority: number = 1) {
    try {
      await this.syncQueue.add({
        type,
        tableName,
        operation,
        data,
        status: 'pending',
        priority,
        retryCount: 0,
        timestamp: new Date()
      });
    } catch (error) {
      console.warn('Failed to add item to sync queue:', error);
    }
  }

  async getPendingSyncItems(): Promise<SyncItem[]> {
    return await this.syncQueue
      .where('status')
      .equals('pending')
      .reverse()
      .sortBy('priority');
  }

  async markSyncItemCompleted(id: number) {
    await this.syncQueue.update(id, {
      status: 'completed',
      syncedAt: new Date()
    });
  }

  async markSyncItemFailed(id: number, errorMessage: string) {
    const item = await this.syncQueue.get(id);
    if (item) {
      await this.syncQueue.update(id, {
        status: 'failed',
        retryCount: item.retryCount + 1,
        errorMessage
      });
    }
  }

  async getSyncQueueSize(): Promise<number> {
    return await this.syncQueue.where('status').equals('pending').count();
  }

  async clearCompletedSyncItems() {
    await this.syncQueue.where('status').equals('completed').delete();
  }

  // Vessel-specific methods
  async updateVesselPosition(vesselId: string, position: Omit<Position, 'id' | 'vesselId' | 'createdAt'>) {
    const positionData = {
      ...position,
      vesselId,
      timestamp: position.timestamp || new Date()
    };
    
    await this.positions.add(positionData);
    
    // Update vessel last seen
    await this.vessels.update(vesselId, {
      lastSeen: new Date(),
      status: 'active'
    });
  }

  async addSensorData(vesselId: string, sensorData: Omit<SensorData, 'id' | 'vesselId' | 'createdAt'>) {
    const data = {
      ...sensorData,
      vesselId,
      timestamp: sensorData.timestamp || new Date()
    };
    
    await this.sensorData.add(data);
  }

  async getVesselLatestPosition(vesselId: string): Promise<Position | undefined> {
    const positions = await this.positions
      .where('vesselId')
      .equals(vesselId)
      .reverse()
      .sortBy('timestamp');
    return positions[0];
  }

  async getVesselPositions(vesselId: string, limit: number = 100): Promise<Position[]> {
    const positions = await this.positions
      .where('vesselId')
      .equals(vesselId)
      .reverse()
      .sortBy('timestamp');
    return positions.slice(0, limit);
  }

  async getVesselSensorData(vesselId: string, type?: SensorData['type'], limit: number = 100): Promise<SensorData[]> {
    let collection = this.sensorData.where('vesselId').equals(vesselId);
    
    if (type) {
      collection = collection.and(item => item.type === type);
    }
    
    const data = await collection.reverse().sortBy('timestamp');
    return data.slice(0, limit);
  }
}

// Create singleton instance
export const db = new EdgeFleetDB();

// Initialize with test vessels if empty
db.open().then(async () => {
  const vesselCount = await db.vessels.count();
  if (vesselCount === 0) {
    console.log('Initializing EdgeFleet database with test vessels...');
    
    const testVessels: Vessel[] = [
      {
        id: 'vessel-3001',
        name: 'MV Pacific Explorer',
        type: 'cargo',
        status: 'active',
        lastSeen: new Date()
      },
      {
        id: 'vessel-3002',
        name: 'SS Northern Star',
        type: 'tanker',
        status: 'active',
        lastSeen: new Date()
      },
      {
        id: 'vessel-3003',
        name: 'MV Coastal Pioneer',
        type: 'container',
        status: 'active',
        lastSeen: new Date()
      }
    ];

    await db.vessels.bulkAdd(testVessels);
    console.log('Test vessels added to local database');
  }
}).catch(err => {
  console.error('Failed to initialize database:', err);
});