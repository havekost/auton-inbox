"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CreateInbox from "@/components/CreateInbox";

export default function InboxPage() {
  const router = useRouter();
  const [accessInboxId, setAccessInboxId] = useState("");
  const [accessSecretKey, setAccessSecretKey] = useState("");
  const [error, setError] = useState("");

  const handleAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessInboxId.trim() || !accessSecretKey.trim()) {
      setError("Both fields are required");
      return;
    }
    sessionStorage.setItem(`sk_${accessInboxId}`, accessSecretKey);
    router.push(`/inbox/${accessInboxId}`);
  };

  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-2xl font-bold mb-6">Inbox</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Create New */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Create New Inbox</h2>
            <CreateInbox />
          </div>

          {/* Access Existing */}
          <div>
            <h2 className="text-lg font-semibold mb-4">
              Access Existing Inbox
            </h2>
            <form onSubmit={handleAccess} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Inbox ID
                </label>
                <input
                  type="text"
                  value={accessInboxId}
                  onChange={(e) => setAccessInboxId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                  placeholder="inbox UUID"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Secret Key
                </label>
                <input
                  type="password"
                  value={accessSecretKey}
                  onChange={(e) => setAccessSecretKey(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                  placeholder="secret key"
                />
              </div>
              {error && (
                <div className="text-sm text-red-400">{error}</div>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded cursor-pointer"
              >
                Access Inbox
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
