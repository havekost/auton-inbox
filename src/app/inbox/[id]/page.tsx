"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import type { Inbox, Message } from "@/lib/types";

export default function InboxPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const endpointUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/inbox/${id}`
      : "";

  useEffect(() => {
    // Fetch inbox metadata
    supabase
      .from("inboxes")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setInbox(data);
      });

    // Fetch existing messages
    supabase
      .from("messages")
      .select("*")
      .eq("inbox_id", id)
      .order("received_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setMessages(data || []);
        setLoading(false);
      });

    // Subscribe to new messages in real-time
    const channel = supabase
      .channel(`inbox-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `inbox_id=eq.${id}`,
        },
        (payload) => {
          setMessages((prev) => [payload.new as Message, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  function copyUrl() {
    navigator.clipboard.writeText(endpointUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <p className="text-[var(--muted)]">Loading...</p>;
  }

  if (!inbox) {
    return <p className="text-red-400">Inbox not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold">
          {inbox.name || "Unnamed Inbox"}
        </h1>
        <p className="text-xs text-[var(--muted)]">
          Created {new Date(inbox.created_at).toLocaleString()}
        </p>
      </div>

      <div className="rounded border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
        <p className="text-xs text-[var(--muted)]">Endpoint URL</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm break-all text-[var(--accent)]">
            {endpointUrl}
          </code>
          <button
            onClick={copyUrl}
            className="shrink-0 rounded border border-[var(--border)] px-3 py-1 text-xs hover:bg-[var(--border)]"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="text-xs text-[var(--muted)]">
          POST any JSON payload to this URL and it will appear below in
          real-time.
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">
          Messages ({messages.length})
        </h2>

        {messages.length === 0 ? (
          <div className="rounded border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted)]">
            No messages yet. POST to the endpoint URL above to see them appear
            here.
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="rounded border border-[var(--border)] bg-[var(--surface)] p-3 space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span className="font-medium text-[var(--fg)]">
                    {msg.method}
                  </span>
                  <span>
                    {new Date(msg.received_at).toLocaleString()}
                  </span>
                </div>
                <pre className="overflow-x-auto text-xs leading-relaxed whitespace-pre-wrap">
                  {JSON.stringify(msg.body, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
