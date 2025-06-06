#!/bin/bash

echo "🧹 Cleaning up all EdgeFleet processes..."

# Kill all related processes
echo "Stopping all Node/NPM processes..."
pkill -f vite || true
pkill -f "node.*websocket" || true
pkill -f "npm run" || true
pkill -f "turbo" || true

# Clear any port conflicts
echo "Clearing ports..."
for port in 3000 3001 3002 3003 3999; do
  lsof -ti:$port | xargs kill -9 2>/dev/null || true
done

# Wait a moment for processes to die
sleep 2

# Verify ports are clear
echo "Verifying ports are clear..."
for port in 3000 3001 3002 3003 3999; do
  if lsof -i:$port > /dev/null 2>&1; then
    echo "❌ Port $port is still in use!"
    exit 1
  else
    echo "✅ Port $port is clear"
  fi
done

echo ""
echo "✨ All processes cleaned up!"
echo ""
echo "To start fresh, run:"
echo "  ./start-demo.sh"
echo ""
echo "Or to debug individually:"
echo "  Terminal 1: cd apps/websocket-server && npm start"
echo "  Terminal 2: cd apps/fleet-command && npm run dev"
echo "  Terminal 3: cd apps/vessel-app && npm run dev"