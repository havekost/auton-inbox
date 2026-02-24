"use client";

import { useState } from "react";

interface Message {
  message_id: string;
  source: string;
  topic: string;
  auth_key?: string | null;
  message_payload: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
}

interface MessageCardProps {
  message: Message;
  onDelete: (messageId: string) => void;
}

export default function MessageCard({ message, onDelete }: MessageCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    onDelete(message.message_id);
  };

  return (
    <div
      className={`border rounded-lg p-4 ${
        message.read_at
          ? "border-gray-700 bg-gray-900/50"
          : "border-blue-800 bg-gray-900"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-mono font-semibold text-blue-400">
              {message.source}
            </span>
            <span className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded-full">
              {message.topic}
            </span>
            {!message.read_at && (
              <span className="text-xs px-2 py-0.5 bg-blue-900 text-blue-300 rounded-full">
                unread
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {new Date(message.created_at).toLocaleString()}
            {message.auth_key && (
              <span className="ml-2 text-yellow-600">
                auth: {message.auth_key}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded cursor-pointer"
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs px-2 py-1 bg-red-900/50 hover:bg-red-900 text-red-400 rounded cursor-pointer disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
      {expanded && (
        <pre className="mt-3 p-3 bg-gray-950 border border-gray-800 rounded text-xs text-gray-300 overflow-x-auto">
          {JSON.stringify(message.message_payload, null, 2)}
        </pre>
      )}
    </div>
  );
}
