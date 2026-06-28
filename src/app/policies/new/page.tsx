import { AppShell } from "@/components/app-shell";
import { PolicyWizard } from "@/components/policy-wizard";
import { getDemoCountries } from "@/lib/demo-country-store";
import { getDemoCustomers } from "@/lib/demo-customer-store";
import { getDemoPlans } from "@/lib/demo-plan-store";
import { directAccessUser, isDirectAccessEnabled } from "@/lib/direct-access";
import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/page-guard";
import { visibleCustomerWhere } from "@/lib/policy-access";

export default async function NewPolicyPage() {
  const user = await requirePagePermission("policiesWrite");
  const demoMode = isDirectAccessEnabled() && user.id === directAccessUser.id;
  const [customers, countries, plans, policyTypes, coverageTypes] = demoMode
    ? [
        getDemoCustomers(),
        getDemoCountries().filter((country) => country.status === "ACTIVE"),
        getDemoPlans().filter((plan) => plan.active),
        [],
        []
      ]
    : await Promise.all([
        prisma.customer.findMany({ where: visibleCustomerWhere(user), orderBy: { createdAt: "desc" }, take: 100 }),
        prisma.country.findMany({ where: { status: "ACTIVE" }, orderBy: { nameAr: "asc" } }),
        prisma.travelPlan.findMany({ where: { active: true }, orderBy: { price: "asc" } }),
        prisma.lookupValue.findMany({ where: { category: "POLICY_TYPE", active: true }, orderBy: { sortOrder: "asc" } }),
        prisma.lookupValue.findMany({ where: { category: "COVERAGE_TYPE", active: true }, orderBy: { sortOrder: "asc" } })
      ]);

  return (
    <AppShell>
      <div className="mb-6">
        <div className="mb-2 text-sm font-medium text-primary">إنشاء وثيقة تأمين جديدة</div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">إصدار وثيقة</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          أدخل بيانات العميل والرحلة، اختر التغطية، ثم راجع القسط وأصدر الوثيقة.
        </p>
      </div>
      <PolicyWizard
        agentMode={user.role === "AGENT"}
        customers={customers.map((customer) => ({
          id: customer.id,
          arabicName: customer.arabicName,
          passportNumber: customer.passportNumber,
          dateOfBirth: customer.dateOfBirth.toISOString()
        }))}
        countries={countries.map((country) => ({
          id: country.id,
          nameAr: country.nameAr
        }))}
        plans={plans.map((plan) => ({
          id: plan.id,
          name: plan.name,
          price: String(plan.price)
        }))}
        policyTypes={(policyTypes.length ? policyTypes.map((item) => ({ value: item.value, label: item.labelAr })) : [
          { value: "INDIVIDUAL", label: "فردية" }, { value: "FAMILY", label: "عائلية" },
          { value: "STUDENT", label: "طالب" }, { value: "BUSINESS", label: "أعمال" },
          { value: "MULTI_TRIP", label: "متعددة الرحلات" }
        ])}
        coverageTypes={(coverageTypes.length ? coverageTypes.map((item) => ({ value: item.value, label: item.labelAr })) : [
          { value: "STANDARD", label: "تغطية قياسية" }
        ])}
      />
    </AppShell>
  );
}
