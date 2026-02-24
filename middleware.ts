import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter (per-instance; resets on cold start)
// For production, use Upstash Redis or similar distributed store
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const ip = getClientIp(request);

  // Rate limit POST /api/inboxes (create inbox) — 10/min per IP
  if (pathname === "/api/inboxes" && method === "POST") {
    const { allowed, remaining } = rateLimit(
      `create:${ip}`,
      10,
      60 * 1000
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Max 10 inbox creations per minute." },
        {
          status: 429,
          headers: { "X-RateLimit-Remaining": String(remaining) },
        }
      );
    }
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    return response;
  }

  // Rate limit POST /api/inboxes/:id/messages (post message) — 100/min per IP
  const messagePostMatch =
    pathname.match(/^\/api\/inboxes\/[^/]+\/messages$/) && method === "POST";
  if (messagePostMatch) {
    const { allowed, remaining } = rateLimit(
      `message:${ip}`,
      100,
      60 * 1000
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Max 100 messages per minute." },
        {
          status: 429,
          headers: { "X-RateLimit-Remaining": String(remaining) },
        }
      );
    }
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
