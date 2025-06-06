export interface Vessel {
  id: string;
  name: string;
  type: 'cargo' | 'tanker' | 'container';
  status: 'active' | 'offline' | 'maintenance';
  lastSeen: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Position {
  id?: number;
  vesselId: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  timestamp: Date;
  createdAt?: Date;
}

export interface SensorData {
  id?: number;
  vesselId: string;
  type: 'engine_rpm' | 'fuel_consumption' | 'speed' | 'heading' | 'temperature' | 'pressure';
  value: number;
  unit: string;
  timestamp: Date;
  createdAt?: Date;
}

export interface SyncItem {
  id?: number;
  type: 'position' | 'sensor_data' | 'vessel_update';
  tableName: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  priority: number;
  retryCount: number;
  errorMessage?: string;
  timestamp: Date;
  syncedAt?: Date;
}

export interface VesselRoute {
  vesselId: string;
  name: string;
  waypoints: Array<{
    latitude: number;
    longitude: number;
    name?: string;
  }>;
  currentWaypointIndex: number;
  speed: number;
  heading: number;
}