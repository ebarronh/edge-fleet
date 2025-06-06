# EdgeFleet Phase 1: Offline-First Maritime Operations Platform

## Prompt for Claude Code

Build Phase 1 of EdgeFleet focusing on offline-first operations with data synchronization. The foundation (Phase 0) is already in place with basic connectivity between fleet-command, vessel-app, and websocket-server.

### Core Requirements

1. **Maritime Design System**
   - Create a comprehensive maritime-themed design system using Tailwind CSS
   - Include nautical colors, ship-appropriate fonts, and maritime UI patterns
   - Build reusable components: ConnectionIndicator, VesselCard, SyncStatus, OfflineToggle
   - Add subtle animations for state changes

2. **Offline-First Architecture with Dexie.js**
   - Implement Dexie.js in packages/shared for IndexedDB management
   - Create schemas for vessels, positions, sensor_data, and sync_queue
   - All operations write to Dexie first, then sync to Supabase when online
   - Implement intelligent sync with conflict resolution (last-write-wins)

3. **Vessel Simulation**
   - Generate realistic vessel movement along predefined shipping routes
   - Simulate sensor data: engine RPM, fuel consumption, speed, heading
   - Position updates every 5 seconds with slight variations
   - Create at least 3 different vessel behavior patterns

4. **Offline Mode Implementation**
   - Prominent offline toggle button in header of each app
   - When offline: red indicator, "OFFLINE MODE" banner, queue size display
   - Vessels continue all operations using Dexie.js
   - Position updates, sensor data, and events queue locally
   - WebSocket messages queue for later delivery

5. **Sync Visualization**
   - Show sync queue size in real-time
   - Animated sync process when going online
   - Display data reduction metrics (e.g., "1.2MB processed → 23KB synced")
   - Success notifications for completed syncs
   - Visual diff showing what changed during offline period

6. **Fleet Command Enhancements**
   - Real-time map showing vessel positions (use react-leaflet)
   - Vessel list with status indicators
   - Offline vessels shown with different styling
   - Last seen timestamp for offline vessels
   - Total fleet metrics dashboard

7. **Vessel App Enhancements**
   - Bridge dashboard with speed, heading, position
   - Engine metrics with animated gauges
   - Fuel consumption tracking
   - Event log showing local operations
   - Sync status indicator

### Technical Implementation Details

**Dexie.js Schema:**
```typescript
// packages/shared/src/db.ts
class EdgeFleetDB extends Dexie {
  vessels!: Table<Vessel>;
  positions!: Table<Position>;
  sensorData!: Table<SensorData>;
  syncQueue!: Table<SyncItem>;
  
  constructor() {
    super('EdgeFleetDB');
    this.version(1).stores({
      vessels: 'id, status, lastSeen',
      positions: '++id, vesselId, timestamp',
      sensorData: '++id, vesselId, type, timestamp',
      syncQueue: '++id, type, status, priority, timestamp'
    });
  }
}
```

**Sync Strategy:**
- Every operation creates a sync queue item
- Background sync runs every 30 seconds when online
- Batch sync to reduce API calls
- Show visual progress during sync
- Handle partial sync failures gracefully

**Sync Verification Component:**
```typescript
// apps/fleet-command/src/components/SyncVerification.tsx
interface SyncVerificationProps {
  vesselId: string;
  showAutomatically: boolean;
}

// Component should:
// 1. Query Dexie for local record count
// 2. Query Supabase for cloud record count
// 3. Calculate and display data compression
// 4. Show sync status with visual indicators
// 5. Display cost savings based on bandwidth
```

**Offline Toggle Behavior:**
- Clicking toggle simulates network disconnection
- Disable Supabase client when offline
- Queue all Supabase operations
- Continue WebSocket locally (vessel-to-vessel)
- Show clear visual feedback

### Testing Requirements (MUST COMPLETE)

**Unit Tests (Vitest):**
1. Dexie.js operations (CRUD, queue management)
2. Sync logic (conflict resolution, batching)
3. Offline detection and state management
4. Component rendering with offline/online states
5. Maritime design system components

**E2E Tests (Puppeteer via MCP):**
1. Complete offline flow:
   - Start online, verify sync
   - Toggle offline, continue operations
   - Generate data while offline
   - Toggle online, verify sync completion
   
