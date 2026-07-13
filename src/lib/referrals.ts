import { ReferralStatus, ReferralType, TransportMode } from "@prisma/client";
import { z } from "zod";

export const referralStatusLabels: Record<ReferralStatus, string> = {
  RECEIVED: "تم الاستلام",
  UNDER_REVIEW: "قيد مراجعة",
  CONTACTING: "قيد الاتصال",
  ISSUED: "تم الاصدار"
};

export const referralTypeLabels: Record<ReferralType, string> = {
  MARINE: "احالة بحري",
  ENGINEERING: "هندسي",
  HEALTH: "صحي",
  OTHER: "اخرى"
};

export const transportModeLabels: Record<TransportMode, string> = {
  SEA: "بحري",
  LAND: "بري",
  AIR: "جوي"
};

export const coverTypes = ["Cluse A", "Cluse B", "Cluse C"] as const;
export const extraRiskOptions = ["الحرب", "الارهاب", "الشغب والاضطرابات"] as const;

export const referralSchema = z.object({
  type: z.nativeEnum(ReferralType).default(ReferralType.MARINE),
  applicantName: z.string().trim().min(2),
  beneficiaryName: z.string().trim().min(2),
  insuredAmount: z.coerce.number().positive(),
  insuranceFrom: z.coerce.date(),
  insuranceTo: z.coerce.date(),
  totalInsuredAfterIncrease: z.coerce.number().positive(),
  increaseRate: z.coerce.number().min(0).max(100),
  coverType: z.enum(coverTypes),
  cargoDescription: z.string().trim().min(2),
  routeFrom: z.string().trim().min(2),
  routeTo: z.string().trim().min(2),
  transportMode: z.nativeEnum(TransportMode),
  packagingType: z.string().trim().min(2),
  lcNumber: z.string().trim().max(120).optional().or(z.literal("")),
  carrierName: z.string().trim().max(160).optional().or(z.literal("")),
  invoiceNumber: z.string().trim().min(1),
  currency: z.string().trim().min(2).max(8).default("IQD"),
  extraRisks: z.array(z.string()).default([]),
  hasPreviousCompensation: z.coerce.boolean().default(false),
  totalPremium: z.coerce.number().nonnegative(),
  installments: z.array(z.object({
    label: z.string().trim().min(1),
    amount: z.coerce.number().positive(),
    dueDate: z.coerce.date().optional().nullable()
  })).min(1),
  notes: z.string().trim().max(2000).optional().or(z.literal(""))
}).refine((data) => data.type === ReferralType.MARINE, {
  message: "الاحالة البحرية هي النوع المفعل حاليا.",
  path: ["type"]
}).refine((data) => data.insuranceTo >= data.insuranceFrom, {
  message: "تاريخ نهاية التأمين يجب أن يكون بعد تاريخ البداية.",
  path: ["insuranceTo"]
});

export const referralStatusSchema = z.object({
  status: z.nativeEnum(ReferralStatus)
});

export const referralCommissionSchema = z.object({
  premiumAmount: z.coerce.number().positive(),
  commissionRate: z.coerce.number().min(0).max(100).default(10),
  notes: z.string().trim().max(2000).optional().or(z.literal(""))
});

export function commissionAmount(premium: number, rate = 10) {
  return Math.round((premium * rate / 100) * 100) / 100;
}

export function createReferralNumber(date = new Date()) {
  const year = date.getFullYear();
  const stamp = `${date.getTime()}`.slice(-7);
  return `REF-${year}-${stamp}`;
}
