import WebSocket, { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 3999;

interface ClientInfo {
  id: string;
  type: 'fleet-command' | 'vessel';
  name?: string;
  port?: string;
}

class EdgeFleetWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, ClientInfo> = new Map();

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.setupServer();
  }

  private setupServer(): void {
    console.log(`🚀 EdgeFleet WebSocket Server starting on port ${PORT}`);

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New client connected');

      // Assign a temporary ID until client identifies itself
      const clientInfo: ClientInfo = {
        id: this.generateId(),
        type: 'vessel'
      };
      this.clients.set(ws, clientInfo);

      ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(ws, data);
      });

      ws.on('close', () => {
        const client = this.clients.get(ws);
        if (client) {
          console.log(`Client disconnected: ${client.type} ${client.name || client.id}`);
          this.clients.delete(ws);
          this.broadcastUpdate();
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to EdgeFleet WebSocket Server',
        clientId: clientInfo.id
      }));
    });

    this.wss.on('listening', () => {
      console.log(`✅ WebSocket Server listening on port ${PORT}`);
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket Server error:', error);
    });
  }

  private handleMessage(ws: WebSocket, data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());
      const client = this.clients.get(ws);
      
      if (!client) return;

      console.log(`Message from ${client.type}:`, message);

      switch (message.type) {
        case 'fleet-command-connected':
          client.type = 'fleet-command';
          client.name = 'Fleet Command';
          console.log('Fleet Command connected');
          this.broadcastUpdate();
          break;

        case 'vessel-connected':
          client.type = 'vessel';
          client.name = message.vessel?.name || `Vessel ${client.id}`;
          client.port = message.vessel?.port;
          client.id = message.vessel?.id || client.id;
          console.log(`Vessel connected: ${client.name} on port ${client.port}`);
          this.broadcastUpdate();
          break;

        case 'position-update':
          console.log(`Position update from ${client.name}:`, message.vessel?.position);
          this.broadcastToFleetCommand({
            type: 'vessel-update',
            vessel: {
              id: message.vessel?.id || client.id,
              name: message.vessel?.name || client.name,
              position: message.vessel?.position,
              timestamp: message.vessel?.timestamp
            }
          });
          break;

        case 'vessel-status-update':
          console.log(`Status update from ${client.name}: ${message.vessel?.status}`);
          // Update client status in our records
          if (message.vessel?.status) {
            (client as any).status = message.vessel.status;
          }
          this.broadcastToFleetCommand({
            type: 'vessel-status-update',
            vessel: {
              id: message.vessel?.id || client.id,
              name: message.vessel?.name || client.name,
              status: message.vessel?.status,
              position: message.vessel?.position,
              sensorData: message.vessel?.sensorData,
              timestamp: message.vessel?.timestamp
            }
          });
          this.broadcastUpdate();
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  private broadcastUpdate(): void {
    const vessels = Array.from(this.clients.values())
      .filter(client => client.type === 'vessel')
      .map(client => ({
        id: client.id,
        name: client.name,
        port: client.port
      }));

    const updateMessage = {
      type: 'fleet-update',
      vessels,
      timestamp: new Date().toISOString()
    };

    this.broadcast(updateMessage);
  }

  private broadcastToFleetCommand(message: any): void {
    this.clients.forEach((client, ws) => {
      if (client.type === 'fleet-command' && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  private broadcast(message: any): void {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((_, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  public getStats(): { totalClients: number; fleetCommands: number; vessels: number } {
    const stats = { totalClients: 0, fleetCommands: 0, vessels: 0 };
    
    this.clients.forEach(client => {
      stats.totalClients++;
      if (client.type === 'fleet-command') {
        stats.fleetCommands++;
      } else if (client.type === 'vessel') {
        stats.vessels++;
      }
    });

    return stats;
  }
}

// Start the server
const server = new EdgeFleetWebSocketServer(Number(PORT));

// Log stats every 30 seconds
setInterval(() => {
  const stats = server.getStats();
  console.log(`📊 Server Stats: ${stats.totalClients} total clients (${stats.fleetCommands} fleet commands, ${stats.vessels} vessels)`);
}, 30000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down WebSocket server...');
  process.exit(0);
});