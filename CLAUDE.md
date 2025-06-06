# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EdgeFleet is a monorepo demo showcasing edge computing fleet management with real-time WebSocket communication and Supabase integration. It demonstrates a microservices architecture with:

- **Fleet Command** (Port 3000): Central command interface showing all connected vessels
- **Vessel Apps** (Ports 3001-3003): Individual vessel interfaces with position tracking  
- **WebSocket Server** (Port 3999): Real-time communication hub
- **Supabase Client**: Shared package for database operations

## Common Commands

### Development Setup
```bash
# Install all dependencies
npm install

# Start the complete demo (all services)
./start-demo.sh

# Build all packages and apps
npm run build

# Run linting across all apps
npm run lint

# Run type checking across all apps
npm run type-check
```

### Individual Service Commands
```bash
# Build shared Supabase client package (required first)
cd packages/supabase-client && npm run build

# Build and start WebSocket server
cd apps/websocket-server && npm run build && npm start

# Start Fleet Command interface
cd apps/fleet-command && npm run dev

# Start vessel apps on different ports
cd apps/vessel-app && npm run dev        # Port 3001
cd apps/vessel-app && npm run dev:3002   # Port 3002  
cd apps/vessel-app && npm run dev:3003   # Port 3003
```

### App-Specific Development
```bash
# Lint individual apps
cd apps/fleet-command && npm run lint
cd apps/vessel-app && npm run lint

# Type check individual apps
cd apps/fleet-command && npm run type-check
cd apps/vessel-app && npm run type-check
cd apps/websocket-server && npm run type-check
```

## Architecture Notes

### Monorepo Structure
- Uses Turborepo for workspace management
- Shared dependencies through workspace protocol (`workspace:*`)
- Centralized build pipeline with dependency ordering

### Key Dependencies
- **React + TypeScript + Vite**: Frontend applications
- **WebSocket (ws)**: Real-time communication server
- **Supabase**: Database integration and real-time features
- **Turborepo**: Monorepo orchestration

### Database Schema
The project expects Supabase tables:
- `vessels`: Stores vessel information, status, and position data
- `sync_logs`: Tracks synchronization events and actions

### Configuration
- Environment files (`.env`) required for Supabase credentials
- Claude MCP configuration (`claude-mcp-config.json`) for Supabase integration
- All services configured to work together via localhost ports

### Communication Flow
1. Vessel apps connect to WebSocket server (port 3999)
2. Vessel apps register themselves in Supabase on startup
3. Fleet Command monitors all vessels via WebSocket and Supabase
4. Real-time position updates flow through WebSocket to all connected clients