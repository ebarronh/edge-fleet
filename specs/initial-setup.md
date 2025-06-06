Create an EdgeFleet demo project with the following specifications:
I have a Supabase project with:

URL: [INSERT YOUR SUPABASE URL HERE]
Anon Key: [INSERT YOUR ANON KEY HERE]

Please create a monorepo project called "edgefleet" with this structure:

Fleet Command app on port 3000
Vessel app template that runs on ports 3001-3003
WebSocket server on port 3999
Shared Supabase client package
All using React + TypeScript + Vite

Set up the following:

Create the monorepo structure with Turborepo
Create 3 Vite React apps (fleet-command, vessel-app, websocket-server)
Configure the apps to show connection status to both WebSocket and Supabase
Fleet Command should list all connected vessels
Each vessel should register itself in Supabase when it starts
Create a start script that launches everything

Use these exact Supabase table schemas:
```sql
sqlcreate table vessels (
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

Create a claude-mcp-config.json file with my Supabase credentials for the MCP servers. Based it on the following:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
    },
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--url", "https://your-project-id.supabase.co",
        "--anon-key", "your-anon-key-here"
      ]
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"],
      "env": {
        "PUPPETEER_LAUNCH_OPTIONS": "{\"headless\": false}"
      }
    }
  }
}
```

Let me know when I need to restore Claude Code.

Make it so I can run npm install and ./start-demo.sh to see everything working.
The apps should be minimal - just show connection status and basic functionality to verify everything is connected properly. This is Phase 0 of a larger edge computing demo.