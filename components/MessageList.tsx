"use client";

import MessageCard from "./MessageCard";

interface Message {
  message_id: string;
  source: string;
  topic: string;
  auth_key?: string | null;
  message_payload: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
}

interface MessageListProps {
  messages: Message[];
  onDelete: (messageId: string) => void;
}

export default function MessageList({ messages, onDelete }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No messages found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <MessageCard key={msg.message_id} message={msg} onDelete={onDelete} />
      ))}
    </div>
  );
}
