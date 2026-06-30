import QRCode from "qrcode";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const QR_OPTIONS = {
  errorCorrectionLevel: "H",
  margin: 2,
  width: 512,
  color: {
    dark: "#293545",
    light: "#FFFFFF"
  }
} as const;

let developmentVerificationSecret: string | null = null;
let warnedAboutMissingVerificationSecret = false;

export function getAppBaseUrl() {
  return (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function getVerificationSecret() {
  const secret = process.env.POLICY_VERIFICATION_SECRET || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("Policy verification secret is not configured");
  }

  if (!warnedAboutMissingVerificationSecret) {
    warnedAboutMissingVerificationSecret = true;
    console.warn("[security] POLICY_VERIFICATION_SECRET is missing; using an ephemeral development secret");
  }

  developmentVerificationSecret ??= randomBytes(32).toString("base64url");
  return developmentVerificationSecret;
}

export function createPolicyVerificationToken(policyNumber: string) {
  return createHmac("sha256", getVerificationSecret())
    .update(policyNumber)
    .digest("base64url")
    .slice(0, 32);
}

export function isValidPolicyVerificationToken(policyNumber: string, token?: string | null) {
  if (!token) return false;
  const expected = createPolicyVerificationToken(policyNumber);
  const expectedBuffer = Buffer.from(expected);
  const tokenBuffer = Buffer.from(token);
  return expectedBuffer.length === tokenBuffer.length && timingSafeEqual(expectedBuffer, tokenBuffer);
}

export function getPolicyVerificationUrl(policyNumber: string) {
  const url = new URL(`${getAppBaseUrl()}/verify/${encodeURIComponent(policyNumber)}`);
  url.searchParams.set("token", createPolicyVerificationToken(policyNumber));
  return url.toString();
}

export async function createPolicyVerificationQr(policyNumber: string) {
  return QRCode.toDataURL(getPolicyVerificationUrl(policyNumber), QR_OPTIONS);
}
