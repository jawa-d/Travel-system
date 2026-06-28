import Link from "next/link";
import { Banknote, BriefcaseBusiness, FilePlus2, FileText, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AgencyDashboard } from "@/components/agency-dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDemoPolicies } from "@/lib/demo-policy-store";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { requirePagePermission } from "@/lib/page-guard";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { AgentManager } from "@/components/agent-manager";
import { visiblePolicyWhere } from "@/lib/policy-access";

const commissionRate = 0.1;

export default async function AgencyPage() {
  const user = await requirePagePermission("agentsManage");
  const where = visiblePolicyWhere(user);
  const agents = isDirectAccessEnabled()
    ? await prisma.user.findMany({
        where: { role: "AGENT" },
        select: { id: true, name: true, email: true, active: true, createdAt: true, _count: { select: { policies: true } } },
        orderBy: { createdAt: "desc" }
      }).catch(() => [])
    : await prisma.user.findMany({
        where: { role: "AGENT" },
        select: { id: true, name: true, email: true, active: true, createdAt: true, _count: { select: { policies: true } } },
        orderBy: { createdAt: "desc" }
      });
  const policies = isDirectAccessEnabled()
    ? getDemoPolicies()
    : await prisma.policy.findMany({
        where,
        include: { customer: true, destinationCountry: true, travelPlan: true },
        orderBy: { createdAt: "desc" },
        take: 100
      });

  const totalPremium = policies.reduce((sum, policy) => sum + Number(policy.premium), 0);
  const activePolicies = policies.filter((policy) => policy.status === "ACTIVE").length;
  const commission = totalPremium * commissionRate;

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <BriefcaseBusiness className="h-4 w-4" />إدارة إنتاج الوكيل
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">بوابة الوكلاء</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            إنشاء حسابات الوكلاء ومتابعة إنتاجهم والأقساط والعمولات.
          </p>
        </div>
        <Button asChild className="h-11">
          <Link href="/policies/new"><FilePlus2 className="h-4 w-4" />إصدار وثيقة جديدة</Link>
        </Button>
      </div>

      <AgentManager agents={agents.map((agent) => ({ ...agent, createdAt: agent.createdAt.toISOString() }))} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={FileText} label="إجمالي الوثائق" value={policies.length} className="text-primary bg-primary/10" />
        <Metric icon={TrendingUp} label="الوثائق الفعالة" value={activePolicies} className="text-emerald-600 bg-emerald-50" />
        <Metric icon={Banknote} label="إجمالي الأقساط" value={formatCurrency(totalPremium)} className="text-blue-600 bg-blue-50" />
        <Metric icon={BriefcaseBusiness} label={`العمولة (${commissionRate * 100}%)`} value={formatCurrency(commission)} className="text-amber-600 bg-amber-50" />
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-bold">وثائق الوكيل</h2>
        <p className="text-sm text-muted-foreground">ابحث في الوثائق وتابع القسط والعمولة لكل وثيقة.</p>
      </div>

      <AgencyDashboard
        commissionRate={commissionRate}
        policies={policies.map((policy) => ({
          id: policy.id,
          policyNumber: policy.policyNumber,
          customerName: policy.customer.arabicName,
          destinationName: policy.destinationCountry.nameAr,
          planName: policy.travelPlan.name,
          departureDate: policy.departureDate.toISOString(),
          returnDate: policy.returnDate.toISOString(),
          premium: String(policy.premium),
          status: policy.status
        }))}
      />
    </AppShell>
  );
}

function Metric({ icon: Icon, label, value, className }: {
  icon: typeof FileText;
  label: string;
  value: string | number;
  className: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${className}`}><Icon className="h-5 w-5" /></div>
        <div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 truncate text-xl font-black">{value}</p></div>
      </CardContent>
    </Card>
  );
}
