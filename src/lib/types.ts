export interface Inbox {
  id: string;
  name: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  inbox_id: string;
  headers: Record<string, string> | null;
  body: unknown;
  method: string;
  received_at: string;
}
