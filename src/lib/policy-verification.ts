import QRCode from "qrcode";
import { createHmac, timingSafeEqual } from "node:crypto";

const QR_OPTIONS = {
  errorCorrectionLevel: "H",
  margin: 2,
  width: 512,
  color: {
    dark: "#293545",
    light: "#FFFFFF"
  }
} as const;

export function getAppBaseUrl() {
  return (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function getVerificationSecret() {
  return process.env.POLICY_VERIFICATION_SECRET || process.env.NEXTAUTH_SECRET || "trinsu-local-policy-verification";
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
