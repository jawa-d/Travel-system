import { randomBytes } from "node:crypto";

function secureAlphaNumeric(length: number) {
  let value = "";
  while (value.length < length) {
    value += randomBytes(length).toString("base64url").replace(/[^A-Za-z0-9]/g, "");
  }
  return value.slice(0, length).toUpperCase();
}

export function createSequence(prefix: string) {
  const safePrefix = prefix.replace(/[^A-Za-z0-9-]/g, "").toUpperCase() || "SEQ";
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `${safePrefix}-${stamp}-${secureAlphaNumeric(10)}`;
}
