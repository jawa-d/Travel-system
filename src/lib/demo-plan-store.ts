import { demoPlans } from "@/lib/demo-data";
import { isDemoModeEnabled } from "@/lib/direct-access";

export type DemoPlan = {
  id: string;
  name: string;
  price: number;
  medicalCoverage: number;
  baggageCoverage: number;
  tripDelayCoverage: number;
  medicalEvacuation: number;
  repatriation: number;
  personalLiability: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const globalStore = globalThis as typeof globalThis & {
  __trinsuDemoPlans?: DemoPlan[];
};

function initialPlans(): DemoPlan[] {
  return demoPlans.map((plan) => ({
    ...plan,
    price: Number(plan.price),
    medicalCoverage: Number(plan.medicalCoverage),
    baggageCoverage: Number(plan.baggageCoverage),
    tripDelayCoverage: Number(plan.tripDelayCoverage),
    medicalEvacuation: Number(plan.medicalEvacuation),
    repatriation: Number(plan.repatriation),
    personalLiability: Number(plan.personalLiability),
    createdAt: new Date(plan.createdAt),
    updatedAt: new Date(plan.updatedAt)
  }));
}

export function getDemoPlans() {
  if (!isDemoModeEnabled()) return [];
  globalStore.__trinsuDemoPlans ??= initialPlans();
  return globalStore.__trinsuDemoPlans;
}

export function createDemoPlan(data: Omit<DemoPlan, "id" | "createdAt" | "updatedAt">) {
  if (!isDemoModeEnabled()) return null;
  const now = new Date();
  const plan: DemoPlan = {
    ...data,
    id: `demo-plan-${crypto.randomUUID()}`,
    createdAt: now,
    updatedAt: now
  };
  getDemoPlans().unshift(plan);
  return plan;
}

export function updateDemoPlan(id: string, data: Omit<DemoPlan, "id" | "createdAt" | "updatedAt">) {
  if (!isDemoModeEnabled()) return null;
  const plans = getDemoPlans();
  const index = plans.findIndex((plan) => plan.id === id);
  if (index === -1) return null;
  plans[index] = { ...plans[index], ...data, updatedAt: new Date() };
  return plans[index];
}

export function deleteDemoPlan(id: string) {
  if (!isDemoModeEnabled()) return false;
  const plans = getDemoPlans();
  const index = plans.findIndex((plan) => plan.id === id);
  if (index === -1) return false;
  plans.splice(index, 1);
  return true;
}
