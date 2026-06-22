import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { calculatePremium } from "@/lib/pricing";
import { pricingSchema } from "@/lib/validators";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { getDemoCountries } from "@/lib/demo-country-store";
import { getDemoPlans } from "@/lib/demo-plan-store";
import { getAge } from "@/lib/utils";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    const input = pricingSchema.parse(await request.json());
    const session = await auth();
    if (isDirectAccessEnabled() && !session?.user) {
      const country = getDemoCountries().find((item) => item.id === input.destinationCountryId);
      const plan = getDemoPlans().find((item) => item.id === input.travelPlanId);
      if (!country || !plan) return NextResponse.json({ error: "الدولة أو الخطة غير موجودة" }, { status: 404 });
      const age = getAge(input.dateOfBirth);
      const ageMultiplier = age < 18 ? 0.85 : age > 65 ? 1.85 : age > 50 ? 1.35 : 1;
      const durationMultiplier = input.numberOfDays <= 7 ? 1 : input.numberOfDays <= 30 ? 1.25 : 1.65;
      const countryMultiplier = country.category === "HIGH_RISK" ? 1.75 : country.category === "RESTRICTED" ? 1.35 : 1;
      const premium = plan.price * ageMultiplier * durationMultiplier *
        Math.sqrt(input.coverageAmount / 10000) * countryMultiplier + country.additionalRiskFee;
      return NextResponse.json({
        age,
        base: plan.price,
        riskFee: country.additionalRiskFee,
        premium: Number(premium.toFixed(2)),
        countryCategory: country.category,
        planName: plan.name
      });
    }
    await requireUser();
    return NextResponse.json(await calculatePremium(input));
  } catch (error) {
    return jsonError(error);
  }
}
