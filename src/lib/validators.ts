import { ClaimStatus, EndorsementStatus, Gender, MotorRequestStatus, TravelPurpose } from "@prisma/client";
import { z } from "zod";

export const customerSchema = z.object({
  arabicName: z.string().min(2, "الاسم العربي مطلوب"),
  englishName: z.string().min(2, "الاسم الإنجليزي مطلوب"),
  passportNumber: z.string().min(4, "رقم الجواز مطلوب").toUpperCase(),
  nationality: z.string().min(2, "الجنسية مطلوبة"),
  dateOfBirth: z.coerce.date(),
  gender: z.nativeEnum(Gender),
  mobile: z.string().min(7, "رقم الهاتف غير صحيح"),
  email: z.string().email("البريد غير صحيح").optional().or(z.literal("")),
  address: z.string().optional(),
  passportImage: z.string()
    .refine(
      (value) => !value || value.startsWith("idb://") || /^data:image\/(jpeg|png|webp);base64,/.test(value),
      "صيغة صورة الجواز غير صحيحة"
    )
    .refine(
      (value) => !value || value.startsWith("idb://") || value.length <= 2_800_000,
      "حجم صورة الجواز كبير جداً"
    )
    .optional()
    .or(z.literal(""))
});

export const planSchema = z.object({
  name: z.string().min(2),
  price: z.coerce.number().positive(),
  medicalCoverage: z.coerce.number().nonnegative(),
  baggageCoverage: z.coerce.number().nonnegative(),
  tripDelayCoverage: z.coerce.number().nonnegative(),
  medicalEvacuation: z.coerce.number().nonnegative(),
  repatriation: z.coerce.number().nonnegative(),
  personalLiability: z.coerce.number().nonnegative(),
  active: z.coerce.boolean().default(true)
});

export const countrySchema = z.object({
  nameAr: z.string().min(2),
  nameEn: z.string().min(2),
  isoCode: z.string()
    .trim()
    .min(2, "رمز ISO يجب أن يتكون من حرفين على الأقل")
    .max(3, "رمز ISO يجب ألا يتجاوز 3 أحرف")
    .regex(/^[A-Za-z]+$/, "رمز ISO يجب أن يحتوي على أحرف إنجليزية فقط")
    .toUpperCase(),
  category: z.enum(["ALLOWED", "RESTRICTED", "HIGH_RISK"]),
  additionalRiskFee: z.coerce.number().nonnegative().default(0),
  status: z.enum(["ACTIVE", "INACTIVE"])
});

export const pricingSchema = z.object({
  dateOfBirth: z.coerce.date(),
  numberOfDays: z.coerce.number().int().positive(),
  destinationCountryId: z.string().min(1),
  coverageAmount: z.coerce.number().refine((value) => [10000, 25000, 50000, 100000].includes(value)),
  travelPlanId: z.string().min(1)
});

export const policySchema = z.object({
  customerId: z.string().optional(),
  customer: customerSchema.optional(),
  destinationCountryId: z.string().min(1),
  destinations: z.array(z.string()).default([]),
  travelPurpose: z.nativeEnum(TravelPurpose),
  departureDate: z.coerce.date(),
  returnDate: z.coerce.date(),
  numberOfDays: z.coerce.number().int().positive(),
  coverageAmount: z.coerce.number().refine((value) => [10000, 25000, 50000, 100000].includes(value)),
  policyType: z.string().trim().min(1),
  coverageType: z.string().trim().min(1).default("STANDARD"),
  travelPlanId: z.string().min(1),
  status: z.enum(["DRAFT", "ACTIVE", "EXPIRED", "CANCELLED"]).default("DRAFT")
}).refine((data) => data.customerId || data.customer, {
  message: "اختر عميلا أو أنشئ عميلا جديدا"
});

export const claimSchema = z.object({
  policyNumber: z.string().min(3),
  claimType: z.string().trim().min(1),
  description: z.string().min(10),
  attachments: z.array(z.string().refine(
    (value) => value.startsWith("idb://") || /^https?:\/\//.test(value),
    "مرجع المرفق غير صحيح"
  )).default([]),
  status: z.nativeEnum(ClaimStatus).default("OPEN")
});

export const endorsementSchema = z.object({
  policyNumber: z.string().min(3),
  endorsementType: z.string().trim().min(1),
  newValue: z.record(z.unknown()),
  destinationCountryId: z.string().optional().or(z.literal("")),
  additionalPremium: z.coerce.number().nonnegative().default(0),
  status: z.nativeEnum(EndorsementStatus).default("OPEN")
});

export const cancellationSchema = z.object({
  policyNumber: z.string().min(3),
  reason: z.string().trim().min(1),
  notes: z.string().optional(),
  administrativeFees: z.coerce.number().nonnegative().default(10)
});

export const emailPdfSchema = z.object({
  email: z.string().email()
});

const storedFileReferenceSchema = z.string().refine(
  (value) => value.startsWith("idb://") || /^data:(image|application)\//.test(value) || /^https?:\/\//.test(value),
  "File reference is invalid"
);

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
    estimatedVehicleValue: z.coerce.number().positive("Estimated vehicle value is required")
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
