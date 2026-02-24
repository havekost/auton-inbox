"use client";

import { useState } from "react";

interface SendMessageFormProps {
  inboxId: string;
  secretKey: string;
  onSent: () => void;
}

export default function SendMessageForm({
  inboxId,
  secretKey,
  onSent,
}: SendMessageFormProps) {
  const [toInboxId, setToInboxId] = useState("");
  const [topic, setTopic] = useState("");
  const [payload, setPayload] = useState('{\n  "content": ""\n}');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    let parsedPayload;
    try {
      parsedPayload = JSON.parse(payload);
    } catch {
      setError("Invalid JSON in message payload");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secretKey}`,
          "X-Inbox-Id": inboxId,
        },
        body: JSON.stringify({
          to_inbox_id: toInboxId,
          source: inboxId,
          topic,
          message_payload: parsedPayload,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }

      setSuccess("Message sent");
      setToInboxId("");
      setTopic("");
      setPayload('{\n  "content": ""\n}');
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs text-gray-400 mb-1">
          To Inbox ID
        </label>
        <input
          type="text"
          value={toInboxId}
          onChange={(e) => setToInboxId(e.target.value)}
          required
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500"
          placeholder="recipient inbox UUID"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Topic</label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500"
          placeholder="e.g. response, agent-handoff"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">
          Message Payload (JSON)
        </label>
        <textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          required
          rows={5}
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-200 font-mono focus:outline-none focus:border-blue-500"
        />
      </div>
      {error && <div className="text-sm text-red-400">{error}</div>}
      {success && <div className="text-sm text-green-400">{success}</div>}
      <button
        type="submit"
        disabled={sending}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded disabled:opacity-50 cursor-pointer"
      >
        {sending ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
