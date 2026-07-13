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
export const referralCurrencies = ["IQD", "USD"] as const;
export const referralCurrencyLabels: Record<typeof referralCurrencies[number], string> = {
  IQD: "IQD - دينار عراقي",
  USD: "USD - دولار أمريكي"
};

const optionalText = z.preprocess((value) => value === "" ? null : value, z.string().trim().max(2000).nullable().optional());
const optionalNumber = z.preprocess((value) => value === "" || value === null ? null : value, z.coerce.number().nonnegative().nullable().optional());
const optionalDate = z.preprocess((value) => value === "" || value === null ? null : value, z.coerce.date().nullable().optional());

const referralPayload = {
  type: z.nativeEnum(ReferralType).default(ReferralType.MARINE),
  applicantName: optionalText,
  beneficiaryName: optionalText,
  insuredAmount: optionalNumber,
  insuranceFrom: optionalDate,
  insuranceTo: optionalDate,
  totalInsuredAfterIncrease: optionalNumber,
  increaseRate: optionalNumber,
  coverType: z.preprocess((value) => value === "" ? null : value, z.enum(coverTypes).nullable().optional()),
  cargoDescription: optionalText,
  routeFrom: optionalText,
  routeTo: optionalText,
  transportMode: z.preprocess((value) => value === "" ? null : value, z.nativeEnum(TransportMode).nullable().optional()),
  packagingType: optionalText,
  lcNumber: optionalText,
  carrierName: optionalText,
  invoiceNumber: optionalText,
  currency: z.preprocess((value) => typeof value === "string" ? value.toUpperCase() : value, z.enum(referralCurrencies).default("IQD")),
  extraRisks: z.array(z.string()).default([]),
  hasPreviousCompensation: z.coerce.boolean().default(false),
  totalPremium: z.coerce.number().nonnegative().default(0),
  installments: z.array(z.object({
    label: optionalText,
    amount: optionalNumber,
    dueDate: optionalDate
  })).default([]),
  notes: optionalText
};

const referralBaseSchema = z.object(referralPayload);

function refineReferralSchema<T extends z.ZodTypeAny>(schema: T) {
  return schema.refine((data) => data.type === ReferralType.MARINE, {
  message: "الاحالة البحرية هي النوع المفعل حاليا.",
  path: ["type"]
}).refine((data) => !data.insuranceFrom || !data.insuranceTo || data.insuranceTo >= data.insuranceFrom, {
  message: "تاريخ نهاية التأمين يجب أن يكون بعد تاريخ البداية.",
  path: ["insuranceTo"]
});
}

export const referralSchema = refineReferralSchema(referralBaseSchema);

export const referralUpdateSchema = refineReferralSchema(referralBaseSchema.extend({
  status: z.nativeEnum(ReferralStatus).optional()
}));

export const referralStatusSchema = z.object({
  status: z.nativeEnum(ReferralStatus)
});

export const referralCommissionSchema = z.object({
  premiumAmount: z.coerce.number().positive(),
  commissionRate: z.coerce.number().min(10).max(10).default(10),
  notes: optionalText
});

export function commissionAmount(premium: number, rate = 10) {
  return Math.round((premium * rate / 100) * 100) / 100;
}

export function addCurrencyTotal(target: Record<string, number>, currency: string | null | undefined, amount: number) {
  const key = currency === "USD" ? "USD" : "IQD";
  target[key] = (target[key] ?? 0) + amount;
}

export function formatReferralMoney(amount: number, currency: string | null | undefined) {
  const code = currency === "USD" ? "USD" : "IQD";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: code === "IQD" ? 0 : 2
    }).format(amount);
  } catch {
    return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount)} ${code}`;
  }
}

export function formatCurrencyTotals(totals: Record<string, number>) {
  const entries = Object.entries(totals).filter(([, amount]) => amount > 0);
  if (!entries.length) return formatReferralMoney(0, "IQD");
  return entries.map(([currency, amount]) => formatReferralMoney(amount, currency)).join(" / ");
}

export function createReferralNumber(date = new Date()) {
  const year = date.getFullYear();
  const stamp = `${date.getTime()}`.slice(-7);
  return `REF-${year}-${stamp}`;
}
