# Troubleshooting White Screen Issues in EdgeFleet

## Common Causes and Solutions

### 1. **Leaflet CSS Import Issues**
**Problem**: React Leaflet requires CSS to be imported for maps to display properly.

**Solution**: Ensure these imports are in your component files:
```typescript
import 'leaflet/dist/leaflet.css';
```

**Verification**: Check that VesselMap.tsx includes this import (✓ Already fixed in our code)

### 2. **React 19 Compatibility**
**Problem**: React 19 has breaking changes with some libraries, particularly React Leaflet 4.2.1 expects React 18.

**Solution**: We installed with `--legacy-peer-deps` which can cause runtime issues.

**Workaround Options**:
- Downgrade to React 18 (not recommended for new features)
- Use a React 19 compatible version of react-leaflet when available
- Create a custom wrapper that handles compatibility

### 3. **Map Container Height Issues**
**Problem**: Maps need explicit height/width or they won't render.

**Solution**: Our VesselMap is wrapped in a div with `h-96` class (✓ Already fixed)

### 4. **Process Management Issues**
**Symptoms**: 
- Multiple WebSocket connections (258 clients)
- Old processes from 2:40AM still running
- ERR_CONNECTION_REFUSED despite Vite saying it's ready

**Solutions**:
```bash
# Kill all old processes
pkill -f vite
pkill -f "node.*websocket"
pkill -f "npm run"

# Clear any port conflicts
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
lsof -ti:3002 | xargs kill -9
lsof -ti:3003 | xargs kill -9
lsof -ti:3999 | xargs kill -9

# Restart cleanly
./start-demo.sh
```

### 5. **Browser Cache Issues**
**Solution**: 
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)
- Open in incognito/private window
- Clear browser cache for localhost

### 6. **Build/Compilation Errors**
**Check for**:
- TypeScript errors: `npm run type-check`
- Build errors: `npm run build`
- Lint errors: `npm run lint`

All these passed ✓ in our case.

### 7. **Console Error Checking**
**How to check**:
1. Open browser DevTools (F12)
2. Check Console tab for red errors
3. Check Network tab for failed resource loads
4. Check for Vite error overlay

### 8. **IndexedDB Issues**
**Problem**: Corrupted IndexedDB can prevent app startup

**Solution**: Clear IndexedDB:
```javascript
// In browser console
indexedDB.deleteDatabase('EdgeFleetDB');
```

## Debugging Steps

1. **Check if services are running**:
```bash
ps aux | grep -E "(vite|node)" | grep -v grep
```

2. **Check ports are available**:
```bash
lsof -i :3000
lsof -i :3001
lsof -i :3002
lsof -i :3003
lsof -i :3999
```

3. **Start services individually** to see specific errors:
```bash
# Terminal 1: WebSocket server
cd apps/websocket-server && npm start

# Terminal 2: Fleet Command
cd apps/fleet-command && npm run dev

# Terminal 3: Vessel App
cd apps/vessel-app && npm run dev
```

4. **Check for module resolution issues**:
```bash
# Verify all dependencies are installed
npm install

# Check for peer dependency warnings
npm ls react react-dom
```

## Best Practices to Avoid White Screens

1. **Always run a clean start**:
```bash
# Clean everything
npm run clean
rm -rf node_modules apps/*/node_modules packages/*/node_modules
npm install
./start-demo.sh
```

2. **Monitor the WebSocket server** - if you see excessive connections (>10), restart everything

3. **Use the build command** before demos to catch errors early:
```bash
npm run build
```

4. **Keep browser DevTools open** during development to catch errors immediately

5. **Version Management**:
- Pin dependencies in package.json
- Use exact versions for critical deps like React
- Test upgrades in isolation

## Current Status

The white screen was caused by:
1. Stale processes from 2:40AM causing port conflicts
2. Excessive WebSocket connections (258 clients) indicating a connection loop
3. Possible React 19 / React Leaflet compatibility issues

The code itself builds and type-checks successfully, indicating the issue is runtime/environment related rather than code errors.