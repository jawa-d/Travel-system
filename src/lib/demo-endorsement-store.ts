import { getDemoPolicies } from "@/lib/demo-policy-store";

export type DemoEndorsementStatus = "DRAFT" | "APPROVED" | "REJECTED";
export type DemoEndorsementType =
  | "EXTEND_TRAVEL_PERIOD"
  | "CHANGE_DESTINATION"
  | "UPDATE_CUSTOMER_INFORMATION"
  | "INCREASE_COVERAGE_AMOUNT";

export type DemoEndorsement = {
  id: string;
  endorsementNumber: string;
  policy: { id: string; policyNumber: string; customer: { arabicName: string; englishName: string } };
  endorsementType: DemoEndorsementType;
  newValue: Record<string, unknown>;
  additionalPremium: number;
  status: DemoEndorsementStatus;
  createdAt: Date;
  updatedAt: Date;
};

const globalStore = globalThis as typeof globalThis & { __trinsuDemoEndorsements?: DemoEndorsement[] };

function initialEndorsements(): DemoEndorsement[] {
  const policy = getDemoPolicies()[0];
  if (!policy) return [];
  return [{
    id: "demo-endorsement-1",
    endorsementNumber: "END-DEMO-0001",
    policy: {
      id: policy.id,
      policyNumber: policy.policyNumber,
      customer: { arabicName: policy.customer.arabicName, englishName: policy.customer.englishName }
    },
    endorsementType: "EXTEND_TRAVEL_PERIOD",
    newValue: { details: "تمديد فترة السفر لمدة 7 أيام" },
    additionalPremium: 10,
    status: "APPROVED",
    createdAt: new Date(),
    updatedAt: new Date()
  }];
}

export function getDemoEndorsements() {
  globalStore.__trinsuDemoEndorsements ??= initialEndorsements();
  return globalStore.__trinsuDemoEndorsements;
}

export function createDemoEndorsement(data: Omit<DemoEndorsement, "id" | "endorsementNumber" | "createdAt" | "updatedAt">) {
  const now = new Date();
  const item: DemoEndorsement = {
    ...data,
    id: `demo-endorsement-${crypto.randomUUID()}`,
    endorsementNumber: `END-${now.toISOString().slice(0, 10).replaceAll("-", "")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    createdAt: now,
    updatedAt: now
  };
  getDemoEndorsements().unshift(item);
  return item;
}

export function updateDemoEndorsementStatus(id: string, status: DemoEndorsementStatus) {
  const items = getDemoEndorsements();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], status, updatedAt: new Date() };
  return items[index];
}
