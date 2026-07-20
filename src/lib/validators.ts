import { MotorRequestStatus } from "@prisma/client";
import { z } from "zod";

const storedFileReferenceSchema = z.string().refine(
  (value) => value.startsWith("idb://") || /^data:(image|application)\//.test(value) || /^https?:\/\//.test(value),
  "File reference is invalid"
);

const MAX_DECIMAL_12_2_VALUE = 9_999_999_999.99;

export const motorVehicleImageSchema = z.object({
  id: storedFileReferenceSchema,
  category: z.string().trim().min(1),
  name: z.string().trim().min(1),
  size: z.coerce.number().positive(),
  type: z.string().regex(/^image\/(jpeg|png|webp)$/)
});

export const motorDocumentSchema = z.object({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1),
  id: storedFileReferenceSchema,
  name: z.string().trim().min(1),
  size: z.coerce.number().positive(),
  type: z.string().regex(/^(image\/(jpeg|png|webp)|application\/pdf)$/)
});

export const motorInsuranceRequestSchema = z.object({
  submissionToken: z.string().uuid(),
  intent: z.enum(["draft", "submit"]).default("submit"),
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
    estimatedVehicleValue: z.coerce.number()
      .finite("Estimated vehicle value must be a valid number")
      .positive("Estimated vehicle value is required")
      .max(MAX_DECIMAL_12_2_VALUE, "Estimated vehicle value exceeds the maximum allowed amount")
  }),
  vehicleImages: z.array(motorVehicleImageSchema).min(5, "At least 5 vehicle images are required"),
  documents: z.array(motorDocumentSchema).min(6, "All required customer documents are required"),
  notes: z.string().trim().max(4000).optional().or(z.literal(""))
}).superRefine((data, context) => {
  const requiredDocumentKeys = [
    "nationalIdFront",
    "nationalIdBack",
    "drivingLicense",
    "vehicleRegistration",
    "residenceCardFront",
    "residenceCardBack"
  ];
  const uploadedKeys = new Set(data.documents.map((document) => document.key));
  for (const key of requiredDocumentKeys) {
    if (!uploadedKeys.has(key)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "All required customer documents are required",
        path: ["documents", key]
      });
    }
  }
});

export type MotorInsuranceRequestInput = z.infer<typeof motorInsuranceRequestSchema>;
export const submittedMotorRequestStatus = MotorRequestStatus.SUBMITTED;
