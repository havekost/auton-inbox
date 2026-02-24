import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifySecretKey, extractBearerToken } from "@/lib/auth";
import { generateId } from "@/lib/uuid";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inbox_id: string }> }
) {
  const { inbox_id } = await params;

  // Verify inbox exists
  const { data: inbox } = await supabase
    .from("inboxes")
    .select("id")
    .eq("id", inbox_id)
    .single();

  if (!inbox) {
    return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
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

  const { source, topic, auth_key, message_payload } = body as {
    source?: string;
    topic?: string;
    auth_key?: string;
    message_payload?: unknown;
  };

  if (!source || !topic || !message_payload) {
    return NextResponse.json(
      { error: "source, topic, and message_payload are required" },
      { status: 400 }
    );
  }

  // Validate message_payload size (max 100KB)
  const payloadStr = JSON.stringify(message_payload);
  if (payloadStr.length > 100 * 1024) {
    return NextResponse.json(
      { error: "message_payload exceeds 100KB limit" },
      { status: 400 }
    );
  }

  const messageId = generateId();

  const { error } = await supabase.from("messages").insert({
    id: messageId,
    inbox_id,
    source,
    topic,
    auth_key: auth_key || null,
    message_payload,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }

  // Increment message_count
  await supabase.rpc("increment_message_count", { inbox_id_param: inbox_id });

  return NextResponse.json(
    {
      message_id: messageId,
      inbox_id,
      created_at: new Date().toISOString(),
    },
    { status: 201 }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ inbox_id: string }> }
) {
  const { inbox_id } = await params;
  const token = extractBearerToken(request.headers.get("authorization"));

  if (!token) {
    return NextResponse.json(
      { error: "Authorization header with Bearer token required" },
      { status: 401 }
    );
  }

  const valid = await verifySecretKey(inbox_id, token);
  if (!valid) {
    return NextResponse.json({ error: "Invalid secret key" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");
  const unreadOnly = searchParams.get("unread_only") === "true";
  const source = searchParams.get("source");
  const topic = searchParams.get("topic");
  const search = searchParams.get("search");
  const since = searchParams.get("since");

  let query = supabase
    .from("messages")
    .select("id, source, topic, auth_key, message_payload, created_at, read_at", {
      count: "exact",
    })
    .eq("inbox_id", inbox_id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (unreadOnly) {
    query = query.is("read_at", null);
  }
  if (source) {
    query = query.eq("source", source);
  }
  if (topic) {
    query = query.eq("topic", topic);
  }
  if (since) {
    query = query.gt("created_at", since);
  }
  if (search) {
    query = query.or(
      `source.ilike.%${search}%,topic.ilike.%${search}%,message_payload::text.ilike.%${search}%`
    );
  }

  const { data: messages, count, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to retrieve messages" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    inbox_id,
    messages: (messages || []).map((m) => ({
      message_id: m.id,
      source: m.source,
      topic: m.topic,
      auth_key: m.auth_key,
      message_payload: m.message_payload,
      created_at: m.created_at,
      read_at: m.read_at,
    })),
    total: count ?? 0,
    limit,
    offset,
  });
}
