import { z } from "zod";
import type { InsuranceRequestView } from "@/lib/insurance-request-ui";

export const requestPrioritySchema = z.enum(["normal", "high", "urgent"]);

export const addressDtoSchema = z.object({
  city: z.string().min(1),
  district: z.string().optional(),
  street: z.string().optional(),
  building: z.string().optional(),
  addressLine: z.string().min(1)
});
export type AddressDto = z.infer<typeof addressDtoSchema>;

export const customerDtoSchema = z.object({
  fullName: z.string().min(1),
  mobile: z.string().min(1),
  email: z.string().email().or(z.literal("")),
  nationalId: z.string().optional(),
  address: addressDtoSchema
});
export type CustomerDto = z.infer<typeof customerDtoSchema>;

export const documentDtoSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  receivedAt: z.string().datetime(),
  status: z.enum(["received", "missing", "needs_review"])
});
export type DocumentDto = z.infer<typeof documentDtoSchema>;

export const attachmentDtoSchema = documentDtoSchema.extend({
  attachmentId: z.string().min(1),
  downloadUrl: z.string().url().optional(),
  checksum: z.string().optional()
});
export type AttachmentDto = z.infer<typeof attachmentDtoSchema>;

export const timelineDtoSchema = z.object({
  id: z.string().min(1),
  status: z.string().min(1),
  label: z.string().min(1),
  actor: z.string().min(1),
  occurredAt: z.string().datetime(),
  note: z.string().optional()
});
export type TimelineDto = z.infer<typeof timelineDtoSchema>;

const portalRequestBaseSchema = z.object({
  portalRequestId: z.string().min(1),
  requestNumber: z.string().min(1),
  trackingNumber: z.string().min(1),
  status: z.string().min(1),
  priority: requestPrioritySchema.default("normal"),
  customer: customerDtoSchema,
  documents: z.array(documentDtoSchema).default([]),
  attachments: z.array(attachmentDtoSchema).default([]),
  timeline: z.array(timelineDtoSchema).default([]),
  assignedTo: z.string().default("Unassigned"),
  submittedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  portalSource: z.string().min(1)
});

export const motorRequestDtoSchema = portalRequestBaseSchema.extend({
  product: z.literal("motor"),
  payload: z.object({
    vehicleMake: z.string().min(1),
    vehicleModel: z.string().min(1),
    modelYear: z.number().int(),
    plateNumber: z.string().optional(),
    chassisNumber: z.string().optional(),
    sumInsured: z.number().nonnegative(),
    coverageType: z.string().min(1)
  })
});
export type MotorRequestDto = z.infer<typeof motorRequestDtoSchema>;

export const travelRequestDtoSchema = portalRequestBaseSchema.extend({
  product: z.literal("travel"),
  payload: z.object({
    destinationCountries: z.array(z.string().min(1)).min(1),
    departureDate: z.string().min(1),
    returnDate: z.string().min(1),
    tripPurpose: z.string().min(1),
    travelersCount: z.number().int().positive(),
    plan: z.string().min(1)
  })
});
export type TravelRequestDto = z.infer<typeof travelRequestDtoSchema>;

export const fireRequestDtoSchema = portalRequestBaseSchema.extend({
  product: z.literal("fire"),
  payload: z.object({
    propertyType: z.string().min(1),
    constructionType: z.string().min(1),
    sumInsured: z.number().nonnegative(),
    contentsValue: z.number().nonnegative().optional(),
    burglaryCover: z.boolean(),
    fireSafetySystem: z.string().optional()
  })
});
export type FireRequestDto = z.infer<typeof fireRequestDtoSchema>;

export const contractorsRequestDtoSchema = portalRequestBaseSchema.extend({
  product: z.literal("contractors_all_risks"),
  payload: z.object({
    projectName: z.string().min(1),
    contractValue: z.number().nonnegative(),
    currency: z.string().min(1),
    projectDurationMonths: z.number().int().positive(),
    maintenancePeriodMonths: z.number().int().nonnegative(),
    principalName: z.string().min(1)
  })
});
export type ContractorsRequestDto = z.infer<typeof contractorsRequestDtoSchema>;

export const liabilityRequestDtoSchema = portalRequestBaseSchema.extend({
  product: z.literal("public_liability"),
  payload: z.object({
    businessActivity: z.string().min(1),
    annualTurnover: z.number().nonnegative(),
    coverageLimit: z.number().nonnegative(),
    premisesAreaSqm: z.number().nonnegative().optional(),
    employeesCount: z.number().int().nonnegative(),
    riskLocation: z.string().min(1)
  })
});
export type LiabilityRequestDto = z.infer<typeof liabilityRequestDtoSchema>;

