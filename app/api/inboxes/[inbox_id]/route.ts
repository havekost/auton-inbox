import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifySecretKey, extractBearerToken } from "@/lib/auth";

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

  const { data: inbox, error } = await supabase
    .from("inboxes")
    .select("id, label, message_count, created_at")
    .eq("id", inbox_id)
    .single();

  if (error || !inbox) {
    return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
  }

  const { count: unreadCount } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("inbox_id", inbox_id)
    .is("read_at", null);

  return NextResponse.json({
    inbox_id: inbox.id,
    label: inbox.label,
    message_count: inbox.message_count,
    unread_count: unreadCount ?? 0,
    created_at: inbox.created_at,
  });
}

export async function DELETE(
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

  const { error } = await supabase.from("inboxes").delete().eq("id", inbox_id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete inbox" },
      { status: 500 }
    );
  }

  return NextResponse.json({ deleted: true });
}
