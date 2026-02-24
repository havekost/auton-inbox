import { uuidv7 } from "uuidv7";

export function generateId(): string {
  return uuidv7();
}

export function generateSecretKey(): string {
  return crypto.randomUUID();
}