export const workersCompensationRequestDtoSchema = portalRequestBaseSchema.extend({
  product: z.literal("workers_compensation"),
  payload: z.object({
    employerName: z.string().min(1),
    employeesCount: z.number().int().positive(),
    annualPayroll: z.number().nonnegative(),
    currency: z.string().min(1),
    businessActivity: z.string().min(1),
    siteAddress: z.string().min(1)
  })
});
export type WorkersCompensationRequestDto = z.infer<typeof workersCompensationRequestDtoSchema>;

export const glassRequestDtoSchema = portalRequestBaseSchema.extend({
  product: z.literal("glass"),
  payload: z.object({
    buildingType: z.string().min(1),
    glassType: z.string().min(1),
    panelsCount: z.number().int().positive(),
    estimatedValue: z.number().nonnegative(),
    installationAddress: z.string().min(1)
  })
});
export type GlassRequestDto = z.infer<typeof glassRequestDtoSchema>;

export const healthRequestDtoSchema = portalRequestBaseSchema.extend({
  product: z.literal("health"),
  payload: z.object({
    membersCount: z.number().int().positive(),
    planType: z.string().min(1),
    hasChronicConditions: z.boolean(),
    preferredHospitals: z.array(z.string()).default([]),
    coverageStartDate: z.string().min(1)
  })
});
export type HealthRequestDto = z.infer<typeof healthRequestDtoSchema>;

export const propertyRequestDtoSchema = portalRequestBaseSchema.extend({
  product: z.literal("property"),
  payload: z.object({
    propertyType: z.string().min(1),
    occupancyType: z.string().min(1),
    buildingValue: z.number().nonnegative(),
    contentsValue: z.number().nonnegative(),
    currency: z.string().min(1),
    location: z.string().min(1)
  })
});
export type PropertyRequestDto = z.infer<typeof propertyRequestDtoSchema>;

export const fidelityRequestDtoSchema = portalRequestBaseSchema.extend({
  product: z.literal("fidelity"),
  payload: z.object({
    employerName: z.string().min(1),
    coveredEmployeesCount: z.number().int().positive(),
    guaranteeLimit: z.number().nonnegative(),
    currency: z.string().min(1),
    employeeRoles: z.array(z.string()).min(1)
  })
});
export type FidelityRequestDto = z.infer<typeof fidelityRequestDtoSchema>;

export const cashRequestDtoSchema = portalRequestBaseSchema.extend({
  product: z.literal("cash"),
  payload: z.object({
    safeType: z.string().min(1),
    maxCashLimit: z.number().nonnegative(),
    currency: z.string().min(1),
    alarmSystem: z.boolean(),
    guardService: z.boolean(),
    premisesOpenHours: z.string().min(1)
  })
});
export type CashRequestDto = z.infer<typeof cashRequestDtoSchema>;

export const insurancePortalRequestDtoSchema = z.discriminatedUnion("product", [
  motorRequestDtoSchema,
  travelRequestDtoSchema,
  fireRequestDtoSchema,
  contractorsRequestDtoSchema,
  liabilityRequestDtoSchema,
  workersCompensationRequestDtoSchema,
  glassRequestDtoSchema,
  healthRequestDtoSchema,
  propertyRequestDtoSchema,
  fidelityRequestDtoSchema,
  cashRequestDtoSchema
]);
export type InsurancePortalRequestDto = z.infer<typeof insurancePortalRequestDtoSchema>;

export function toInsuranceRequestView(dto: InsurancePortalRequestDto): InsuranceRequestView {
  return {
    id: dto.portalRequestId,
    requestNumber: dto.requestNumber,
    trackingNumber: dto.trackingNumber,
    status: dto.status,
    priority: dto.priority,
    customer: {
      fullName: dto.customer.fullName,
      mobile: dto.customer.mobile,
      email: dto.customer.email,
      nationalId: dto.customer.nationalId,
      city: dto.customer.address.city,
      address: dto.customer.address.addressLine
    },
    portalSource: dto.portalSource,
    assignedTo: dto.assignedTo,
    submittedAt: dto.submittedAt,
    updatedAt: dto.updatedAt,
    payload: dto.payload,
    documents: dto.documents.map((document) => ({
      key: document.key,
      label: document.label,
      fileName: document.fileName,
      type: document.mimeType,
      size: `${Math.ceil(document.sizeBytes / 1024)} KB`,
      receivedAt: document.receivedAt,
      status: document.status
    })),
    internalNotes: dto.timeline.map((item) => ({
      id: item.id,
      author: item.actor,
      body: item.note ?? item.label,
      createdAt: item.occurredAt
    }))
  };
}
