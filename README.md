# EdgeFleet: Maritime Edge Computing Platform

A comprehensive maritime operations platform demonstrating **offline-first architecture**, **real-time WebSocket communication**, and **edge computing** capabilities for fleet management. Built as a modern monorepo showcasing distributed systems, data synchronization, and maritime-specific UI/UX patterns.

## 🌊 What is EdgeFleet?

EdgeFleet simulates a real-world maritime operations environment where vessels operate in remote areas with intermittent connectivity. It demonstrates:

- **Edge Computing**: Vessels continue operating independently when offline
- **Offline-First Architecture**: Data persistence and queue management using IndexedDB
- **Real-time Communication**: WebSocket-based fleet coordination
- **Maritime Operations**: Authentic vessel monitoring with engine systems, navigation, and fleet tracking

Perfect for testing edge computing scenarios, distributed systems patterns, and maritime industry workflows.

## 🚢 Architecture Overview

```
Fleet Command Center (Port 3000)
├── Real-time vessel monitoring
├── Fleet tracking map with live positions  
├── Sync verification dashboard
└── Offline vessel detection with last-seen timestamps

Vessel Applications (Ports 3001-3003)
├── Individual bridge control systems
├── Engine monitoring with animated gauges
├── Offline data persistence (IndexedDB)
├── Automatic sync queue management
└── Maritime-themed dashboard UI

WebSocket Server (Port 3999)
├── Real-time vessel-to-fleet communication
├── Connection status broadcasting
├── Offline notification handling
└── Message routing and relay

Shared Packages
├── Dexie.js database with sync queue
├── Offline manager with localStorage persistence
├── Maritime simulation engine
└── Supabase client for cloud sync
```

## 🛠 Technology Stack

### Frontend Technologies
- **React 18** with TypeScript for type-safe UI development
- **Vite** for fast development and optimized builds
- **Tailwind CSS** with maritime-themed design system
- **Lucide React** for consistent iconography

### Data & Storage
- **Dexie.js** for IndexedDB management and offline data persistence
- **Supabase** for cloud database and real-time features
- **LocalStorage** for offline mode preferences
- **JSON** for WebSocket message protocols

### Communication & Architecture
- **WebSocket (ws)** for real-time bidirectional communication
- **Turborepo** for efficient monorepo management
- **TypeScript** throughout for type safety and developer experience
- **Node.js** for WebSocket server and tooling

### Edge Computing Features
- **Offline-first data architecture** with automatic sync queues
- **Data compression** with bandwidth usage calculations
- **Connection status management** with manual offline toggle
- **Persistent offline mode** that survives page refreshes

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **Git** for cloning the repository

### 1. Clone and Install
```bash
git clone https://github.com/ebarronh/edge-fleet.git
cd edge-fleet
npm install
```

### 2. Start the Complete Demo
```bash
./start-demo.sh
```

This launches all services simultaneously:
- **Fleet Command Center**: http://localhost:3000
- **MV Pacific Explorer**: http://localhost:3001 (cargo vessel)
- **SS Northern Star**: http://localhost:3002 (tanker vessel)
- **MV Coastal Pioneer**: http://localhost:3003 (container vessel)
- **WebSocket Server**: ws://localhost:3999

### 3. Test Edge Computing Scenarios

#### Offline Mode Testing
1. Open any vessel app (ports 3001-3003)
2. Click **"Go Offline"** to simulate connectivity loss
3. Observe data continuing to be collected and stored locally
4. Check Fleet Command to see vessel marked as offline with timestamp
5. Click **"Go Online"** to restore connectivity and sync data

#### Data Persistence Testing
1. Put a vessel offline
2. Refresh the browser page
3. Vessel remains in offline mode (persistent across sessions)
4. Data collection continues seamlessly

#### Fleet Monitoring
1. Open Fleet Command Center (port 3000)
2. View real-time vessel positions on the tracking map
3. Monitor vessel status with live engine metrics
4. Use **"Verify Sync"** to inspect local vs cloud data integrity

## 🔬 Edge Computing Demonstrations

### Offline-First Data Architecture
- **Persistent Storage**: All vessel data stored in IndexedDB using Dexie.js
- **Sync Queue Management**: Changes queued automatically when offline
- **Data Compression**: Bandwidth savings calculated and displayed
- **Conflict Resolution**: Automatic sync when connectivity restored

### Real-time Communication Patterns
- **WebSocket Heartbeats**: Connection monitoring and automatic reconnection
- **Message Broadcasting**: Fleet-wide status updates and position sharing
- **Graceful Degradation**: Seamless transition between online/offline modes
- **Status Propagation**: Immediate notification of vessel connectivity changes

### Maritime-Specific Features
- **Engine System Monitoring**: RPM, fuel rate, temperature, oil pressure
- **Navigation Display**: Speed, heading with animated compass
- **Fleet Tracking**: Multi-vessel position visualization
- **Critical Threshold Alerts**: Animated warnings for abnormal readings

## 📊 Features & Capabilities

