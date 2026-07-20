import type { LucideIcon } from "lucide-react";

export type InsuranceDocument = {
  key: string;
  label: string;
  fileName: string;
  type: string;
  size: string;
  receivedAt: string;
  status: "received" | "missing" | "needs_review";
};

export type InsuranceNote = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

export type InsuranceCustomer = {
  fullName: string;
  mobile: string;
  email: string;
  nationalId?: string;
  city: string;
  address: string;
};

export type InsuranceRequestView = {
  id: string;
  requestNumber: string;
  trackingNumber: string;
  status: string;
  priority: "normal" | "high" | "urgent";
  customer: InsuranceCustomer;
  portalSource: string;
  assignedTo: string;
  submittedAt: string;
  updatedAt: string;
  payload: Record<string, unknown>;
  documents: InsuranceDocument[];
  internalNotes: InsuranceNote[];
};

export type InsuranceModuleView = {
  route: string;
  title: string;
  subtitle: string;
  productLabel: string;
  icon: LucideIcon;
  statuses: readonly string[];
  statusLabels: Record<string, string>;
  statusClasses: Record<string, string>;
  requests: InsuranceRequestView[];
};

export type InsuranceRequestService = {
  list: () => InsuranceRequestView[];
  get: (id: string) => InsuranceRequestView | undefined;
};

export function createMockInsuranceRequestService(module: InsuranceModuleView): InsuranceRequestService {
  return {
    list: () => module.requests,
    get: (id: string) => module.requests.find((request) => request.id === id)
  };
}

export function formatPayloadKey(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());
}

export function formatPayloadValue(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return new Intl.NumberFormat("en-US").format(value);
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value ?? "-");
}
