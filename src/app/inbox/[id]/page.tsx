"use client";

import { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Inbox, Message } from "@/lib/types";

export default function InboxPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();

  const [secret, setSecret] = useState(searchParams.get("secret") || "");
  const [authenticated, setAuthenticated] = useState(false);
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Filter states
  const [filterTopic, setFilterTopic] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterRef, setFilterRef] = useState("");

  // Send message form states
  const [sendSource, setSendSource] = useState("");
  const [sendTopic, setSendTopic] = useState("");
  const [sendRef, setSendRef] = useState("");
  const [sendPayload, setSendPayload] = useState("");

  const endpointUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/inbox/${id}`
      : "";

  // Auto-authenticate if secret is in URL
  useEffect(() => {
    const urlSecret = searchParams.get("secret");
    if (urlSecret) {
      authenticate(urlSecret);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function authenticate(secretValue?: string) {
    const s = secretValue || secret;
    if (!s.trim()) return;

    setLoading(true);
    setError(null);

    const { data } = await supabase
      .from("inboxes")
      .select("*")
      .eq("id", id)
      .eq("private_secret", s.trim())
      .single();

    if (!data) {
      setError("Invalid secret or inbox not found.");
      setLoading(false);
      return;
    }

    setInbox(data);
    setAuthenticated(true);

    // Fetch existing messages
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("inbox_id", id)
      .order("received_at", { ascending: false })
      .limit(100);

    setMessages(msgs || []);
    applyFilters(msgs || []);
    setLoading(false);
  }

  function applyFilters(msgs: Message[]) {
    let filtered = msgs;

    if (filterTopic) {
      filtered = filtered.filter((msg) => {
        const body = msg.body as { topic?: string };
        return body.topic?.includes(filterTopic);
      });
    }

    if (filterSource) {
      filtered = filtered.filter((msg) => {
        const body = msg.body as { source?: string };
        return body.source?.includes(filterSource);
      });
    }

    if (filterRef) {
      filtered = filtered.filter((msg) => {
        const body = msg.body as { ref?: string };
        return body.ref?.includes(filterRef);
      });
    }

    setFilteredMessages(filtered);
  }

  async function sendMessage() {
    if (!sendSource.trim() || !sendTopic.trim()) {
      setSendError("Source and topic are required");
      return;
    }

    setSendingMessage(true);
    setSendError(null);
    setSendSuccess(false);

    try {
      const body: Record<string, unknown> = {
        source: sendSource,
        topic: sendTopic,
      };

      if (sendRef.trim()) {
        body.ref = sendRef;
      }

      if (sendPayload.trim()) {
        try {
          body.payload = JSON.parse(sendPayload);
        } catch {
          setSendError("Invalid JSON in payload");
          setSendingMessage(false);
          return;
        }
      }

      const response = await fetch(`/api/inbox/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-inbox-key": inbox?.public_key || "",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        setSendError(data.error || "Failed to send message");
        setSendingMessage(false);
        return;
      }

      setSendSuccess(true);
      setSendSource("");
      setSendTopic("");
      setSendRef("");
      setSendPayload("");

      setTimeout(() => setSendSuccess(false), 3000);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  }

  // Apply filters when filter values change
  useEffect(() => {
    applyFilters(messages);
  }, [filterTopic, filterSource, filterRef, messages]);

  // Subscribe to realtime messages once authenticated
  useEffect(() => {
    if (!authenticated) return;

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
  }, [id, authenticated]);

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  // Login screen
  if (!authenticated) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-xl font-bold">Inbox Login</h1>
          <p className="text-sm text-[var(--muted)]">
            Enter your private secret to access this inbox.
          </p>
        </div>

        <div className="space-y-3">
          <input
            type="password"
            placeholder="Private secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && authenticate()}
            className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            onClick={() => authenticate()}
            disabled={loading || !secret.trim()}
            className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Login"}
          </button>
        </div>
      </div>
    );
  }

  if (!inbox) {
    return <p className="text-[var(--muted)]">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold font-mono">{inbox.name}</h1>
        <p className="text-xs text-[var(--muted)]">
          Created {new Date(inbox.created_at).toLocaleString()}
        </p>
      </div>

      <div className="rounded border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
        <div className="space-y-1">
          <p className="text-xs text-[var(--muted)]">Endpoint URL</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm break-all text-[var(--accent)]">
              {endpointUrl}
            </code>
            <button
              onClick={() => copyText(endpointUrl, "endpoint")}
              className="shrink-0 rounded border border-[var(--border)] px-3 py-1 text-xs hover:bg-[var(--border)]"
            >
              {copied === "endpoint" ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-[var(--muted)]">Public Key</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm break-all text-[var(--accent)]">
              {inbox.public_key}
            </code>
            <button
              onClick={() => copyText(inbox.public_key, "public")}
              className="shrink-0 rounded border border-[var(--border)] px-3 py-1 text-xs hover:bg-[var(--border)]"
            >
              {copied === "public" ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
        <p className="text-xs text-[var(--muted)]">
          POST JSON with <code className="text-[var(--accent)]">x-inbox-key: {inbox.public_key}</code> header.
          Body: <code className="text-[var(--accent)]">{`{"source":"...","topic":"...","ref?":"...","payload?":{}}`}</code>
        </p>
      </div>

      <div className="rounded border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
        <h2 className="text-sm font-semibold">Send a Message</h2>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Source (e.g., github, slack/agent-bob)"
            value={sendSource}
            onChange={(e) => setSendSource(e.target.value)}
            disabled={sendingMessage}
            className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] disabled:opacity-50"
          />
          <input
            type="text"
            placeholder="Topic (e.g., message, pr.merged)"
            value={sendTopic}
            onChange={(e) => setSendTopic(e.target.value)}
            disabled={sendingMessage}
            className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] disabled:opacity-50"
          />
          <input
            type="text"
            placeholder="Ref/Correlation ID (optional)"
            value={sendRef}
            onChange={(e) => setSendRef(e.target.value)}
            disabled={sendingMessage}
            className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] disabled:opacity-50"
          />
          <textarea
            placeholder="Payload JSON (optional)"
            value={sendPayload}
            onChange={(e) => setSendPayload(e.target.value)}
            disabled={sendingMessage}
            rows={3}
            className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] disabled:opacity-50 font-mono"
          />
          {sendError && <p className="text-sm text-red-400">{sendError}</p>}
          {sendSuccess && <p className="text-sm text-green-400">Message sent successfully!</p>}
          <button
            onClick={sendMessage}
            disabled={sendingMessage || !sendSource.trim() || !sendTopic.trim()}
            className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {sendingMessage ? "Sending..." : "Send Message"}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            Messages ({filteredMessages.length} of {messages.length})
          </h2>
          {(filterTopic || filterSource || filterRef) && (
            <button
              onClick={() => {
                setFilterTopic("");
                setFilterSource("");
                setFilterRef("");
              }}
              className="text-xs text-[var(--accent)] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="rounded border border-[var(--border)] bg-[var(--surface)] p-3 space-y-2">
          <p className="text-xs text-[var(--muted)]">Filter messages:</p>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Topic"
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              className="flex-1 min-w-[120px] rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs outline-none focus:border-[var(--accent)]"
            />
            <input
              type="text"
              placeholder="Source"
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="flex-1 min-w-[120px] rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs outline-none focus:border-[var(--accent)]"
            />
            <input
              type="text"
              placeholder="Ref"
              value={filterRef}
              onChange={(e) => setFilterRef(e.target.value)}
              className="flex-1 min-w-[120px] rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {filteredMessages.length === 0 ? (
          <div className="rounded border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted)]">
            {messages.length === 0
              ? "No messages yet. POST to the endpoint URL above to see them appear here."
              : "No messages match the selected filters."}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((msg) => {
              const body = msg.body as { source?: string; topic?: string; ref?: string; payload?: unknown };
              return (
                <div
                  key={msg.id}
                  className="rounded border border-[var(--border)] bg-[var(--surface)] p-3 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--fg)]">
                        {body.source || msg.method}
                      </span>
                      {body.topic && (
                        <span className="rounded bg-[var(--border)] px-1.5 py-0.5 text-[10px]">
                          {body.topic}
                        </span>
                      )}
                      {body.ref && (
                        <span className="text-[10px] opacity-60">
                          ref:{body.ref}
                        </span>
                      )}
                    </div>
                    <span>
                      {new Date(msg.received_at).toLocaleString()}
                    </span>
                  </div>
                  {body.payload !== undefined && (
                    <pre className="overflow-x-auto text-xs leading-relaxed whitespace-pre-wrap">
                      {typeof body.payload === "string"
                        ? body.payload
                        : JSON.stringify(body.payload, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
