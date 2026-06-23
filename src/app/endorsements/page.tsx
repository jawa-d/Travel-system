import { CheckCircle2, Clock3, FilePenLine, XCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EndorsementManager } from "@/components/endorsement-manager";
import { Card, CardContent } from "@/components/ui/card";
import { getDemoCountries } from "@/lib/demo-country-store";
import { getDemoEndorsements } from "@/lib/demo-endorsement-store";
import { getDemoPolicies } from "@/lib/demo-policy-store";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { requirePagePermission } from "@/lib/page-guard";
import { prisma } from "@/lib/prisma";
import { visiblePolicyWhere } from "@/lib/policy-access";

export default async function EndorsementsPage() {
  const user = await requirePagePermission("endorsementsRead");
  const [endorsements, policies, countries, endorsementTypes] = isDirectAccessEnabled()
    ? [getDemoEndorsements(), getDemoPolicies(), getDemoCountries(), []]
    : await Promise.all([
        prisma.endorsement.findMany({ where: { policy: visiblePolicyWhere(user) }, include: { policy: { include: { customer: true } } }, orderBy: { createdAt: "desc" } }),
        prisma.policy.findMany({ where: visiblePolicyWhere(user), include: { customer: true }, orderBy: { createdAt: "desc" }, take: 100 }),
        prisma.country.findMany({ where: { status: "ACTIVE" }, orderBy: { nameAr: "asc" } }),
        prisma.lookupValue.findMany({ where: { category: "ENDORSEMENT_TYPE", active: true }, orderBy: { sortOrder: "asc" } })
      ]);

  return (
    <AppShell>
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary"><FilePenLine className="h-4 w-4" />تعديلات وثائق التأمين</div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">ملاحق الوثائق</h1>
        <p className="mt-1 text-sm text-muted-foreground">تمديد الرحلة أو تغيير الوجهة أو تحديث البيانات أو زيادة التغطية.</p>
      </div>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat icon={Clock3} label="المفتوحة" value={endorsements.filter((item) => item.status === "OPEN").length} className="text-blue-600 bg-blue-50" />
        <Stat icon={CheckCircle2} label="المعتمدة" value={endorsements.filter((item) => item.status === "APPROVED").length} className="text-emerald-600 bg-emerald-50" />
        <Stat icon={XCircle} label="المرفوضة" value={endorsements.filter((item) => item.status === "REJECTED").length} className="text-red-600 bg-red-50" />
      </div>
      <EndorsementManager
        canManage={user.role !== "AGENT"}
        endorsementTypes={(endorsementTypes.length ? endorsementTypes.map((item) => ({ value: item.value, label: item.labelAr })) : [
          { value: "EXTEND_TRAVEL_PERIOD", label: "تمديد فترة السفر" },
          { value: "CHANGE_DESTINATION", label: "تغيير الوجهة" },
          { value: "UPDATE_CUSTOMER_INFORMATION", label: "تحديث بيانات العميل" },
          { value: "INCREASE_COVERAGE_AMOUNT", label: "زيادة مبلغ التغطية" }
        ])}
        endorsements={endorsements.map((item) => ({
          id: item.id,
          endorsementNumber: item.endorsementNumber,
          policyNumber: item.policy.policyNumber,
          customerName: item.policy.customer.arabicName,
          endorsementType: item.endorsementType,
          details: String((item.newValue as { details?: unknown })?.details ?? JSON.stringify(item.newValue)),
          additionalPremium: String(item.additionalPremium),
          status: item.status,
          createdAt: item.createdAt.toISOString()
        }))}
        policies={policies.map((item) => ({ policyNumber: item.policyNumber, customerName: item.customer.arabicName }))}
        countries={countries.map((item) => ({ id: item.id, nameAr: item.nameAr }))}
      />
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, className }: { icon: typeof Clock3; label: string; value: number; className: string }) {
  return <Card className="shadow-sm"><CardContent className="flex items-center gap-3 p-4"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${className}`}><Icon className="h-5 w-5" /></div><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-black">{value}</p></div></CardContent></Card>;
}
