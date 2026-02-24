import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateId, generateSecretKey } from "@/lib/uuid";
import { hashSecretKey, verifySecretKey } from "@/lib/auth";

const SERVER_INFO = {
  name: "auton-inbox",
  version: "1.0.0",
};

const TOOLS = [
  {
    name: "create_inbox",
    description:
      "Creates a new Auton Inbox. Returns inbox_id and secret_key. The secret_key is shown only once — store it immediately. No parameters required.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "post_message",
    description:
      "Posts a message to any inbox by inbox_id. No authentication required — the inbox_id acts as the address. Requires source (sender name), topic (category), and message_payload (JSON object). Optionally include auth_key for sender verification.",
    inputSchema: {
      type: "object" as const,
      properties: {
        inbox_id: { type: "string", description: "Target inbox UUID" },
        source: {
          type: "string",
          description: "Name of the sending service or agent",
        },
        topic: { type: "string", description: "Topic/category string" },
        auth_key: {
          type: "string",
          description: "Optional validation key from sender",
        },
        message_payload: {
          type: "object",
          description: "Flexible JSON payload containing the message data",
        },
      },
      required: ["inbox_id", "source", "topic", "message_payload"],
    },
  },
  {
    name: "get_messages",
    description:
      "Gets messages from an inbox. Requires inbox_id and secret_key for authentication. Supports filtering by source, topic, unread_only, since (ISO timestamp), and full-text search. Supports pagination with limit and offset.",
    inputSchema: {
      type: "object" as const,
      properties: {
        inbox_id: { type: "string", description: "Inbox UUID" },
        secret_key: {
          type: "string",
          description: "Secret key for authentication",
        },
        limit: {
          type: "number",
          description: "Max messages to return (default 50, max 200)",
        },
        offset: { type: "number", description: "Pagination offset (default 0)" },
        unread_only: {
          type: "boolean",
          description: "Only return unread messages",
        },
        source: { type: "string", description: "Filter by source" },
        topic: { type: "string", description: "Filter by topic" },
        search: {
          type: "string",
          description:
            "Full-text search across source, topic, and message_payload",
        },
        since: {
          type: "string",
          description: "ISO timestamp — return messages created after this time",
        },
      },
      required: ["inbox_id", "secret_key"],
    },
  },
  {
    name: "get_inbox_info",
    description:
      "Gets inbox metadata including message_count and unread_count. Requires inbox_id and secret_key.",
    inputSchema: {
      type: "object" as const,
      properties: {
        inbox_id: { type: "string", description: "Inbox UUID" },
        secret_key: {
          type: "string",
          description: "Secret key for authentication",
        },
      },
      required: ["inbox_id", "secret_key"],
    },
  },
  {
    name: "mark_messages_read",
    description:
      'Marks messages as read. Provide an array of message_ids or the string "all" to mark all messages read. Requires inbox_id and secret_key.',
    inputSchema: {
      type: "object" as const,
      properties: {
        inbox_id: { type: "string", description: "Inbox UUID" },
        secret_key: {
          type: "string",
          description: "Secret key for authentication",
        },
        message_ids: {
          description:
            'Array of message ID strings, or the string "all" to mark all as read',
        },
      },
      required: ["inbox_id", "secret_key", "message_ids"],
    },
  },
  {
    name: "delete_message",
    description:
      "Deletes a single message from an inbox. Requires inbox_id, message_id, and secret_key.",
    inputSchema: {
      type: "object" as const,
      properties: {
        inbox_id: { type: "string", description: "Inbox UUID" },
        message_id: { type: "string", description: "Message UUID to delete" },
        secret_key: {
          type: "string",
          description: "Secret key for authentication",
        },
      },
      required: ["inbox_id", "message_id", "secret_key"],
    },
  },
  {
    name: "delete_inbox",
    description:
      "Deletes an inbox and all its messages. This action is irreversible. Requires inbox_id and secret_key.",
    inputSchema: {
      type: "object" as const,
      properties: {
        inbox_id: { type: "string", description: "Inbox UUID to delete" },
        secret_key: {
          type: "string",
          description: "Secret key for authentication",
        },
      },
      required: ["inbox_id", "secret_key"],
    },
  },
  {
    name: "send_message",
    description:
      "Sends a message from one inbox to another. The sender must authenticate with their inbox_id and secret_key. The message is delivered to to_inbox_id.",
    inputSchema: {
      type: "object" as const,
      properties: {
        inbox_id: { type: "string", description: "Sender's inbox UUID" },
        secret_key: {
          type: "string",
          description: "Sender's secret key for authentication",
        },
        to_inbox_id: { type: "string", description: "Recipient's inbox UUID" },
        source: {
          type: "string",
          description:
            "Name of the sending service/agent (typically the sender's inbox_id)",
        },
        topic: { type: "string", description: "Topic/category string" },
        auth_key: {
          type: "string",
          description: "Optional validation key",
        },
        message_payload: {
          type: "object",
          description: "JSON payload containing the message data",
        },
      },
      required: [
        "inbox_id",
        "secret_key",
        "to_inbox_id",
        "source",
        "topic",
        "message_payload",
      ],
    },
  },
  {
    name: "search_messages",
    description:
      "Searches messages in an inbox by source, topic, or full-text query. This is a convenience wrapper around get_messages with the search parameter. Requires inbox_id and secret_key.",
    inputSchema: {
      type: "object" as const,
      properties: {
        inbox_id: { type: "string", description: "Inbox UUID" },
        secret_key: {
          type: "string",
          description: "Secret key for authentication",
        },
        query: {
          type: "string",
          description:
            "Search query — matches against source, topic, and message_payload text",
        },
        source: { type: "string", description: "Filter by exact source match" },
        topic: { type: "string", description: "Filter by exact topic match" },
        limit: { type: "number", description: "Max results (default 50)" },
        offset: { type: "number", description: "Pagination offset (default 0)" },
      },
      required: ["inbox_id", "secret_key"],
    },
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolArgs = Record<string, any>;

async function handleToolCall(
  name: string,
  args: ToolArgs
): Promise<{ content: { type: string; text: string }[]; isError?: boolean }> {
  try {
    switch (name) {
      case "create_inbox": {
        const inboxId = generateId();
        const secretKey = generateSecretKey();
        const secretKeyHash = await hashSecretKey(secretKey);

        const { error } = await supabase.from("inboxes").insert({
          id: inboxId,
          secret_key_hash: secretKeyHash,
        });

        if (error) throw new Error("Failed to create inbox");

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                inbox_id: inboxId,
                secret_key: secretKey,
                warning:
                  "Store your secret_key now. It will never be shown again.",
                created_at: new Date().toISOString(),
              }),
            },
          ],
        };
      }

      case "post_message": {
        const { inbox_id, source, topic, auth_key, message_payload } = args;

        const { data: inbox } = await supabase
          .from("inboxes")
          .select("id")
          .eq("id", inbox_id)
          .single();

        if (!inbox) {
          return {
            content: [{ type: "text", text: "Inbox not found" }],
            isError: true,
          };
        }

        const messageId = generateId();
        const { error } = await supabase.from("messages").insert({
          id: messageId,
          inbox_id,
          source,
          topic,
          auth_key: auth_key || null,
          message_payload,
        });

        if (error) throw new Error("Failed to post message");

        await supabase.rpc("increment_message_count", {
          inbox_id_param: inbox_id,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                message_id: messageId,
                inbox_id,
                created_at: new Date().toISOString(),
              }),
            },
          ],
        };
      }

      case "get_messages":
      case "search_messages": {
        const {
          inbox_id,
          secret_key,
          limit: rawLimit,
          offset: rawOffset,
          unread_only,
          source,
          topic,
          search,
          query,
          since,
        } = args;

        const valid = await verifySecretKey(inbox_id, secret_key);
        if (!valid) {
          return {
            content: [{ type: "text", text: "Invalid secret key" }],
            isError: true,
          };
        }

        const limit = Math.min(rawLimit || 50, 200);
        const offset = rawOffset || 0;
        const searchTerm = search || query;

        let q = supabase
          .from("messages")
          .select(
            "id, source, topic, auth_key, message_payload, created_at, read_at",
            { count: "exact" }
          )
          .eq("inbox_id", inbox_id)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (unread_only) q = q.is("read_at", null);
        if (source) q = q.eq("source", source);
        if (topic) q = q.eq("topic", topic);
        if (since) q = q.gt("created_at", since);
        if (searchTerm) {
          q = q.or(
            `source.ilike.%${searchTerm}%,topic.ilike.%${searchTerm}%,message_payload::text.ilike.%${searchTerm}%`
          );
        }

        const { data: messages, count, error } = await q;
        if (error) throw new Error("Failed to retrieve messages");

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                inbox_id,
                messages: (messages || []).map((m) => ({
                  message_id: m.id,
                  source: m.source,
                  topic: m.topic,
                  auth_key: m.auth_key,
                  message_payload: m.message_payload,
                  created_at: m.created_at,
                  read_at: m.read_at,
                })),
                total: count ?? 0,
                limit,
                offset,
              }),
            },
          ],
        };
      }

      case "get_inbox_info": {
        const { inbox_id, secret_key } = args;

        const valid = await verifySecretKey(inbox_id, secret_key);
        if (!valid) {
          return {
            content: [{ type: "text", text: "Invalid secret key" }],
            isError: true,
          };
        }

        const { data: inbox, error } = await supabase
          .from("inboxes")
          .select("id, label, message_count, created_at")
          .eq("id", inbox_id)
          .single();

        if (error || !inbox) {
          return {
            content: [{ type: "text", text: "Inbox not found" }],
            isError: true,
          };
        }

        const { count: unreadCount } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("inbox_id", inbox_id)
          .is("read_at", null);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                inbox_id: inbox.id,
                label: inbox.label,
                message_count: inbox.message_count,
                unread_count: unreadCount ?? 0,
                created_at: inbox.created_at,
              }),
            },
          ],
        };
      }

      case "mark_messages_read": {
        const { inbox_id, secret_key, message_ids } = args;

        const valid = await verifySecretKey(inbox_id, secret_key);
        if (!valid) {
          return {
            content: [{ type: "text", text: "Invalid secret key" }],
            isError: true,
          };
        }

        const now = new Date().toISOString();
        let q = supabase
          .from("messages")
          .update({ read_at: now })
          .eq("inbox_id", inbox_id)
          .is("read_at", null);

        if (message_ids !== "all") {
          q = q.in("id", message_ids);
        }

        const { data, error } = await q.select("id");
        if (error) throw new Error("Failed to mark messages as read");

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ updated: data?.length ?? 0 }),
            },
          ],
        };
      }

      case "delete_message": {
        const { inbox_id, message_id, secret_key } = args;

        const valid = await verifySecretKey(inbox_id, secret_key);
        if (!valid) {
          return {
            content: [{ type: "text", text: "Invalid secret key" }],
            isError: true,
          };
        }

        const { error } = await supabase
          .from("messages")
          .delete()
          .eq("id", message_id)
          .eq("inbox_id", inbox_id);

        if (error) throw new Error("Failed to delete message");

        await supabase.rpc("decrement_message_count", {
          inbox_id_param: inbox_id,
        });

        return {
          content: [
            { type: "text", text: JSON.stringify({ deleted: true }) },
          ],
        };
      }

      case "delete_inbox": {
        const { inbox_id, secret_key } = args;

        const valid = await verifySecretKey(inbox_id, secret_key);
        if (!valid) {
          return {
            content: [{ type: "text", text: "Invalid secret key" }],
            isError: true,
          };
        }

        const { error } = await supabase
          .from("inboxes")
          .delete()
          .eq("id", inbox_id);

        if (error) throw new Error("Failed to delete inbox");

        return {
          content: [
            { type: "text", text: JSON.stringify({ deleted: true }) },
          ],
        };
      }

      case "send_message": {
        const {
          inbox_id,
          secret_key,
          to_inbox_id,
          source,
          topic,
          auth_key,
          message_payload,
        } = args;

        const valid = await verifySecretKey(inbox_id, secret_key);
        if (!valid) {
          return {
            content: [{ type: "text", text: "Invalid secret key" }],
            isError: true,
          };
        }

        const { data: targetInbox } = await supabase
          .from("inboxes")
          .select("id")
          .eq("id", to_inbox_id)
          .single();

        if (!targetInbox) {
          return {
            content: [{ type: "text", text: "Target inbox not found" }],
            isError: true,
          };
        }

        const messageId = generateId();
        const { error } = await supabase.from("messages").insert({
          id: messageId,
          inbox_id: to_inbox_id,
          source,
          topic,
          auth_key: auth_key || null,
          message_payload,
        });

        if (error) throw new Error("Failed to send message");

        await supabase.rpc("increment_message_count", {
          inbox_id_param: to_inbox_id,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                message_id: messageId,
                inbox_id: to_inbox_id,
                created_at: new Date().toISOString(),
              }),
            },
          ],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
      isError: true,
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function jsonRpcResponse(id: string | number | null, result: any) {
  return { jsonrpc: "2.0", id, result };
}

