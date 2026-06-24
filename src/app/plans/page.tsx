import { PlusCircle, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PlanManager } from "@/components/plan-manager";
import { ResourceForm } from "@/components/resource-form";
import { Badge } from "@/components/ui/badge";
import { getDemoPlans } from "@/lib/demo-plan-store";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { prisma } from "@/lib/prisma";

const fields = [
  { name: "name", label: "اسم الخطة" },
  { name: "price", label: "سعر الخطة", type: "number" },
  { name: "medicalCoverage", label: "التغطية الطبية", type: "number" },
  { name: "baggageCoverage", label: "تغطية الأمتعة", type: "number" },
  { name: "tripDelayCoverage", label: "تأخير الرحلة", type: "number" },
  { name: "medicalEvacuation", label: "الإخلاء الطبي", type: "number" },
  { name: "repatriation", label: "إعادة الجثمان", type: "number" },
  { name: "personalLiability", label: "المسؤولية الشخصية", type: "number" }
];

export default async function PlansPage() {
  const plans = isDirectAccessEnabled()
    ? getDemoPlans()
    : await prisma.travelPlan.findMany({ orderBy: { createdAt: "desc" } });
  const activePlans = plans.filter((plan) => plan.active).length;

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <ShieldCheck className="h-4 w-4" />
            باقات التأمين
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">خطط السفر</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            إضافة وتعديل وحذف الخطط وإدارة أسعارها وحدود التغطية.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-xl border bg-card px-4 py-2.5 shadow-sm">
            <p className="text-xs text-muted-foreground">إجمالي الخطط</p>
            <p className="mt-0.5 text-lg font-bold">{plans.length}</p>
          </div>
          <div className="rounded-xl border bg-card px-4 py-2.5 shadow-sm">
            <p className="text-xs text-muted-foreground">الخطط الفعالة</p>
            <p className="mt-0.5 text-lg font-bold text-emerald-600">{activePlans}</p>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.34fr)]">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">الخطط المتاحة</h2>
              <p className="text-sm text-muted-foreground">يمكنك تعديل الخطة أو حذفها مباشرة</p>
            </div>
            <Badge className="border-primary/20 bg-primary/10 text-primary">{plans.length} خطط</Badge>
          </div>

          <PlanManager
            plans={plans.map((plan) => ({
              id: plan.id,
              name: plan.name,
              price: String(plan.price),
              medicalCoverage: String(plan.medicalCoverage),
              baggageCoverage: String(plan.baggageCoverage),
              tripDelayCoverage: String(plan.tripDelayCoverage),
              medicalEvacuation: String(plan.medicalEvacuation),
              repatriation: String(plan.repatriation),
              personalLiability: String(plan.personalLiability),
              active: plan.active
            }))}
          />
        </section>

        <aside className="xl:sticky xl:top-24">
          <div className="mb-3 flex items-center gap-2 px-1">
            <PlusCircle className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-muted-foreground">إضافة خطة تأمين جديدة</p>
          </div>
          <ResourceForm title="خطة جديدة" endpoint="/api/plans" fields={fields} />
        </aside>
      </div>
    </AppShell>
  );
}
