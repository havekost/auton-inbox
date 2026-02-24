"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import MessageList from "@/components/MessageList";
import SendMessageForm from "@/components/SendMessageForm";

interface Message {
  message_id: string;
  source: string;
  topic: string;
  auth_key?: string | null;
  message_payload: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
}

interface InboxInfo {
  inbox_id: string;
  label: string | null;
  message_count: number;
  unread_count: number;
  created_at: string;
}

export default function InboxViewPage() {
  const params = useParams();
  const inboxId = params.inbox_id as string;
  const [secretKey, setSecretKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");

  const [inboxInfo, setInboxInfo] = useState<InboxInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showSendPanel, setShowSendPanel] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const fetchMessages = useCallback(
    async (sk: string, searchQuery?: string) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(
        `/api/inboxes/${inboxId}/messages?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${sk}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        setTotal(data.total);
      }
      setLoading(false);
    },
    [inboxId]
  );

  const fetchInboxInfo = useCallback(
    async (sk: string) => {
      const res = await fetch(`/api/inboxes/${inboxId}`, {
        headers: { Authorization: `Bearer ${sk}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInboxInfo(data);
      }
    },
    [inboxId]
  );

  useEffect(() => {
    const storedKey = sessionStorage.getItem(`sk_${inboxId}`);
    if (storedKey) {
      setSecretKey(storedKey);
      setAuthenticated(true);
      fetchMessages(storedKey);
      fetchInboxInfo(storedKey);
    }
  }, [inboxId, fetchMessages, fetchInboxInfo]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    const res = await fetch(`/api/inboxes/${inboxId}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });

    if (res.ok) {
      sessionStorage.setItem(`sk_${inboxId}`, secretKey);
      setAuthenticated(true);
      const data = await res.json();
      setInboxInfo(data);
      fetchMessages(secretKey);
    } else {
      setAuthError("Invalid secret key");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMessages(secretKey, search);
  };

  const handleDelete = async (messageId: string) => {
    await fetch(`/api/inboxes/${inboxId}/messages/${messageId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    fetchMessages(secretKey, search);
    fetchInboxInfo(secretKey);
  };

  const handleMarkAllRead = async () => {
    await fetch(`/api/inboxes/${inboxId}/messages/read`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify({ message_ids: "all" }),
    });
    fetchMessages(secretKey, search);
    fetchInboxInfo(secretKey);
  };

  const copyInboxId = () => {
    navigator.clipboard.writeText(inboxId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-2">Authenticate</h1>
        <p className="text-sm text-gray-400 mb-4">
          Enter the secret key for inbox{" "}
          <code className="text-blue-400">{inboxId}</code>
        </p>
        <form onSubmit={handleAuth} className="space-y-3">
          <input
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500"
            placeholder="secret key"
          />
          {authError && (
            <div className="text-sm text-red-400">{authError}</div>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded cursor-pointer"
          >
            Unlock Inbox
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Inbox</h1>
          <div className="flex items-center gap-2">
            <code className="text-sm text-gray-400 font-mono">{inboxId}</code>
            <button
              onClick={copyInboxId}
              className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer"
            >
              {copiedId ? "Copied!" : "Copy"}
            </button>
          </div>
          {inboxInfo && (
            <div className="flex gap-4 mt-2 text-sm">
              <span className="text-gray-400">
                {inboxInfo.message_count} messages
              </span>
              <span className="text-blue-400">
                {inboxInfo.unread_count} unread
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleMarkAllRead}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded cursor-pointer"
          >
            Mark All Read
          </button>
          <button
            onClick={() => setShowSendPanel(!showSendPanel)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded cursor-pointer"
          >
            {showSendPanel ? "Hide Send" : "Send Message"}
          </button>
        </div>
      </div>

      {/* Send Panel */}
      {showSendPanel && (
        <div className="border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-3">
            Send Message to Another Inbox
          </h2>
          <SendMessageForm
            inboxId={inboxId}
            secretKey={secretKey}
            onSent={() => {
              fetchMessages(secretKey, search);
              fetchInboxInfo(secretKey);
            }}
          />
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500"
          placeholder="Search by source, topic, or content..."
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded cursor-pointer"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              fetchMessages(secretKey);
            }}
            className="px-3 py-2 text-gray-500 hover:text-gray-300 text-sm cursor-pointer"
          >
            Clear
          </button>
        )}
      </form>

      {/* Messages */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="text-xs text-gray-500">{total} total messages</div>
          <MessageList messages={messages} onDelete={handleDelete} />
        </>
      )}
    </div>
  );
}