function jsonRpcError(
  id: string | number | null,
  code: number,
  message: string
) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      jsonRpcError(null, -32700, "Parse error"),
      { status: 400 }
    );
  }

  const { id, method, params } = body;

  switch (method) {
    case "initialize":
      return NextResponse.json(
        jsonRpcResponse(id, {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
        })
      );

    case "notifications/initialized":
      return NextResponse.json(jsonRpcResponse(id, {}));

    case "tools/list":
      return NextResponse.json(jsonRpcResponse(id, { tools: TOOLS }));

    case "tools/call": {
      const { name, arguments: args } = params || {};
      if (!name) {
        return NextResponse.json(
          jsonRpcError(id, -32602, "Missing tool name")
        );
      }
      const result = await handleToolCall(name, args || {});
      return NextResponse.json(jsonRpcResponse(id, result));
    }

    case "ping":
      return NextResponse.json(jsonRpcResponse(id, {}));

    default:
      return NextResponse.json(
        jsonRpcError(id, -32601, `Method not found: ${method}`)
      );
  }
}

export async function GET() {
  return NextResponse.json(
    jsonRpcError(null, -32000, "Method not allowed. Use POST."),
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    jsonRpcError(null, -32000, "Method not allowed. Use POST."),
    { status: 405 }
  );
}
