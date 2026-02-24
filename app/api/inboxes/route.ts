import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateId, generateSecretKey } from "@/lib/uuid";
import { hashSecretKey } from "@/lib/auth";

export async function POST() {
  const inboxId = generateId();
  const secretKey = generateSecretKey();
  const secretKeyHash = await hashSecretKey(secretKey);

  const { error } = await supabase.from("inboxes").insert({
    id: inboxId,
    secret_key_hash: secretKeyHash,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to create inbox" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      inbox_id: inboxId,
      secret_key: secretKey,
      warning: "Store your secret_key now. It will never be shown again.",
      created_at: new Date().toISOString(),
    },
    { status: 201 }
  );
}
