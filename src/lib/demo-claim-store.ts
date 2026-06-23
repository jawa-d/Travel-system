import { demoClaims } from "@/lib/demo-data";

export type DemoClaimStatus = "OPEN" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "CLOSED";
export type DemoClaimType = "MEDICAL" | "BAGGAGE" | "TRIP_DELAY" | "CANCELLATION" | "OTHER";

export type DemoClaim = {
  id: string;
  claimNumber: string;
  policy: { id: string; policyNumber: string };
  customer: { id: string; arabicName: string };
  claimType: DemoClaimType;
  description: string;
  attachments: string[];
  status: DemoClaimStatus;
  createdAt: Date;
  updatedAt: Date;
};

const globalStore = globalThis as typeof globalThis & { __trinsuDemoClaims?: DemoClaim[] };

function initialClaims(): DemoClaim[] {
  return demoClaims.map((claim) => ({
    id: claim.id,
    claimNumber: claim.claimNumber,
    policy: { id: claim.policy.id, policyNumber: claim.policy.policyNumber },
    customer: { id: claim.customer.id, arabicName: claim.customer.arabicName },
    claimType: claim.claimType as DemoClaimType,
    description: claim.description,
    attachments: [...claim.attachments],
    status: claim.status as DemoClaimStatus,
    createdAt: new Date(claim.createdAt),
    updatedAt: new Date(claim.updatedAt)
  }));
}

export function getDemoClaims() {
  globalStore.__trinsuDemoClaims ??= initialClaims();
  return globalStore.__trinsuDemoClaims;
}

export function createDemoClaim(data: Omit<DemoClaim, "id" | "claimNumber" | "createdAt" | "updatedAt">) {
  const now = new Date();
  const claim: DemoClaim = {
    ...data,
    id: `demo-claim-${crypto.randomUUID()}`,
    claimNumber: `CLM-${now.toISOString().slice(0, 10).replaceAll("-", "")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    createdAt: now,
    updatedAt: now
  };
  getDemoClaims().unshift(claim);
  return claim;
}

export function updateDemoClaimStatus(id: string, status: DemoClaimStatus) {
  const claims = getDemoClaims();
  const index = claims.findIndex((claim) => claim.id === id);
  if (index === -1) return null;
  if (claims[index].status === "REJECTED" || claims[index].status === "CLOSED") return "FINALIZED" as const;
  claims[index] = { ...claims[index], status, updatedAt: new Date() };
  return claims[index];
}
