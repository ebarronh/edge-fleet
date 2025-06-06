// Database
export { EdgeFleetDB, db } from './db';

// Types
export type {
  Vessel,
  Position,
  SensorData,
  SyncItem,
  VesselRoute
} from './types';

// Offline management
export {
  OfflineManager,
  offlineManager,
  type ConnectionStatus,
  type SyncStats
} from './offline';

// Simulation
export {
  VesselSimulator,
  vesselSimulator,
  SHIPPING_ROUTES
} from './simulation';

// Components
export {
  ConnectionIndicator,
  VesselCard,
  SyncStatus,
  OfflineToggle,
  MaritimeGauge
} from './components';