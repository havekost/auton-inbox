import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifySecretKey, extractBearerToken } from "@/lib/auth";

export async function PATCH(
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { message_ids } = body as { message_ids?: string[] | string };

  if (!message_ids) {
    return NextResponse.json(
      { error: "message_ids is required (array of IDs or \"all\")" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  let query = supabase
    .from("messages")
    .update({ read_at: now })
    .eq("inbox_id", inbox_id)
    .is("read_at", null);

  if (message_ids !== "all") {
    if (!Array.isArray(message_ids)) {
      return NextResponse.json(
        { error: "message_ids must be an array of IDs or \"all\"" },
        { status: 400 }
      );
    }
    query = query.in("id", message_ids);
  }

  const { data, error } = await query.select("id");

  if (error) {
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }

  return NextResponse.json({ updated: data?.length ?? 0 });
}
