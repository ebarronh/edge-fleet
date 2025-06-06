#!/bin/bash

# EdgeFleet Demo Startup Script
echo "🚀 Starting EdgeFleet Demo..."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the shared package
echo "🔨 Building shared Supabase client package..."
cd packages/supabase-client
npm run build
cd ../..

# Build WebSocket server
echo "🔨 Building WebSocket server..."
cd apps/websocket-server
npm run build
cd ../..

# Create .env files from examples if they don't exist
if [ ! -f apps/fleet-command/.env ]; then
    echo "📝 Creating fleet-command .env file from example..."
    cp apps/fleet-command/.env.example apps/fleet-command/.env
    echo "⚠️  Please update apps/fleet-command/.env with your Supabase credentials!"
fi

if [ ! -f apps/vessel-app/.env ]; then
    echo "📝 Creating vessel-app .env file from example..."
    cp apps/vessel-app/.env.example apps/vessel-app/.env
    echo "⚠️  Please update apps/vessel-app/.env with your Supabase credentials!"
fi

# Create Claude MCP config from example if it doesn't exist
if [ ! -f claude-mcp-config.json ]; then
    echo "📝 Creating claude-mcp-config.json from example..."
    cp claude-mcp-config.example.json claude-mcp-config.json
    echo "⚠️  Please update claude-mcp-config.json with your Supabase credentials!"
fi

# Function to kill all background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down EdgeFleet Demo..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo ""
echo "🌐 Starting all services..."
echo "================================"
echo "Fleet Command:   http://localhost:3000"
echo "Vessel App:      http://localhost:3001"
echo "Vessel App 2:    http://localhost:3002"
echo "Vessel App 3:    http://localhost:3003"
echo "WebSocket:       ws://localhost:3999"
echo "================================"
echo ""
echo "💡 Remember to update your .env files with your Supabase credentials!"
echo ""

# Start WebSocket server
echo "🔌 Starting WebSocket server on port 3999..."
cd apps/websocket-server
npm start &
WS_PID=$!
cd ../..

# Wait a moment for WebSocket server to start
sleep 2

# Start Fleet Command app
echo "🚢 Starting Fleet Command on port 3000..."
cd apps/fleet-command
npm run dev &
FLEET_PID=$!
cd ../..

# Start Vessel apps
echo "⛵ Starting Vessel App on port 3001..."
cd apps/vessel-app
npm run dev &
VESSEL1_PID=$!
cd ../..

echo "⛵ Starting Vessel App on port 3002..."
cd apps/vessel-app
VITE_PORT=3002 npm run dev:3002 &
VESSEL2_PID=$!
cd ../..

echo "⛵ Starting Vessel App on port 3003..."
cd apps/vessel-app
VITE_PORT=3003 npm run dev:3003 &
VESSEL3_PID=$!
cd ../..

echo ""
echo "✅ All services started successfully!"
echo ""
echo "📋 Service Status:"
echo "- WebSocket Server: Running (PID: $WS_PID)"
echo "- Fleet Command:    Running (PID: $FLEET_PID)"
echo "- Vessel App 1:     Running (PID: $VESSEL1_PID)"
echo "- Vessel App 2:     Running (PID: $VESSEL2_PID)"
echo "- Vessel App 3:     Running (PID: $VESSEL3_PID)"
echo ""
echo "🔧 To stop all services, press Ctrl+C"
echo ""

# Wait for all background processes
wait