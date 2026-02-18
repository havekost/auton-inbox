#!/usr/bin/env npx tsx
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || "http://localhost:3000";

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const server = new McpServer({
  name: "auton-inbox",
  version: "1.0.0",
});

// Tool: create_inbox
server.tool(
  "create_inbox",
  "Create a new webhook inbox and get its unique endpoint URL",
  { name: z.string().optional().describe("Optional human-readable name for the inbox") },
  async ({ name }) => {
    const { data, error } = await supabase
      .from("inboxes")
      .insert({ name: name || null })
      .select()
      .single();

    if (error) {
      return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    }

    const endpointUrl = `${baseUrl}/api/inbox/${data.id}`;
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              id: data.id,
              name: data.name,
              endpoint_url: endpointUrl,
              monitor_url: `${baseUrl}/inbox/${data.id}`,
              created_at: data.created_at,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: list_inboxes
server.tool(
  "list_inboxes",
  "List all existing inboxes",
  {},
  async () => {
    const { data, error } = await supabase
      .from("inboxes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    }

    const inboxes = (data || []).map((inbox) => ({
      id: inbox.id,
      name: inbox.name,
      endpoint_url: `${baseUrl}/api/inbox/${inbox.id}`,
      created_at: inbox.created_at,
    }));

    return {
      content: [{ type: "text" as const, text: JSON.stringify(inboxes, null, 2) }],
    };
  }
);

// Tool: get_messages
server.tool(
  "get_messages",
  "Get messages received by an inbox",
  {
    inbox_id: z.string().describe("UUID of the inbox"),
    limit: z.number().optional().default(20).describe("Max messages to return (default 20)"),
  },
  async ({ inbox_id, limit }) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("inbox_id", inbox_id)
      .order("received_at", { ascending: false })
      .limit(limit);

    if (error) {
      return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    }

    return {
      content: [{ type: "text" as const, text: JSON.stringify(data || [], null, 2) }],
    };
  }
);

// Tool: send_message
server.tool(
  "send_message",
  "Send a message/webhook payload to an inbox (POST to its endpoint)",
  {
    inbox_id: z.string().describe("UUID of the inbox to send to"),
    body: z.record(z.string(), z.unknown()).describe("JSON body to send as the webhook payload"),
  },
  async ({ inbox_id, body }) => {
    const { error } = await supabase.from("messages").insert({
      inbox_id,
      headers: { "content-type": "application/json", "user-agent": "auton-inbox-mcp" },
      body,
      method: "POST",
    });

    if (error) {
      return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    }

    return {
      content: [{ type: "text" as const, text: "Message sent successfully." }],
    };
  }
);

// Tool: delete_inbox
server.tool(
  "delete_inbox",
  "Delete an inbox and all its messages",
  {
    inbox_id: z.string().describe("UUID of the inbox to delete"),
  },
  async ({ inbox_id }) => {
    const { error } = await supabase
      .from("inboxes")
      .delete()
      .eq("id", inbox_id);

    if (error) {
      return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    }

    return {
      content: [{ type: "text" as const, text: "Inbox deleted successfully." }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("MCP server error:", err);
  process.exit(1);
});
