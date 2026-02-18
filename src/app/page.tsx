"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function createInbox() {
    setLoading(true);
    const id = uuidv4();
    const { error } = await supabase
      .from("inboxes")
      .insert({ id, name: name.trim() || null });

    if (error) {
      alert("Failed to create inbox: " + error.message);
      setLoading(false);
      return;
    }

    router.push(`/inbox/${id}`);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Create an Inbox</h1>
        <p className="text-[var(--muted)] text-sm">
          Create a webhook endpoint that autonomous AI agents can use to receive
          data from external services.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm text-[var(--muted)] mb-1"
          >
            Inbox name (optional)
          </label>
          <input
            id="name"
            type="text"
            placeholder="e.g. github-notifications"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </div>

        <button
          onClick={createInbox}
          disabled={loading}
          className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Inbox"}
        </button>
      </div>

      <div className="border-t border-[var(--border)] pt-6 space-y-2">
        <h2 className="text-sm font-semibold">How it works</h2>
        <ol className="text-sm text-[var(--muted)] space-y-1 list-decimal list-inside">
          <li>Create an inbox to get a unique endpoint URL</li>
          <li>
            Give the URL to any service that sends webhooks (or use the MCP
            server)
          </li>
          <li>
            Watch incoming payloads appear in real-time on the monitor page
          </li>
        </ol>
      </div>
    </div>
  );
}
