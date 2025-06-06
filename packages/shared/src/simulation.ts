import { Position, SensorData, VesselRoute } from './types';
import { db } from './db';

// West Coast shipping routes
export const SHIPPING_ROUTES: Record<string, VesselRoute> = {
  'vessel-3001': {
    vesselId: 'vessel-3001',
    name: 'San Francisco to Seattle',
    waypoints: [
      { latitude: 37.7749, longitude: -122.4194, name: 'San Francisco' },
      { latitude: 38.5816, longitude: -123.0351, name: 'Bodega Bay' },
      { latitude: 40.8021, longitude: -124.1637, name: 'Eureka' },
      { latitude: 42.3265, longitude: -124.2179, name: 'Brookings' },
      { latitude: 44.6394, longitude: -124.0537, name: 'Newport' },
      { latitude: 46.9741, longitude: -124.1063, name: 'Westport' },
      { latitude: 47.6062, longitude: -122.3321, name: 'Seattle' }
    ],
    currentWaypointIndex: 0,
    speed: 12.5,
    heading: 45.0
  },
  'vessel-3002': {
    vesselId: 'vessel-3002',
    name: 'Seattle to Vancouver',
    waypoints: [
      { latitude: 47.6062, longitude: -122.3321, name: 'Seattle' },
      { latitude: 48.1173, longitude: -122.7632, name: 'Port Angeles' },
      { latitude: 48.7519, longitude: -123.1139, name: 'Sidney' },
      { latitude: 49.2827, longitude: -123.1207, name: 'Vancouver' }
    ],
    currentWaypointIndex: 0,
    speed: 15.2,
    heading: 315.0
  },
  'vessel-3003': {
    vesselId: 'vessel-3003',
    name: 'Vancouver to Long Beach',
    waypoints: [
      { latitude: 49.2827, longitude: -123.1207, name: 'Vancouver' },
      { latitude: 47.6062, longitude: -122.3321, name: 'Seattle' },
      { latitude: 45.5152, longitude: -122.6784, name: 'Portland' },
      { latitude: 37.7749, longitude: -122.4194, name: 'San Francisco' },
      { latitude: 34.0522, longitude: -118.2437, name: 'Los Angeles' },
      { latitude: 33.7701, longitude: -118.1937, name: 'Long Beach' }
    ],
    currentWaypointIndex: 0,
    speed: 18.1,
    heading: 180.0
  }
};

export class VesselSimulator {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    
    // Update positions every 5 seconds
    this.intervalId = setInterval(() => {
      this.updateAllVessels();
    }, 5000);

    console.log('Vessel simulation started');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Vessel simulation stopped');
  }

  private async updateAllVessels() {
    for (const route of Object.values(SHIPPING_ROUTES)) {
      await this.updateVesselPosition(route);
      await this.updateVesselSensors(route.vesselId);
    }
  }

  private async updateVesselPosition(route: VesselRoute) {
    const current = route.waypoints[route.currentWaypointIndex];
    const next = route.waypoints[(route.currentWaypointIndex + 1) % route.waypoints.length];

    // Calculate movement towards next waypoint
    const progress = Math.random() * 0.1; // Random progress between 0-10%
    const newLat = current.latitude + (next.latitude - current.latitude) * progress;
    const newLng = current.longitude + (next.longitude - current.longitude) * progress;

    // Add some random variation to make it more realistic
    const variation = 0.001;
    const finalLat = newLat + (Math.random() - 0.5) * variation;
    const finalLng = newLng + (Math.random() - 0.5) * variation;

    // Calculate heading towards next waypoint
    const heading = this.calculateHeading(current.latitude, current.longitude, next.latitude, next.longitude);
    
    // Add slight speed variation
    const speedVariation = route.speed * 0.1; // ±10% speed variation
    const currentSpeed = route.speed + (Math.random() - 0.5) * speedVariation;

    const position: Omit<Position, 'id' | 'vesselId' | 'createdAt'> = {
      latitude: finalLat,
      longitude: finalLng,
      heading: heading + (Math.random() - 0.5) * 10, // ±5 degree heading variation
      speed: Math.max(0, currentSpeed),
      timestamp: new Date()
    };

    await db.updateVesselPosition(route.vesselId, position);

    // Check if close to next waypoint (within ~1km)
    const distance = this.calculateDistance(newLat, newLng, next.latitude, next.longitude);
    if (distance < 0.01) { // Approximately 1km
      route.currentWaypointIndex = (route.currentWaypointIndex + 1) % route.waypoints.length;
      console.log(`${route.vesselId} reached waypoint: ${next.name}`);
    }
  }

  private async updateVesselSensors(vesselId: string) {
    const route = SHIPPING_ROUTES[vesselId];
    if (!route) return;

    const timestamp = new Date();

    // Engine RPM (varies with speed)
    const baseRPM = 800 + (route.speed * 30);
    const engineRPM = baseRPM + (Math.random() - 0.5) * 100;

    // Fuel consumption (varies with speed and engine load)
    const baseFuelRate = 5 + (route.speed * 0.8);
    const fuelConsumption = baseFuelRate + (Math.random() - 0.5) * 2;

    // Engine temperature
    const engineTemp = 85 + (Math.random() - 0.5) * 10;

    // Oil pressure
    const oilPressure = 45 + (Math.random() - 0.5) * 5;

    const sensorData: Array<Omit<SensorData, 'id' | 'vesselId' | 'createdAt'>> = [
      {
        type: 'engine_rpm',
        value: engineRPM,
        unit: 'rpm',
        timestamp
      },
      {
        type: 'fuel_consumption',
        value: fuelConsumption,
        unit: 'L/h',
        timestamp
      },
      {
        type: 'speed',
        value: route.speed,
        unit: 'knots',
        timestamp
      },
      {
        type: 'heading',
        value: route.heading,
        unit: 'degrees',
        timestamp
      },
      {
        type: 'temperature',
        value: engineTemp,
        unit: '°C',
        timestamp
      },
      {
        type: 'pressure',
        value: oilPressure,
        unit: 'psi',
        timestamp
      }
    ];

    for (const data of sensorData) {
      await db.addSensorData(vesselId, data);
    }
  }

  private calculateHeading(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;

    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

    let heading = Math.atan2(y, x) * 180 / Math.PI;
    return (heading + 360) % 360;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Get current route information for a vessel
  getVesselRoute(vesselId: string): VesselRoute | undefined {
    return SHIPPING_ROUTES[vesselId];
  }

  // Get next waypoint for a vessel
  getNextWaypoint(vesselId: string) {
    const route = SHIPPING_ROUTES[vesselId];
    if (!route) return null;

    const nextIndex = (route.currentWaypointIndex + 1) % route.waypoints.length;
    return route.waypoints[nextIndex];
  }
}

// Create singleton instance
export const vesselSimulator = new VesselSimulator();