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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

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
    setLoading(false);
  }

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