### ✅ Phase 1 Complete Features
- **True offline-first architecture** with IndexedDB persistence
- **Animated engine gauges** with critical threshold detection
- **Real-time vessel position tracking** on fleet map
- **Sync verification dashboard** with compression metrics
- **WebSocket communication** with automatic reconnection
- **Maritime-themed UI** with authentic vessel bridge aesthetics
- **Data compression** with bandwidth and cost savings calculations
- **Offline status persistence** across browser sessions
- **Multi-vessel simulation** with different vessel types
- **Connection status indicators** with last-seen timestamps

### 🔄 Live Sync & Monitoring
- **Real-time position updates** every 5 seconds when online
- **Sensor data collection** every 2 seconds (engine metrics)
- **Automatic sync** when returning online from offline mode
- **Sync queue visualization** showing pending data items
- **Bandwidth usage tracking** with data compression metrics

### 🛡 Edge Computing Resilience
- **Network outage simulation** with manual offline toggle
- **Data integrity verification** between local and cloud storage
- **Queue management** with automatic retry mechanisms
- **Connection monitoring** with graceful degradation

## 💻 Development Guide

### Individual Service Commands
```bash
# Build all packages
npm run build

# Start WebSocket server only
cd apps/websocket-server && npm start

# Start Fleet Command only  
cd apps/fleet-command && npm run dev

# Start individual vessels
cd apps/vessel-app && npm run dev        # Port 3001
cd apps/vessel-app && npm run dev:3002   # Port 3002
cd apps/vessel-app && npm run dev:3003   # Port 3003
```

### Project Structure
```
edge-fleet/
├── apps/
│   ├── fleet-command/         # Fleet Command Center (React + Vite)
│   │   ├── src/
│   │   │   ├── App.tsx        # Main fleet dashboard
│   │   │   └── components/    # Sync verification, vessel cards
│   │   └── package.json
│   ├── vessel-app/            # Vessel Bridge System (React + Vite)
│   │   ├── src/
│   │   │   ├── App.tsx        # Vessel dashboard with engine monitoring
│   │   │   └── components/    # Animated gauges, navigation displays
│   │   └── package.json
│   └── websocket-server/      # Communication Hub (Node.js + ws)
│       ├── src/
│       │   └── server.ts      # WebSocket server with message routing
│       └── package.json
├── packages/
│   └── shared/                # Shared Libraries
│       ├── src/
│       │   ├── db.ts          # Dexie.js database with sync queue
│       │   ├── offline.ts     # Offline manager with localStorage
│       │   ├── simulation.ts  # Vessel movement simulation
│       │   └── types.ts       # TypeScript interfaces
│       └── package.json
├── specs/                     # Documentation
│   ├── phase-1.md            # Phase 1 requirements specification
│   └── initial-setup.md      # Setup instructions
├── start-demo.sh             # Complete demo launcher
├── demo-phase-1.md           # Demo guide for product managers
└── CLAUDE.md                 # Development guidelines
```

### Testing & Validation
```bash
# Run all builds (required before demo)
npm run build

# Run linting
npm run lint

# Run type checking  
npm run type-check

# Run tests
npm run test
```

## 🎯 Use Cases & Testing Scenarios

### Maritime Operations Testing
- **Fleet Coordination**: Multiple vessels operating with real-time position sharing
- **Emergency Scenarios**: Vessel goes offline, fleet command tracks last known position
- **Data Synchronization**: Large amounts of sensor data syncing efficiently when online
- **Bandwidth Optimization**: Data compression reducing transmission costs

### Edge Computing Validation
- **Offline Resilience**: Applications continue functioning without internet
- **Data Persistence**: Critical information never lost during connectivity issues
- **Automatic Recovery**: Seamless sync when connectivity restored
- **Resource Efficiency**: Minimal bandwidth usage through compression

### Distributed Systems Patterns
- **Message Broadcasting**: WebSocket communication patterns
- **State Management**: Distributed state across multiple applications
- **Conflict Resolution**: Handling data conflicts during sync
- **Connection Monitoring**: Heartbeat and reconnection strategies

## 🌐 Cloud Integration (Optional)

EdgeFleet can optionally integrate with Supabase for cloud storage and real-time features:

1. Create a Supabase project at https://supabase.com
2. Set up tables using the SQL schema in `specs/initial-setup.md`
3. Configure environment variables in `.env` files
4. Enable real-time subscriptions for live fleet coordination

*Note: The demo works fully offline without any cloud configuration required.*

## 🔧 Troubleshooting

### Common Issues
- **Port conflicts**: Ensure ports 3000-3003 and 3999 are available
- **WebSocket connection**: Check that the WebSocket server (port 3999) is running
- **Build errors**: Run `npm run build` before starting development servers
- **Browser storage**: Clear IndexedDB if experiencing data sync issues

### Reset Demo State
```bash
# Clear all local data and restart
./start-demo.sh --clean
```

## 🚀 Future Roadmap

### Phase 2: Advanced Edge Computing
- **Mesh networking** between vessels
- **Distributed consensus** for fleet coordination
- **Edge AI** for predictive maintenance
- **Satellite communication** simulation

### Phase 3: Enterprise Features
- **Multi-fleet management** 
- **Advanced analytics** and reporting
- **Integration APIs** for third-party systems
- **Enhanced security** and authentication

---

**EdgeFleet** - Demonstrating the future of maritime edge computing with modern web technologies.