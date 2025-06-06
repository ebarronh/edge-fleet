# EdgeFleet Demo

A monorepo demo project showcasing edge computing fleet management with real-time WebSocket communication and Supabase integration.

## Architecture

- **Fleet Command** (Port 3000): Central command interface showing all connected vessels
- **Vessel Apps** (Ports 3001-3003): Individual vessel interfaces with position tracking
- **WebSocket Server** (Port 3999): Real-time communication hub
- **Supabase Client**: Shared package for database operations

## Setup

### 1. Prerequisites

- Node.js (v18 or higher)
- npm
- Supabase project with the following tables:

```sql
create table vessels (
  id text primary key,
  name text not null,
  status text default 'online',
  last_position jsonb,
  created_at timestamp with time zone default now()
);

create table sync_logs (
  id uuid default gen_random_uuid() primary key,
  vessel_id text references vessels(id),
  action text,
  data jsonb,
  created_at timestamp with time zone default now()
);

alter table vessels enable row level security;
alter table sync_logs enable row level security;
create policy "Allow all for demo" on vessels for all using (true);
create policy "Allow all for demo" on sync_logs for all using (true);
```

### 2. Configuration

The first time you run the demo, configuration files will be created automatically:

```bash
# Clone the repository
git clone <your-repo-url>
cd edge-fleet

# Install dependencies and create config files
npm install
./start-demo.sh
```

Then update the generated configuration files with your Supabase credentials:

**apps/fleet-command/.env:**
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_WS_URL=ws://localhost:3999
```

**apps/vessel-app/.env:**
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_WS_URL=ws://localhost:3999
VITE_PORT=3001
```

**claude-mcp-config.json** (for Claude Code MCP integration):
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--url", "https://your-project-id.supabase.co",
        "--anon-key", "your-anon-key-here"
      ]
    }
  }
}
```

### 3. Activate Claude MCP Config (Optional)

To use the Supabase MCP server with Claude Code:

```bash
# Use the config for this session
claude-code --mcp-config ./claude-mcp-config.json

# Or set as default (adjust path as needed)
cp claude-mcp-config.json ~/.config/claude-code/config.json
```

### 4. Start the Demo

```bash
./start-demo.sh
```

This will start all services:
- Fleet Command: http://localhost:3000
- Vessel App 1: http://localhost:3001
- Vessel App 2: http://localhost:3002
- Vessel App 3: http://localhost:3003
- WebSocket Server: ws://localhost:3999

## Features

- ✅ Real-time vessel tracking via WebSocket
- ✅ Automatic vessel registration in Supabase
- ✅ Position updates and sync logging
- ✅ Connection status monitoring
- ✅ Multi-vessel simulation (3 vessel instances)
- ✅ Turborepo monorepo structure
- ✅ TypeScript throughout

## Development

### Individual Commands

```bash
# Install dependencies
npm install

# Build shared packages
npm run build

# Start WebSocket server
cd apps/websocket-server && npm start

# Start Fleet Command
cd apps/fleet-command && npm run dev

# Start a vessel app
cd apps/vessel-app && npm run dev
cd apps/vessel-app && npm run dev:3002
cd apps/vessel-app && npm run dev:3003
```

### Project Structure

```
edgefleet/
├── apps/
│   ├── fleet-command/     # Fleet management interface
│   ├── vessel-app/        # Vessel interface template
│   └── websocket-server/  # WebSocket communication server
├── packages/
│   └── supabase-client/   # Shared Supabase client library
├── start-demo.sh          # Demo startup script
└── claude-mcp-config.json # MCP server configuration
```

## Phase 0 Status

This is Phase 0 of the EdgeFleet demo, focusing on:
- ✅ Basic connectivity between all components
- ✅ Vessel registration and tracking
- ✅ Real-time position updates
- ✅ WebSocket communication
- ✅ Supabase integration

Ready for Phase 1 expansion with advanced edge computing features.