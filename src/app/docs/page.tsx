export default function DocsPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Documentation</h1>
        <p className="text-[var(--muted)] text-sm">
          Everything you need to know about Auton Inbox — webhook inboxes built
          for autonomous AI agents and inter-service communication.
        </p>
      </div>

      {/* Overview */}
      <Section title="Overview">
        <p>
          Auton Inbox is a self-hosted webhook inbox system designed for
          machine-to-machine communication. It gives AI agents and external
          services a centralized place to exchange structured JSON messages with
          real-time monitoring, message routing, and correlation tracking.
        </p>
        <p>
          Each inbox exposes a REST endpoint that accepts POST requests. Messages
          follow a universal format with <Code>source</Code>,{" "}
          <Code>topic</Code>, an optional <Code>ref</Code> for correlation, and
          an arbitrary <Code>payload</Code>. Inbox owners watch messages arrive
          in real-time through the browser-based monitor.
        </p>
      </Section>

      {/* Authentication */}
      <Section title="Authentication">
        <p>Every inbox has two credentials:</p>
        <ul className="list-disc list-inside space-y-1 text-[var(--muted)]">
          <li>
            <strong className="text-[var(--fg)]">Public Key</strong> — shared
            with services that send webhooks. Passed via the{" "}
            <Code>x-inbox-key</Code> header or <Code>?key=</Code> query
            parameter.
          </li>
          <li>
            <strong className="text-[var(--fg)]">Private Secret</strong> — the
            inbox owner&apos;s password. Required to read messages, access the
            monitor, or delete the inbox. Keep it safe — it cannot be recovered.
          </li>
        </ul>
      </Section>

      {/* Universal Message Format */}
      <Section title="Universal Message Format">
        <p>
          All messages sent to an inbox must conform to this schema. The format
          is validated server-side using Zod.
        </p>
        <CodeBlock>{`{
  "source": "string",       // Origin: service name, agent ID, or path
  "topic":  "string",       // Message type for routing / filtering
  "ref":    "string",       // Optional correlation or thread ID
  "payload": { ... }        // Optional arbitrary structured data
}`}</CodeBlock>
        <div className="space-y-1 text-[var(--muted)]">
          <p>
            <strong className="text-[var(--fg)]">source</strong> — identifies
            who sent the message. Examples:{" "}
            <Code>github</Code>, <Code>slack/agent-bob</Code>,{" "}
            <Code>agent-xyz</Code>.
          </p>
          <p>
            <strong className="text-[var(--fg)]">topic</strong> — a
            machine-parseable event type used for filtering and routing.
            Examples: <Code>pr.merged</Code>, <Code>task.complete</Code>,{" "}
            <Code>message</Code>.
          </p>
          <p>
            <strong className="text-[var(--fg)]">ref</strong> — optional
            correlation ID for linking related messages across a thread or
            workflow.
          </p>
          <p>
            <strong className="text-[var(--fg)]">payload</strong> — optional
            free-form data. Structure varies by source and topic.
          </p>
        </div>
      </Section>

      {/* REST API */}
      <Section title="REST API">
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">
              POST /api/inbox/[id]
            </h3>
            <p className="text-[var(--muted)]">
              Send a message to an inbox. Requires the public key via{" "}
              <Code>x-inbox-key</Code> header or <Code>?key=</Code> query
              parameter. The request body must match the universal message
              format.
            </p>
            <CodeBlock>{`curl -X POST https://your-host/api/inbox/INBOX_ID \\
  -H "Content-Type: application/json" \\
  -H "x-inbox-key: PUBLIC_KEY" \\
  -d '{
    "source": "my-service",
    "topic": "deploy.complete",
    "payload": { "version": "1.2.0" }
  }'`}</CodeBlock>
            <p className="text-[var(--muted)]">
              Returns <Code>{`{ "ok": true }`}</Code> on success. Possible
              errors: <Code>401</Code> missing key, <Code>404</Code> invalid
              inbox/key, <Code>422</Code> invalid message format.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">
              GET /api/inbox/[id]?secret=PRIVATE_SECRET
            </h3>
            <p className="text-[var(--muted)]">
              Retrieve inbox metadata and message count. Requires the private
              secret via <Code>?secret=</Code> query parameter. Returns the
              inbox info (id, name, public key, creation date) and total message
              count.
            </p>
          </div>
        </div>
      </Section>

      {/* Real-Time Monitor */}
      <Section title="Real-Time Monitor">
        <p>
          The inbox monitor at <Code>/inbox/[id]</Code> provides a live
          dashboard for watching messages arrive. It uses Supabase Realtime
          subscriptions on the <Code>messages</Code> table so new messages
          appear instantly without polling.
        </p>
        <p>Features of the monitor:</p>
        <ul className="list-disc list-inside space-y-1 text-[var(--muted)]">
          <li>Real-time message feed as webhooks arrive</li>
          <li>
            Filter messages by <Code>topic</Code>, <Code>source</Code>, or{" "}
            <Code>ref</Code> (substring match)
          </li>
          <li>Built-in &quot;Send a Message&quot; form for testing</li>
          <li>Displays endpoint URL and public key for sharing</li>
        </ul>
      </Section>

      {/* MCP Server */}
      <Section title="MCP Server (AI Agent Integration)">
        <p>
          Auton Inbox includes a{" "}
          <strong>Model Context Protocol (MCP)</strong> server that lets AI
          agents manage inboxes and messages programmatically through tool calls.
          The MCP server exposes four tools:
        </p>
        <div className="rounded border border-[var(--border)] bg-[var(--surface)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="px-3 py-2 font-semibold">Tool</th>
                <th className="px-3 py-2 font-semibold">Description</th>
                <th className="px-3 py-2 font-semibold">Auth</th>
              </tr>
            </thead>
            <tbody className="text-[var(--muted)]">
              <tr className="border-b border-[var(--border)]">
                <td className="px-3 py-2">
                  <Code>create_inbox</Code>
                </td>
                <td className="px-3 py-2">
                  Create a new inbox, returns endpoint URL and credentials
                </td>
                <td className="px-3 py-2">None</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="px-3 py-2">
                  <Code>send_message</Code>
                </td>
                <td className="px-3 py-2">
                  Send a message to an inbox
                </td>
                <td className="px-3 py-2">Public Key</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="px-3 py-2">
                  <Code>get_messages</Code>
                </td>
                <td className="px-3 py-2">
                  Retrieve messages with optional filters
                </td>
                <td className="px-3 py-2">Private Secret</td>
              </tr>
              <tr>
                <td className="px-3 py-2">
                  <Code>delete_inbox</Code>
                </td>
                <td className="px-3 py-2">
                  Delete an inbox and all its messages
                </td>
                <td className="px-3 py-2">Private Secret</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[var(--muted)]">
          To connect an AI agent, add the MCP server to your agent&apos;s
          configuration:
        </p>
        <CodeBlock>{`{
  "mcpServers": {
    "auton-inbox": {
      "command": "npx",
      "args": ["tsx", "mcp/server.ts"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_ANON_KEY": "your-anon-key",
        "BASE_URL": "https://your-host"
      }
    }
  }
}`}</CodeBlock>
      </Section>

      {/* Database Schema */}
      <Section title="Database Schema">
        <p>
          Auton Inbox uses Supabase (PostgreSQL) with two tables:
        </p>
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">inboxes</h3>
            <CodeBlock>{`id             UUID        Primary key
name           TEXT        UUID v7 (time-sortable identifier)
public_key     UUID        Shared with senders
private_secret UUID        Owner password
created_at     TIMESTAMPTZ Auto-set on creation`}</CodeBlock>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">messages</h3>
            <CodeBlock>{`id          UUID        Primary key
inbox_id    UUID        Foreign key → inboxes (cascade delete)
headers     JSONB       Subset of request headers
body        JSONB       Universal message format
method      TEXT        HTTP method (default POST)
received_at TIMESTAMPTZ Auto-set on receipt`}</CodeBlock>
          </div>
        </div>
        <p className="text-[var(--muted)]">
          Realtime is enabled on the <Code>messages</Code> table for live
          updates. Database indexes exist on <Code>messages.inbox_id</Code> and{" "}
          <Code>inboxes.public_key</Code> for fast lookups.
        </p>
      </Section>

      {/* Environment Variables */}
      <Section title="Environment Variables">
        <CodeBlock>{`NEXT_PUBLIC_SUPABASE_URL       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anonymous key
NEXT_PUBLIC_BASE_URL          # Base URL for generated endpoint URLs
                              # (defaults to http://localhost:3000)`}</CodeBlock>
      </Section>

      {/* Tech Stack */}
      <Section title="Tech Stack">
        <ul className="list-disc list-inside space-y-1 text-[var(--muted)]">
          <li>
            <strong className="text-[var(--fg)]">Next.js 16</strong> — App
            Router for frontend pages and API routes
          </li>
          <li>
            <strong className="text-[var(--fg)]">React 19</strong> — UI
            rendering
          </li>
          <li>
            <strong className="text-[var(--fg)]">Supabase</strong> — PostgreSQL
            database with Realtime subscriptions
          </li>
          <li>
            <strong className="text-[var(--fg)]">Tailwind CSS 4</strong> —
            Utility-first styling with a dark monospace theme
          </li>
          <li>
            <strong className="text-[var(--fg)]">TypeScript</strong> — Type
            safety across the stack
          </li>
          <li>
            <strong className="text-[var(--fg)]">Zod</strong> — Runtime schema
            validation for incoming messages
          </li>
          <li>
            <strong className="text-[var(--fg)]">MCP SDK</strong> — Model
            Context Protocol server for AI agent tool integration
          </li>
        </ul>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="space-y-2 text-sm">{children}</div>
    </section>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-[var(--surface)] px-1.5 py-0.5 text-[var(--accent)] text-xs">
      {children}
    </code>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="rounded border border-[var(--border)] bg-[var(--surface)] p-4 text-xs text-[var(--accent)] overflow-x-auto whitespace-pre-wrap break-all">
      {children}
    </pre>
  );
}
