import { EngineeringRequestStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const MAX_DECIMAL_12_2_VALUE = 9_999_999_999.99;

export const engineeringRequestSchema = z.object({
  submissionToken: z.string().uuid().optional(),
  customer: z.object({
    fullName: z.string().trim().min(2),
    mobile: z.string().trim().min(7),
    email: z.string().trim().email().optional().or(z.literal("")),
    nationalId: z.string().trim().max(80).optional().or(z.literal("")),
    address: z.string().trim().max(300).optional().or(z.literal("")),
    city: z.string().trim().max(120).optional().or(z.literal(""))
  }),
  project: z.object({
    name: z.string().trim().min(2),
    type: z.string().trim().min(2),
    location: z.string().trim().min(2),
    contractValue: z.coerce.number().positive().max(MAX_DECIMAL_12_2_VALUE),
    currency: z.string().trim().min(3).max(8).default("IQD"),
    insuranceType: z.string().trim().min(2),
    startDate: z.string().datetime().optional().or(z.literal("")),
    endDate: z.string().datetime().optional().or(z.literal("")),
    contractorName: z.string().trim().max(200).optional().or(z.literal("")),
    ownerName: z.string().trim().max(200).optional().or(z.literal("")),
    riskDetails: z.string().trim().max(4000).optional().or(z.literal(""))
  }),
  documents: z.array(z.object({
    url: z.string().trim().url(),
    name: z.string().trim().min(1),
    type: z.string().trim().optional(),
    size: z.coerce.number().int().positive().optional()
  })).default([]),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
  agentCode: z.string().trim().max(80).optional().or(z.literal(""))
});

export type EngineeringRequestInput = z.infer<typeof engineeringRequestSchema>;

export const publicEngineeringTrackingStatuses = [
  "RECEIVED",
  "UNDER_REVIEW",
  "DOCUMENTS_CHECK",
  "QUOTE_PREPARATION",
  "COMPLETED",
  "REJECTED"
] as const;

export type PublicEngineeringTrackingStatus = (typeof publicEngineeringTrackingStatuses)[number];

export const publicEngineeringTrackingStatusLabels: Record<PublicEngineeringTrackingStatus, string> = {
  RECEIVED: "تم استلام الطلب",
  UNDER_REVIEW: "قيد المراجعة",
  DOCUMENTS_CHECK: "تدقيق المستندات",
  QUOTE_PREPARATION: "إعداد العرض",
  COMPLETED: "مكتمل",
  REJECTED: "مرفوض"
};

const engineeringTrackingStatusAdapter: Record<string, PublicEngineeringTrackingStatus> = {
  SUBMITTED: "RECEIVED",
  UNDER_REVIEW: "UNDER_REVIEW",
  NEEDS_INFO: "DOCUMENTS_CHECK",
  QUOTED: "QUOTE_PREPARATION",
  APPROVED: "COMPLETED",
  REJECTED: "REJECTED"
};

export function engineeringRequestSelect() {
  return {
    id: true,
    requestNumber: true,
    status: true,
    customerFullName: true,
    customerMobile: true,
    customerEmail: true,
    customerNationalId: true,
    customerCity: true,
    projectName: true,
    projectType: true,
    projectLocation: true,
    contractValue: true,
    currency: true,
    insuranceType: true,
    contractorName: true,
    ownerName: true,
    coverageType: true,
    coverageNotes: true,
    insurancePremium: true,
    discount: true,
    additionalFees: true,
    taxes: true,
    netPremium: true,
    pricingCurrency: true,
    pricingNotes: true,
    policyTermsHtml: true,
    termsApprovedByName: true,
    termsApprovedAt: true,
    underwriterSignature: true,
    managerSignature: true,
    companyStamp: true,
    issuedPolicyNumber: true,
    policyIssuedAt: true,
    source: true,
    agentName: true,
    createdDate: true,
    createdTime: true,
    createdAt: true,
    updatedAt: true
  } satisfies Prisma.EngineeringInsuranceRequestSelect;
}

export function parseEngineeringRequestJson(input: unknown) {
  return engineeringRequestSchema.parse(input);
}

export function toPublicEngineeringTrackingStatus(status: string): PublicEngineeringTrackingStatus {
  return engineeringTrackingStatusAdapter[status] ?? "UNDER_REVIEW";
}

export function publicEngineeringTrackingStatusLabel(status: PublicEngineeringTrackingStatus) {
  return publicEngineeringTrackingStatusLabels[status];
}

export async function createEngineeringInsuranceRequest(input: EngineeringRequestInput, source = "Public Portal") {
  if (input.submissionToken) {
    const existing = await prisma.engineeringInsuranceRequest.findUnique({
      where: { submissionToken: input.submissionToken },
      select: engineeringRequestSelect()
    });
    if (existing) return existing;
  }

  const now = new Date();
  const createdTime = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Baghdad"
  }).format(now);

  return prisma.engineeringInsuranceRequest.create({
    data: {
      requestNumber: createEngineeringRequestNumber(now),
      submissionToken: input.submissionToken ?? crypto.randomUUID(),
      status: EngineeringRequestStatus.SUBMITTED,
      customerFullName: input.customer.fullName,
      customerMobile: input.customer.mobile,
      customerEmail: input.customer.email || null,
      customerNationalId: input.customer.nationalId || null,
      customerAddress: input.customer.address || null,
      customerCity: input.customer.city || null,
      projectName: input.project.name,
      projectType: input.project.type,
      projectLocation: input.project.location,
      contractValue: input.project.contractValue,
      currency: input.project.currency || "IQD",
      insuranceType: input.project.insuranceType,
      startDate: input.project.startDate ? new Date(input.project.startDate) : null,
      endDate: input.project.endDate ? new Date(input.project.endDate) : null,
      contractorName: input.project.contractorName || null,
      ownerName: input.project.ownerName || null,
      riskDetails: input.project.riskDetails || null,
      documents: input.documents,
      notes: input.notes || null,
      source,
      agentName: input.agentCode || source,
      createdDate: now,
      createdTime
    },
    select: engineeringRequestSelect()
  });
}

function createEngineeringRequestNumber(date: Date) {
  const year = date.getFullYear();
  const stamp = `${date.getTime()}${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
  return `ENG-REQ-${year}-${stamp.slice(-9)}`;
}
