import { Role } from "@prisma/client";

export type DemoAuditLog = {
  id: string;
  user: { name: string } | null;
  role: Role | null;
  action: string;
  entity: string;
  entityId: string | null;
  ipAddress: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

const now = Date.now();

const logs: DemoAuditLog[] = [
  {
    id: "demo-audit-1",
    user: { name: "مدير تجريبي" },
    role: Role.SUPER_ADMIN,
    action: "USER_LOGIN",
    entity: "User",
    entityId: "direct-access-user",
    ipAddress: "127.0.0.1",
    metadata: { method: "direct-access" },
    createdAt: new Date(now - 5 * 60 * 1000)
  },
  {
    id: "demo-audit-2",
    user: { name: "مدير تجريبي" },
    role: Role.SUPER_ADMIN,
    action: "POLICY_CREATED",
    entity: "Policy",
    entityId: "demo-policy-1",
    ipAddress: "127.0.0.1",
    metadata: { policyNumber: "TRI-DEMO-0001" },
    createdAt: new Date(now - 35 * 60 * 1000)
  },
  {
    id: "demo-audit-3",
    user: { name: "مدير تجريبي" },
    role: Role.ADMIN,
    action: "CLAIM_CREATED",
    entity: "Claim",
    entityId: "demo-claim-1",
    ipAddress: "192.168.100.20",
    metadata: { claimNumber: "CLM-DEMO-0001" },
    createdAt: new Date(now - 2 * 60 * 60 * 1000)
  },
  {
    id: "demo-audit-4",
    user: { name: "مدير تجريبي" },
    role: Role.SUPER_ADMIN,
    action: "POLICY_PRINTED",
    entity: "Policy",
    entityId: "demo-policy-1",
    ipAddress: "127.0.0.1",
    metadata: { policyNumber: "TRI-DEMO-0001", format: "PDF" },
    createdAt: new Date(now - 4 * 60 * 60 * 1000)
  },
  {
    id: "demo-audit-5",
    user: { name: "مدير تجريبي" },
    role: Role.SUPER_ADMIN,
    action: "POLICY_CANCELLED",
    entity: "Cancellation",
    entityId: "demo-cancellation-1",
    ipAddress: "127.0.0.1",
    metadata: { reason: "CUSTOMER_REQUEST" },
    createdAt: new Date(now - 24 * 60 * 60 * 1000)
  }
];

export function getDemoAuditLogs() {
  return logs;
}
