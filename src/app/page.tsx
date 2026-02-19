"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4, v7 as uuidv7 } from "uuid";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<{
    id: string;
    name: string;
    publicKey: string;
    privateSecret: string;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Check Inbox state
  const [checkInboxId, setCheckInboxId] = useState("");
  const [checkInboxSecret, setCheckInboxSecret] = useState("");
  const [checkInboxLoading, setCheckInboxLoading] = useState(false);
  const [checkInboxError, setCheckInboxError] = useState<string | null>(null);

  async function createInbox() {
    setLoading(true);
    const id = uuidv4();
    const name = uuidv7();
    const publicKey = uuidv4();
    const privateSecret = uuidv4();

    const { error } = await supabase
      .from("inboxes")
      .insert({ id, name, public_key: publicKey, private_secret: privateSecret });

    if (error) {
      alert("Failed to create inbox: " + error.message);
      setLoading(false);
      return;
    }

    setCredentials({ id, name, publicKey, privateSecret });
    setLoading(false);
  }

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  function goToInbox() {
    if (!credentials) return;
    router.push(`/inbox/${credentials.id}?secret=${credentials.privateSecret}`);
  }

  async function checkInbox() {
    if (!checkInboxId.trim() || !checkInboxSecret.trim()) {
      setCheckInboxError("Please enter both inbox ID and secret key");
      return;
    }

    setCheckInboxLoading(true);
    setCheckInboxError(null);

    const { data } = await supabase
      .from("inboxes")
      .select("*")
      .eq("id", checkInboxId.trim())
      .eq("private_secret", checkInboxSecret.trim())
      .single();

    if (!data) {
      setCheckInboxError("Invalid inbox ID or secret key");
      setCheckInboxLoading(false);
      return;
    }

    setCheckInboxLoading(false);
    router.push(`/inbox/${checkInboxId}?secret=${checkInboxSecret}`);
  }

  if (credentials) {
    const endpointUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/api/inbox/${credentials.id}`
        : "";

    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Inbox Created</h1>
          <p className="text-[var(--muted)] text-sm">
            Save these credentials — the private secret cannot be recovered.
          </p>
        </div>

        <div className="space-y-4">
          <CredentialRow
            label="Inbox Name"
            value={credentials.name}
            onCopy={() => copyText(credentials.name, "name")}
            copied={copied === "name"}
          />
          <CredentialRow
            label="Endpoint URL"
            value={endpointUrl}
            onCopy={() => copyText(endpointUrl, "endpoint")}
            copied={copied === "endpoint"}
          />
          <CredentialRow
            label="Public Key"
            sublabel="Give this to services that send webhooks. They pass it via x-inbox-key header or ?key= query param."
            value={credentials.publicKey}
            onCopy={() => copyText(credentials.publicKey, "public")}
            copied={copied === "public"}
          />
          <CredentialRow
            label="Private Secret"
            sublabel="This is your password to access the inbox. Keep it safe."
            value={credentials.privateSecret}
            onCopy={() => copyText(credentials.privateSecret, "secret")}
            copied={copied === "secret"}
          />
        </div>

        <div className="space-y-3">
          <div className="rounded border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
            <p className="text-xs text-[var(--muted)]">Example curl</p>
            <pre className="text-xs break-all whitespace-pre-wrap text-[var(--accent)]">
{`curl -X POST ${endpointUrl} \\
  -H "Content-Type: application/json" \\
  -H "x-inbox-key: ${credentials.publicKey}" \\
  -d '{"source":"my-service","topic":"test","payload":{"hello":"world"}}'`}
            </pre>
          </div>

          <button
            onClick={goToInbox}
            className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Open Inbox Monitor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Inbox Manager</h1>
        <p className="text-[var(--muted)] text-sm">
          Create a webhook endpoint or access an existing inbox.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Create an Inbox</h2>
            <p className="text-sm text-[var(--muted)]">
              Generate a new webhook endpoint for autonomous AI agents to receive data from external services.
            </p>
          </div>
          <button
            onClick={createInbox}
            disabled={loading}
            className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Inbox"}
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Check Inbox</h2>
            <p className="text-sm text-[var(--muted)]">
              Access an existing inbox with your inbox ID and secret key.
            </p>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Inbox ID"
              value={checkInboxId}
              onChange={(e) => setCheckInboxId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && checkInbox()}
              className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
            <input
              type="password"
              placeholder="Secret Key"
              value={checkInboxSecret}
              onChange={(e) => setCheckInboxSecret(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && checkInbox()}
              className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
            {checkInboxError && <p className="text-sm text-red-400">{checkInboxError}</p>}
            <button
              onClick={checkInbox}
              disabled={checkInboxLoading || !checkInboxId.trim() || !checkInboxSecret.trim()}
              className="w-full rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {checkInboxLoading ? "Checking..." : "Access Inbox"}
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border)] pt-6 space-y-2">
        <h2 className="text-sm font-semibold">How it works</h2>
        <ol className="text-sm text-[var(--muted)] space-y-1 list-decimal list-inside">
          <li>Click create to get an inbox with a public key and private secret</li>
          <li>
            Give the endpoint URL + public key to services that send webhooks
          </li>
          <li>
            Use your private secret to log in and watch payloads arrive in
            real-time
          </li>
        </ol>
      </div>
    </div>
  );
}

function CredentialRow({
  label,
  sublabel,
  value,
  onCopy,
  copied,
}: {
  label: string;
  sublabel?: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="rounded border border-[var(--border)] bg-[var(--surface)] p-3 space-y-1">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      {sublabel && (
        <p className="text-xs text-[var(--muted)] opacity-70">{sublabel}</p>
      )}
      <div className="flex items-center gap-2">
        <code className="flex-1 text-sm break-all text-[var(--accent)]">
          {value}
        </code>
        <button
          onClick={onCopy}
          className="shrink-0 rounded border border-[var(--border)] px-3 py-1 text-xs hover:bg-[var(--border)]"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
