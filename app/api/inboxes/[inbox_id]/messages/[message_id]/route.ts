import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifySecretKey, extractBearerToken } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ inbox_id: string; message_id: string }> }
) {
  const { inbox_id, message_id } = await params;
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

  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", message_id)
    .eq("inbox_id", inbox_id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }

  // Decrement message_count
  await supabase.rpc("decrement_message_count", { inbox_id_param: inbox_id });

  return NextResponse.json({ deleted: true });
}
