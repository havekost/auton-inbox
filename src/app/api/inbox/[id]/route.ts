import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Verify inbox exists
  const { data: inbox } = await supabase
    .from("inboxes")
    .select("id")
    .eq("id", id)
    .single();

  if (!inbox) {
    return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
  }

  // Parse body — accept JSON or raw text
  let body: unknown;
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }
  } else {
    const text = await request.text();
    body = { raw: text };
  }

  // Extract a subset of useful headers
  const headers: Record<string, string> = {};
  for (const key of [
    "content-type",
    "user-agent",
    "x-request-id",
    "x-forwarded-for",
  ]) {
    const val = request.headers.get(key);
    if (val) headers[key] = val;
  }

  const { error } = await supabase.from("messages").insert({
    inbox_id: id,
    headers,
    body,
    method: "POST",
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to store message" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

// Also support GET for simple pings/health checks
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: inbox } = await supabase
    .from("inboxes")
    .select("id, name, created_at")
    .eq("id", id)
    .single();

  if (!inbox) {
    return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
  }

  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("inbox_id", id);

  return NextResponse.json({ inbox, message_count: count });
}
