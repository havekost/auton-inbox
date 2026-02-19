import { z } from "zod";

export interface Inbox {
  id: string;
  name: string;
  public_key: string;
  private_secret: string;
  created_at: string;
}

export interface Message {
  id: string;
  inbox_id: string;
  headers: Record<string, string> | null;
  body: InboxPostBody;
  method: string;
  received_at: string;
}

// Universal POST body schema for the inbox.
// Designed for machine-to-machine communication between AI agents and services.
export const inboxPostSchema = z.object({
  // Origin identifier: service name, agent ID, or hierarchical path.
  // Examples: "github", "slack/agent-bob", "agent-xyz"
  source: z.string().min(1),
  // Machine-parseable message type for filtering and routing.
  // Examples: "message", "pr.merged", "task.complete"
  topic: z.string().min(1),
  // Optional correlation/thread ID for linking related messages.
  ref: z.string().optional(),
  // Arbitrary structured data. Schema varies by source and topic.
  payload: z.unknown().optional(),
});

export type InboxPostBody = z.infer<typeof inboxPostSchema>;
