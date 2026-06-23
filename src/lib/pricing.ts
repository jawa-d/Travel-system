import { prisma } from "@/lib/prisma";
import { getAge } from "@/lib/utils";

export async function calculatePremium(input: {
  dateOfBirth: Date | string;
  numberOfDays: number;
  destinationCountryId: string;
  coverageAmount: number;
  travelPlanId: string;
}) {
  const [country, plan] = await Promise.all([
    prisma.country.findUniqueOrThrow({ where: { id: input.destinationCountryId } }),
    prisma.travelPlan.findUniqueOrThrow({ where: { id: input.travelPlanId } })
  ]);

  const age = getAge(input.dateOfBirth);
  const ageMultiplier = age < 18 ? 0.85 : age > 65 ? 1.85 : age > 50 ? 1.35 : 1;
  const durationMultiplier = input.numberOfDays <= 7 ? 1 : input.numberOfDays <= 30 ? 1.25 : 1.65;
  const coverageMultiplier = input.coverageAmount / 10000;
  const countryMultiplier = country.category === "HIGH_RISK" ? 1.75 : country.category === "RESTRICTED" ? 1.35 : 1;
  const base = Number(plan.price);
  const premium = base * ageMultiplier * durationMultiplier * Math.sqrt(coverageMultiplier) * countryMultiplier;

  return {
    age,
    base,
    premium: Number(premium.toFixed(2)),
    countryCategory: country.category,
    planName: plan.name
  };
}
