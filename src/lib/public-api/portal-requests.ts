import { MotorRequestStatus, PortalRequestType, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createMotorRequestNumber, motorRequestYear } from "@/lib/motor-request-number";

const attachmentSchema = z.object({
  key: z.string().trim().min(1).optional(),
  label: z.string().trim().min(1).optional(),
  url: z.string().trim().url().optional(),
  name: z.string().trim().min(1),
  size: z.coerce.number().int().positive().optional(),
  type: z.string().trim().optional(),
  uploadedAt: z.string().datetime().optional()
}).passthrough();

const customerSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  mobile: z.string().trim().min(7, "Mobile number is required"),
  email: z.string().trim().email("Email is invalid").optional().or(z.literal("")),
  nationalId: z.string().trim().min(4).optional().or(z.literal("")),
  address: z.string().trim().min(2).optional().or(z.literal("")),
  city: z.string().trim().min(2).optional().or(z.literal(""))
});

export const publicPortalRequestJsonSchema = z.object({
  requestType: z.nativeEnum(PortalRequestType).refine((value) => value !== PortalRequestType.MOTOR, {
    message: "Use the existing motor request endpoint for MOTOR requests."
  }),
  customer: customerSchema,
  payload: z.record(z.string(), z.unknown()).default({}),
  attachments: z.array(attachmentSchema).default([]),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
  agentCode: z.string().trim().max(80).optional().or(z.literal(""))
});

export type PublicPortalRequestInput = z.infer<typeof publicPortalRequestJsonSchema>;

export function parsePublicPortalJson(input: unknown) {
  return publicPortalRequestJsonSchema.parse(input);
}

export async function createPublicPortalRequest(input: PublicPortalRequestInput) {
  const now = new Date();
  const createdTime = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Baghdad"
  }).format(now);

  return prisma.$transaction(async (tx) => {
    const requestNumber = await createMotorRequestNumber(tx, motorRequestYear(now));
    return tx.motorInsuranceRequest.create({
      data: {
        requestNumber,
        submissionToken: crypto.randomUUID(),
        requestType: input.requestType,
        portalPayload: input.payload as Prisma.InputJsonValue,
        portalAttachments: input.attachments as Prisma.InputJsonValue,
        status: MotorRequestStatus.SUBMITTED,
        customerFullName: input.customer.fullName,
        customerMobile: input.customer.mobile,
        customerEmail: input.customer.email || null,
        customerNationalId: input.customer.nationalId || null,
        customerAddress: input.customer.address || null,
        customerCity: input.customer.city || null,
        vehicleImages: [],
        customerDocuments: [],
        uploadFailures: [],
        notes: input.notes || null,
        source: "TRINSU Portal",
        agentName: input.agentCode || "TRINSU Portal",
        agentEmail: null,
        agentRole: null,
        agentAgency: null,
        createdDate: now,
        createdTime
      },
      select: {
        id: true,
        requestNumber: true,
        requestType: true,
        status: true,
        uploadFailures: true
      }
    });
  });
}
