"use client";

import { useState } from "react";

interface InboxCredentials {
  inbox_id: string;
  secret_key: string;
  created_at: string;
}

export default function CreateInbox() {
  const [creating, setCreating] = useState(false);
  const [credentials, setCredentials] = useState<InboxCredentials | null>(null);
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCreate = async () => {
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/inboxes", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create inbox");
      const data = await res.json();
      setCredentials(data);
    } catch {
      setError("Failed to create inbox. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (credentials) {
    return (
      <div className="border border-gray-700 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-green-400">
          Inbox Created
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Inbox ID
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-200 font-mono">
                {credentials.inbox_id}
              </code>
              <button
                onClick={() =>
                  copyToClipboard(credentials.inbox_id, "inbox_id")
                }
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm rounded cursor-pointer"
              >
                {copiedField === "inbox_id" ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Secret Key
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-gray-900 border border-red-700 rounded text-sm text-gray-200 font-mono">
                {credentials.secret_key}
              </code>
              <button
                onClick={() =>
                  copyToClipboard(credentials.secret_key, "secret_key")
                }
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm rounded cursor-pointer"
              >
                {copiedField === "secret_key" ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>
        <div className="p-3 bg-red-950 border border-red-800 rounded text-sm text-red-300">
          Store your secret_key now. It will never be shown again.
        </div>
        <a
          href={`/inbox/${credentials.inbox_id}`}
          className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
        >
          Go to Inbox
        </a>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleCreate}
        disabled={creating}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
      >
        {creating ? "Creating..." : "Create New Inbox"}
      </button>
      {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
    </div>
  );
}