2. Multi-vessel coordination:
   - Verify vessels appear in fleet command
   - Test position updates
   - Check offline vessel indication

3. Data integrity:
   - Verify no data loss during offline
   - Check sync accuracy
   - Validate Supabase matches Dexie

### Deliverables

1. **Working Offline Mode**
   - Toggle button with clear visual states
   - Full app functionality while offline
   - Automatic sync when returning online

2. **Maritime UI Theme**
   - Professional nautical design
   - Consistent across all apps
   - Responsive and accessible

3. **Impressive Demo Scenario**
   - Show vessel operating normally
   - Disconnect (toggle offline)
   - Continue operations for 2 minutes
   - Accumulate position updates, sensor data
   - Reconnect and watch sync animation
   - Show bandwidth savings

4. **Complete Test Suite**
   - All unit tests passing
   - E2E tests documented and running
   - Test coverage report

5. **Sync Verification Dashboard**
   - Live query comparison between Dexie and Supabase
   - Visual proof that data synced correctly
   - Metrics showing data compression and cost savings
   - Can be triggered via button or shown automatically after sync

### Implementation Order

1. Set up Dexie.js and schemas
2. Create maritime design system
3. Build offline toggle and indicators
4. Implement vessel simulation
5. Add sync queue and visualization
6. Enhance UIs with maritime theme
7. Build sync verification dashboard
8. Write comprehensive tests
9. Create demo script with MCP verification

### Success Criteria

- [ ] Offline toggle works seamlessly
- [ ] No data loss during offline periods
- [ ] Sync visualization is clear and impressive
- [ ] Maritime theme looks professional
- [ ] All tests pass (unit and E2E)
- [ ] Demo can run for 5 minutes showing offline/online transitions
- [ ] Bandwidth savings are clearly displayed
- [ ] Supabase MCP verification confirms all data synced correctly
- [ ] Sync verification dashboard shows matching records between local and cloud

### Additional Notes

- Use Supabase MCP to create test data and verify syncs
- Follow CLAUDE.md testing guidelines strictly
- Keep commits logical but don't push until review
- Focus on visual feedback for all state changes
- Maritime theme should include naval terminology where appropriate

### Example Demo Flow

1. Fleet Command shows 3 vessels operating normally
2. Click offline toggle on one vessel
3. Vessel shows "OFFLINE MODE" banner, continues operating
4. Generate 50+ position updates while offline
5. Fleet Command shows vessel as offline with last known position
6. Toggle back online
7. Watch sync animation: "Syncing 52 items..."
8. Show success: "1.3MB processed → 26KB synced to cloud"
9. Fleet Command updates with all missed positions

### Final Verification with Supabase MCP

At the end of Phase 1, use Supabase MCP to verify the sync:

```typescript
// Commands to run via Supabase MCP:
"Show me the last 10 positions for vessel-3001 from Supabase"
"Count total sync_logs entries created in the last 5 minutes"
"Display the data size difference between local storage and cloud storage"
"Generate a report showing all vessels' sync status"
```

Create a verification dashboard component that:
1. Queries Supabase directly (not through the app)
2. Shows total records synced
3. Displays data compression ratio
4. Confirms data integrity between Dexie and Supabase

This proves that the edge computing approach works and data successfully syncs to the cloud when connected.

### Demo Conclusion Script

```javascript
// Final demo verification
async function verifySync() {
  // Using Supabase MCP
  const cloudData = await querySupabase("SELECT COUNT(*) FROM positions WHERE vessel_id = 'vessel-3001' AND created_at > NOW() - INTERVAL '5 minutes'");
  
  // Using Dexie.js locally
  const localData = await db.positions.where('vesselId').equals('vessel-3001').count();
  
  // Display verification
  showVerificationModal({
    localRecords: localData,
    cloudRecords: cloudData,
    syncSuccess: localData === cloudData,
    dataSaved: "1.3MB → 26KB",
    costSaved: "$4.73"
  });
}
```

Remember: This is a demo, so make the offline/online transition visually impressive with smooth animations and clear feedback. The goal is to show edge computing benefits in a maritime context.