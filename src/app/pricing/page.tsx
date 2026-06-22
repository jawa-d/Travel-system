import { Calculator, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PricingCalculator } from "@/components/pricing-calculator";
import { getDemoCountries } from "@/lib/demo-country-store";
import { getDemoPlans } from "@/lib/demo-plan-store";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { prisma } from "@/lib/prisma";

export default async function PricingPage() {
  const [countries, plans] = isDirectAccessEnabled()
    ? [
        getDemoCountries().filter((country) => country.status === "ACTIVE"),
        getDemoPlans().filter((plan) => plan.active)
      ]
    : await Promise.all([
        prisma.country.findMany({ where: { status: "ACTIVE" }, orderBy: { nameAr: "asc" } }),
        prisma.travelPlan.findMany({ where: { active: true }, orderBy: { price: "asc" } })
      ]);

  return (
    <AppShell>
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
          <Calculator className="h-4 w-4" />
          تسعير تأمين السفر
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">حاسبة السعر</h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          احسب القسط المتوقع حسب عمر المسافر ومدة الرحلة والوجهة والتغطية والخطة.
        </p>
      </div>
      <PricingCalculator
        countries={countries.map((country) => ({
          id: country.id,
          nameAr: country.nameAr,
          category: country.category
        }))}
        plans={plans.map((plan) => ({
          id: plan.id,
          name: plan.name,
          price: String(plan.price)
        }))}
      />
    </AppShell>
  );
}
