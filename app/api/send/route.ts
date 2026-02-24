import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifySecretKey, extractBearerToken } from "@/lib/auth";
import { generateId } from "@/lib/uuid";

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get("authorization"));
  const senderInboxId = request.headers.get("x-inbox-id");

  if (!token || !senderInboxId) {
    return NextResponse.json(
      {
        error:
          "Authorization: Bearer <secret_key> and X-Inbox-Id headers required",
      },
      { status: 401 }
    );
  }

  const valid = await verifySecretKey(senderInboxId, token);
  if (!valid) {
    return NextResponse.json({ error: "Invalid secret key" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { to_inbox_id, source, topic, auth_key, message_payload } = body as {
    to_inbox_id?: string;
    source?: string;
    topic?: string;
    auth_key?: string;
    message_payload?: unknown;
  };

  if (!to_inbox_id || !source || !topic || !message_payload) {
    return NextResponse.json(
      {
        error:
          "to_inbox_id, source, topic, and message_payload are required",
      },
      { status: 400 }
    );
  }

  // Validate payload size
  const payloadStr = JSON.stringify(message_payload);
  if (payloadStr.length > 100 * 1024) {
    return NextResponse.json(
      { error: "message_payload exceeds 100KB limit" },
      { status: 400 }
    );
  }

  // Verify target inbox exists
  const { data: targetInbox } = await supabase
    .from("inboxes")
    .select("id")
    .eq("id", to_inbox_id)
    .single();

  if (!targetInbox) {
    return NextResponse.json(
      { error: "Target inbox not found" },
      { status: 404 }
    );
  }

  const messageId = generateId();

  const { error } = await supabase.from("messages").insert({
    id: messageId,
    inbox_id: to_inbox_id,
    source,
    topic,
    auth_key: auth_key || null,
    message_payload,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }

  await supabase.rpc("increment_message_count", {
    inbox_id_param: to_inbox_id,
  });

  return NextResponse.json(
    {
      message_id: messageId,
      inbox_id: to_inbox_id,
      created_at: new Date().toISOString(),
    },
    { status: 201 }
  );
}
