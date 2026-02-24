import bcrypt from "bcryptjs";
import { supabase } from "./supabase";

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "10", 10);

export async function hashSecretKey(secretKey: string): Promise<string> {
  return bcrypt.hash(secretKey, BCRYPT_ROUNDS);
}

export async function verifySecretKey(
  inboxId: string,
  secretKey: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("inboxes")
    .select("secret_key_hash")
    .eq("id", inboxId)
    .single();

  if (error || !data) return false;

  return bcrypt.compare(secretKey, data.secret_key_hash);
}

export function extractBearerToken(
  authHeader: string | null
): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}
