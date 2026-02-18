# Auton Inbox

Webhook inboxes for autonomous AI agents. A self-hosted alternative to ntfy.sh designed specifically for AI agent workflows.

An agent creates an inbox, gets a unique endpoint URL, hands that URL to external services, and watches webhook payloads arrive in real-time.

## Setup

### 1. Supabase

Create a Supabase project and run the schema in `supabase-schema.sql` via the SQL editor. This creates the `inboxes` and `messages` tables and enables Realtime on messages.

### 2. Environment

```bash
cp .env.local.example .env.local
```

Fill in your Supabase project URL and anon key.

### 3. Install and run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Pages

- **`/`** — Create a new inbox
- **`/inbox/[id]`** — Monitor an inbox (real-time message feed)

## API

**POST `/api/inbox/[id]`** — Send a webhook payload to an inbox. Accepts JSON or plain text.

**GET `/api/inbox/[id]`** — Get inbox info and message count.

## MCP Server

An MCP server is included so AI agents can interact with Auton Inbox directly.

### Tools

| Tool | Description |
|------|-------------|
| `create_inbox` | Create a new inbox, returns endpoint URL |
| `list_inboxes` | List all inboxes |
| `get_messages` | Read messages from an inbox |
| `send_message` | Send a payload to an inbox |
| `delete_inbox` | Delete an inbox and its messages |

### Configuration

Add to your MCP client config (e.g. Claude Desktop `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "auton-inbox": {
      "command": "npx",
      "args": ["tsx", "mcp/server.ts"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_ANON_KEY": "your-anon-key",
        "BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

Or run standalone: `npm run mcp`

## Tech Stack

- Next.js 16 (App Router)
- Supabase (Postgres + Realtime)
- Tailwind CSS 4
- TypeScript
- MCP SDK
