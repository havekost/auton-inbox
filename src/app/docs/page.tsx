export default function DocsPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Documentation</h1>
        <p className="text-[var(--muted)] text-sm">
          Everything you need to know about using Auton Inbox — webhook inboxes
          built for autonomous AI agents and inter-service communication.
        </p>
      </div>

      {/* Overview */}
      <Section title="Overview">
        <p>
          Auton Inbox provides webhook inboxes designed for machine-to-machine
          communication. AI agents and external services get a centralized place
          to exchange structured JSON messages with real-time monitoring, message
          routing, and correlation tracking.
        </p>
        <p>
          Create an inbox, hand the endpoint URL and public key to the services
          that need to send you data, and watch messages arrive in real-time
          through the browser-based monitor — or read them programmatically via
          the API or MCP tools.
        </p>
      </Section>

      {/* Getting Started */}
      <Section title="Getting Started">
        <ol className="list-decimal list-inside space-y-2 text-[var(--muted)]">
          <li>
            <strong className="text-[var(--fg)]">Create an inbox</strong> — click
            &quot;Create Inbox&quot; on the home page (or use the{" "}
            <Code>create_inbox</Code> MCP tool).
          </li>
          <li>
            <strong className="text-[var(--fg)]">Save your credentials</strong>{" "}
            — you&apos;ll receive an endpoint URL, a public key, and a private
            secret. The private secret cannot be recovered, so store it
            somewhere safe.
          </li>
          <li>
            <strong className="text-[var(--fg)]">Share the endpoint</strong> —
            give the endpoint URL and public key to any service or agent that
            needs to send you messages.
          </li>
          <li>
            <strong className="text-[var(--fg)]">Monitor messages</strong> —
            open the inbox monitor to watch messages arrive in real-time, or
            retrieve them via the API / MCP tools using your private secret.
          </li>
        </ol>
      </Section>

      {/* Authentication */}
      <Section title="Authentication">
        <p>Every inbox has two credentials:</p>
        <ul className="list-disc list-inside space-y-1 text-[var(--muted)]">
          <li>
            <strong className="text-[var(--fg)]">Public Key</strong> — shared
            with services that send messages. Passed via the{" "}
            <Code>x-inbox-key</Code> header or <Code>?key=</Code> query
            parameter.
          </li>
          <li>
            <strong className="text-[var(--fg)]">Private Secret</strong> — your
            password for the inbox. Required to read messages, access the
            monitor, or delete the inbox. Cannot be recovered — save it when
            you create the inbox.
          </li>
        </ul>
      </Section>

      {/* Universal Message Format */}
      <Section title="Message Format">
        <p>
          All messages sent to an inbox must conform to this format:
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
              parameter. The request body must match the message format above.
            </p>
            <CodeBlock>{`curl -X POST https://autoninbox.to/api/inbox/INBOX_ID \\
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
          dashboard for watching messages arrive. New messages appear instantly
          without needing to refresh.
        </p>
        <p>Features:</p>
        <ul className="list-disc list-inside space-y-1 text-[var(--muted)]">
          <li>Real-time message feed as webhooks arrive</li>
          <li>
            Filter messages by <Code>topic</Code>, <Code>source</Code>, or{" "}
            <Code>ref</Code>
          </li>
          <li>Built-in &quot;Send a Message&quot; form for testing</li>
          <li>Displays endpoint URL and public key for easy sharing</li>
        </ul>
      </Section>

      {/* MCP Server */}
      <Section title="MCP Server (AI Agent Integration)">
        <p>
          Auton Inbox provides a remote{" "}
          <strong>Model Context Protocol (MCP)</strong> server so AI agents can
          create inboxes, send messages, and read messages directly through tool
          calls — no local setup required.
        </p>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Remote MCP Server URL</h3>
          <CodeBlock>https://autoninbox.to/mcp</CodeBlock>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Connecting your agent</h3>
          <p className="text-[var(--muted)]">
            Add the remote MCP server to your agent or client configuration.
            For example, in Claude Desktop (<Code>claude_desktop_config.json</Code>):
          </p>
          <CodeBlock>{`{
  "mcpServers": {
    "auton-inbox": {
      "url": "https://autoninbox.to/mcp"
    }
  }
}`}</CodeBlock>
          <p className="text-[var(--muted)]">
            For Claude Code, add it via the CLI:
          </p>
          <CodeBlock>{`claude mcp add auton-inbox https://autoninbox.to/mcp`}</CodeBlock>
          <p className="text-[var(--muted)]">
            Any MCP-compatible client can connect using the URL above. No API
            keys or environment variables are needed to connect — authentication
            happens per-inbox using the public key and private secret.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Available tools</h3>
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
                    Retrieve messages with optional filters (topic, source, ref)
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
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Example workflow</h3>
          <p className="text-[var(--muted)]">
            A typical agent workflow using the MCP tools:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-[var(--muted)]">
            <li>
              Call <Code>create_inbox</Code> to get an endpoint URL, public key,
              and private secret
            </li>
            <li>
              Share the endpoint URL and public key with an external service
              (e.g. a GitHub webhook, another agent, a CI pipeline)
            </li>
            <li>
              Call <Code>get_messages</Code> with your private secret to read
              incoming messages, optionally filtering by topic, source, or ref
            </li>
            <li>
              Call <Code>send_message</Code> with a public key to send a message
              to any inbox (yours or another agent&apos;s)
            </li>
          </ol>
        </div>
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
