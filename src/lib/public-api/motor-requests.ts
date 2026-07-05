import { MotorRequestStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createMotorRequestNumber, motorRequestYear } from "@/lib/motor-request-number";
import { savePublicMotorFiles, validatePublicMotorFiles } from "@/lib/public-api/motor-files";

function logStage(stage: string, details?: Record<string, unknown>) {
  console.log(`[public-motor-request] ${stage}`, details ?? {});
}

function logPrismaError(stage: string, error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error(`[public-motor-request] ${stage} prisma error`, {
      code: error.code,
      meta: error.meta,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    console.error(`[public-motor-request] ${stage} prisma error`, {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    return;
  }

  if (
    error instanceof Prisma.PrismaClientRustPanicError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientValidationError
  ) {
    console.error(`[public-motor-request] ${stage} prisma error`, {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    return;
  }

  console.error(`[public-motor-request] ${stage} error`, error);
}

const documentLabels: Record<string, string> = {
  nationalIdFront: "National ID Front",
  nationalIdBack: "National ID Back",
  drivingLicense: "Driving License",
  vehicleRegistration: "Vehicle Registration",
  residenceCardFront: "Residence Card Front",
  residenceCardBack: "Residence Card Back"
};

export const publicMotorTrackingStatuses = [
  "RECEIVED",
  "UNDER_REVIEW",
  "DOCUMENTS_CHECK",
  "QUOTE_PREPARATION",
  "CONTACTING_CUSTOMER",
  "COMPLETED",
  "REJECTED"
] as const;

export type PublicMotorTrackingStatus = (typeof publicMotorTrackingStatuses)[number];

export const publicMotorTrackingStatusLabels: Record<PublicMotorTrackingStatus, string> = {
  RECEIVED: "تم استلام الطلب",
  UNDER_REVIEW: "قيد المراجعة",
  DOCUMENTS_CHECK: "تدقيق المستندات",
  QUOTE_PREPARATION: "إعداد العرض",
  CONTACTING_CUSTOMER: "التواصل معك",
  COMPLETED: "مكتمل",
  REJECTED: "مرفوض"
};

const motorTrackingStatusAdapter: Record<string, PublicMotorTrackingStatus> = {
  DRAFT: "RECEIVED",
  SUBMITTED: "RECEIVED",
  UNDER_REVIEW: "UNDER_REVIEW",
  NEEDS_INFO: "DOCUMENTS_CHECK",
  APPROVED: "COMPLETED",
  REJECTED: "REJECTED"
};

export const publicMotorRequestPayloadSchema = z.object({
  customer: z.object({
    fullName: z.string().trim().min(2, "Full name is required"),
    mobile: z.string().trim().min(7, "Mobile number is required"),
    email: z.string().trim().email("Email is invalid").optional().or(z.literal("")),
    nationalId: z.string().trim().min(4, "National ID number is required"),
    address: z.string().trim().min(2, "Address is required"),
    city: z.string().trim().min(2, "City is required")
  }),
  vehicle: z.object({
    vehicleType: z.string().trim().min(1, "Vehicle type is required"),
    manufacturer: z.string().trim().min(1, "Manufacturer is required"),
    model: z.string().trim().min(1, "Model is required"),
    manufacturingYear: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1),
    color: z.string().trim().min(1, "Color is required"),
    plateNumber: z.string().trim().min(1, "Plate number is required"),
    chassisNumber: z.string().trim().min(4, "Chassis number is required"),
    engineNumber: z.string().trim().min(3, "Engine number is required"),
    estimatedVehicleValue: z.coerce.number().positive("Estimated vehicle value is required")
  }),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
  agentCode: z.string().trim().max(80).optional().or(z.literal(""))
});

export function publicMotorRequestSelect() {
  return {
    id: true,
    requestNumber: true,
    status: true,
    customerFullName: true,
    customerMobile: true,
    customerEmail: true,
    customerNationalId: true,
    customerCity: true,
    vehicleType: true,
    manufacturer: true,
    model: true,
    manufacturingYear: true,
    plateNumber: true,
    vehicleImages: true,
    customerDocuments: true,
    uploadFailures: true,
    notes: true,
    source: true,
    agentName: true,
    createdDate: true,
    createdTime: true,
    createdAt: true,
    updatedAt: true
  } satisfies Prisma.MotorInsuranceRequestSelect;
}

export function toPublicMotorTrackingStatus(status: string): PublicMotorTrackingStatus {
  return motorTrackingStatusAdapter[status] ?? "UNDER_REVIEW";
}

export function publicMotorTrackingStatusLabel(status: PublicMotorTrackingStatus) {
  return publicMotorTrackingStatusLabels[status];
}

export function formatPublicMotorVehicle(input: {
  manufacturer: string;
  model: string;
  manufacturingYear: number;
}) {
  return [input.manufacturer, input.model, input.manufacturingYear].filter(Boolean).join(" ");
}

export function parsePublicMotorFormData(formData: FormData) {
  const payloadValue = formData.get("payload");
  if (typeof payloadValue !== "string") throw new Error("payload JSON field is required.");

  const payload = publicMotorRequestPayloadSchema.parse(JSON.parse(payloadValue));
  const vehicleImages = formData.getAll("vehicleImages").filter(isFormFile);
  const documents = Object.entries(documentLabels).flatMap(([key, label]) => (
    formData.getAll(`documents.${key}`)
      .filter(isFormFile)
      .map((file) => ({ key, label, file }))
  ));

  validatePublicMotorFiles({ vehicleImages, documents });
  return { payload, vehicleImages, documents };
}

function isFormFile(value: FormDataEntryValue): value is File {
  return typeof value === "object"
    && value !== null
    && "name" in value
    && typeof (value as { name?: unknown }).name === "string"
    && "size" in value
    && typeof (value as { size?: unknown }).size === "number"
    && "arrayBuffer" in value
    && typeof (value as { arrayBuffer?: unknown }).arrayBuffer === "function";
}

export async function createPublicMotorRequest(input: ReturnType<typeof parsePublicMotorFormData>) {
  const now = new Date();
  const createdTime = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Baghdad"
  }).format(now);

  try {
    logStage("prisma transaction started", { year: motorRequestYear(now) });
    const created = await prisma.$transaction(async (tx) => {
      try {
        const requestNumber = await createMotorRequestNumber(tx, motorRequestYear(now));
        logStage("request number generated", { requestNumber });

        const storedFiles = await savePublicMotorFiles({
          requestNumber,
          vehicleImages: input.vehicleImages,
          documents: input.documents
        });
        logStage("files uploaded", {
          requestNumber,
          vehicleImageCount: storedFiles.vehicleImages.length,
          documentCount: storedFiles.customerDocuments.length,
          uploadFailures: storedFiles.failures
        });

        const trackingNumber = requestNumber;
        logStage("tracking number generated", { trackingNumber });

        logStage("database insert started", { requestNumber });
        const createdRequest = await tx.motorInsuranceRequest.create({
          data: {
            requestNumber,
            submissionToken: crypto.randomUUID(),
            status: MotorRequestStatus.SUBMITTED,
            customerFullName: input.payload.customer.fullName,
            customerMobile: input.payload.customer.mobile,
            customerEmail: input.payload.customer.email || null,
            customerNationalId: input.payload.customer.nationalId,
            customerAddress: input.payload.customer.address,
            customerCity: input.payload.customer.city,
            vehicleType: input.payload.vehicle.vehicleType,
            manufacturer: input.payload.vehicle.manufacturer,
            model: input.payload.vehicle.model,
            manufacturingYear: input.payload.vehicle.manufacturingYear,
            color: input.payload.vehicle.color,
            plateNumber: input.payload.vehicle.plateNumber,
            chassisNumber: input.payload.vehicle.chassisNumber,
            engineNumber: input.payload.vehicle.engineNumber,
            estimatedVehicleValue: input.payload.vehicle.estimatedVehicleValue,
            vehicleImages: storedFiles.vehicleImages,
            customerDocuments: storedFiles.customerDocuments,
            uploadFailures: storedFiles.failures,
            notes: input.payload.notes || null,
            source: "Public Portal",
            agentName: input.payload.agentCode || "Public Portal",
            agentEmail: null,
            agentRole: null,
            agentAgency: null,
            createdDate: now,
            createdTime
          },
          select: publicMotorRequestSelect()
        });

        logStage("transaction committed", { requestNumber, id: createdRequest.id });
        return createdRequest;
      } catch (error) {
        logPrismaError("transaction", error);
        throw error;
      }
    });

    logStage("success response returned", { id: created.id, requestNumber: created.requestNumber });
    return created;
  } catch (error) {
    logPrismaError("createPublicMotorRequest", error);
    throw error;
  }
}
