import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

function configuredKeys() {
  return (process.env.PUBLIC_API_KEYS ?? process.env.PUBLIC_MOTOR_API_KEYS ?? "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
}

function safeEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function apiKeyFingerprint(apiKey: string) {
  return createHash("sha256").update(apiKey).digest("hex").slice(0, 16);
}

export function requirePublicApiKey(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key")?.trim();
  const keys = configuredKeys();
  if (!apiKey || keys.length === 0 || !keys.some((key) => safeEquals(apiKey, key))) {
    return {
      ok: false as const,
      response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    };
  }

  return {
    ok: true as const,
    apiKeyFingerprint: apiKeyFingerprint(apiKey)
  };
}
