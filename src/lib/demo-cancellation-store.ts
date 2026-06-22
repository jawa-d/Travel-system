import { getDemoPolicies, updateDemoPolicyStatus } from "@/lib/demo-policy-store";

export type DemoCancellationReason =
  | "VISA_REJECTION"
  | "TRIP_CANCELLATION"
  | "CUSTOMER_REQUEST"
  | "ISSUANCE_ERROR";

export type DemoCancellation = {
  id: string;
  cancellationNumber: string;
  policy: {
    id: string;
    policyNumber: string;
    premium: number;
    customer: { arabicName: string; englishName: string };
  };
  reason: DemoCancellationReason;
  notes: string | null;
  refundAmount: number;
  administrativeFees: number;
  createdAt: Date;
  updatedAt: Date;
};

const globalStore = globalThis as typeof globalThis & {
  __trinsuDemoCancellations?: DemoCancellation[];
};

function initialCancellations(): DemoCancellation[] {
  const policy = getDemoPolicies()[0];
  if (!policy) return [];
  return [{
    id: "demo-cancellation-1",
    cancellationNumber: "CAN-DEMO-0001",
    policy: {
      id: policy.id,
      policyNumber: policy.policyNumber,
      premium: policy.premium,
      customer: {
        arabicName: policy.customer.arabicName,
        englishName: policy.customer.englishName
      }
    },
    reason: "CUSTOMER_REQUEST",
    notes: "إلغاء تجريبي بطلب العميل",
    refundAmount: 20,
    administrativeFees: 5,
    createdAt: new Date(),
    updatedAt: new Date()
  }];
}

export function getDemoCancellations() {
  globalStore.__trinsuDemoCancellations ??= initialCancellations();
  return globalStore.__trinsuDemoCancellations;
}

export function createDemoCancellation(input: {
  policyId: string;
  reason: DemoCancellationReason;
  notes?: string;
  administrativeFees: number;
}) {
  const policy = getDemoPolicies().find((item) => item.id === input.policyId);
  if (!policy) return null;
  if (getDemoCancellations().some((item) => item.policy.id === policy.id)) return "DUPLICATE" as const;

  const now = new Date();
  const item: DemoCancellation = {
    id: `demo-cancellation-${crypto.randomUUID()}`,
    cancellationNumber: `CAN-${now.toISOString().slice(0, 10).replaceAll("-", "")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    policy: {
      id: policy.id,
      policyNumber: policy.policyNumber,
      premium: policy.premium,
      customer: {
        arabicName: policy.customer.arabicName,
        englishName: policy.customer.englishName
      }
    },
    reason: input.reason,
    notes: input.notes || null,
    refundAmount: Number(Math.max(policy.premium * 0.8 - input.administrativeFees, 0).toFixed(2)),
    administrativeFees: input.administrativeFees,
    createdAt: now,
    updatedAt: now
  };
  getDemoCancellations().unshift(item);
  updateDemoPolicyStatus(policy.id, "CANCELLED");
  return item;
}
