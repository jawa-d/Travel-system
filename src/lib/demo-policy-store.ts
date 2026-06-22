import { demoPolicies } from "@/lib/demo-data";

export type DemoPolicyStatus = "DRAFT" | "ACTIVE" | "EXPIRED" | "CANCELLED";

export type DemoPolicy = {
  id: string;
  policyNumber: string;
  customer: {
    id: string;
    arabicName: string;
    englishName: string;
    passportNumber: string;
    dateOfBirth: Date;
    mobile: string;
    email: string | null;
  };
  destinationCountry: { id: string; nameAr: string };
  travelPlan: { id: string; name: string };
  departureDate: Date;
  returnDate: Date;
  premium: number;
  coverageAmount: number;
  policyType: string;
  status: DemoPolicyStatus;
  qrCodeData?: string | null;
  createdAt: Date;
};

const globalStore = globalThis as typeof globalThis & { __trinsuDemoPolicies?: DemoPolicy[] };

function initialPolicies(): DemoPolicy[] {
  return demoPolicies.map((policy) => ({
    id: policy.id,
    policyNumber: policy.policyNumber,
    customer: {
      id: policy.customer.id,
      arabicName: policy.customer.arabicName,
      englishName: policy.customer.englishName,
      passportNumber: policy.customer.passportNumber,
      dateOfBirth: new Date(policy.customer.dateOfBirth),
      mobile: policy.customer.mobile,
      email: policy.customer.email
    },
    destinationCountry: { id: policy.destinationCountry.id, nameAr: policy.destinationCountry.nameAr },
    travelPlan: { id: policy.travelPlan.id, name: policy.travelPlan.name },
    departureDate: new Date(policy.departureDate),
    returnDate: new Date(policy.returnDate),
    premium: Number(policy.premium),
    coverageAmount: Number(policy.coverageAmount),
    policyType: policy.policyType,
    status: policy.status as DemoPolicyStatus,
    createdAt: new Date(policy.createdAt)
  }));
}

export function getDemoPolicies() {
  globalStore.__trinsuDemoPolicies ??= initialPolicies();
  return globalStore.__trinsuDemoPolicies;
}

export function createDemoPolicy(policy: DemoPolicy) {
  getDemoPolicies().unshift(policy);
  return policy;
}

export function updateDemoPolicyStatus(id: string, status: DemoPolicyStatus) {
  const policies = getDemoPolicies();
  const index = policies.findIndex((policy) => policy.id === id);
  if (index === -1) return null;
  policies[index] = { ...policies[index], status };
  return policies[index];
}
