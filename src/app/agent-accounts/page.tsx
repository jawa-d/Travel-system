import {
  BadgeDollarSign, Banknote, BriefcaseBusiness,
  FileCheck2, Landmark, Users
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AgentAccountsDashboard, type AgentAccount } from "@/components/agent-accounts-dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/page-guard";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

const COMMISSION_RATE = 0.1;

export default async function AgentAccountsPage() {
  await requirePagePermission("agentAccountsRead");

  const agents = await prisma.user.findMany({
    where: { role: "AGENT" },
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      active: true,
      createdAt: true,
      agency: { select: { name: true, code: true } },
      ownedPolicies: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          policyNumber: true,
          premium: true,
          coverageAmount: true,
          status: true,
          createdAt: true,
          issuedAt: true,
          customer: { select: { arabicName: true, passportNumber: true } },
          destinationCountry: { select: { nameAr: true } },
          travelPlan: { select: { name: true } },
          cancellation: {
            select: {
              cancellationNumber: true,
              refundAmount: true,
              administrativeFees: true,
              createdAt: true
            }
          },
          _count: { select: { claims: true, endorsements: true } }
        }
      }
    }
  });

  const accounts: AgentAccount[] = agents.map((agent) => {
    const policies = agent.ownedPolicies.map((policy) => {
      const premium = Number(policy.premium);
      const commission = policy.status === "ACTIVE" || policy.status === "EXPIRED"
        ? premium * COMMISSION_RATE
        : 0;
      return {
        id: policy.id,
        policyNumber: policy.policyNumber,
        customerName: policy.customer.arabicName,
        passportNumber: policy.customer.passportNumber,
        destination: policy.destinationCountry.nameAr,
        planName: policy.travelPlan.name,
        premium,
        coverageAmount: Number(policy.coverageAmount),
        commission,
        status: policy.status,
        issuedAt: (policy.issuedAt ?? policy.createdAt).toISOString(),
        claimsCount: policy._count.claims,
        endorsementsCount: policy._count.endorsements,
        cancellation: policy.cancellation ? {
          cancellationNumber: policy.cancellation.cancellationNumber,
          refundAmount: Number(policy.cancellation.refundAmount),
          administrativeFees: Number(policy.cancellation.administrativeFees),
          createdAt: policy.cancellation.createdAt.toISOString()
        } : null
      };
    });

    const grossPremium = policies.reduce((sum, policy) => sum + policy.premium, 0);
    const eligiblePremium = policies
      .filter((policy) => policy.status === "ACTIVE" || policy.status === "EXPIRED")
      .reduce((sum, policy) => sum + policy.premium, 0);
    const cancelledPremium = policies
      .filter((policy) => policy.status === "CANCELLED")
      .reduce((sum, policy) => sum + policy.premium, 0);
    const refunds = policies.reduce((sum, policy) => sum + (policy.cancellation?.refundAmount ?? 0), 0);
    const administrativeFees = policies.reduce((sum, policy) => sum + (policy.cancellation?.administrativeFees ?? 0), 0);

    return {
      id: agent.id,
      name: agent.name ?? "وكيل بدون اسم",
      email: agent.email,
      active: agent.active,
      agencyName: agent.agency?.name ?? null,
      agencyCode: agent.agency?.code ?? null,
      joinedAt: agent.createdAt.toISOString(),
      commissionRate: COMMISSION_RATE,
      grossPremium,
      eligiblePremium,
      cancelledPremium,
      refunds,
      administrativeFees,
      earnedCommission: eligiblePremium * COMMISSION_RATE,
      lostCommission: cancelledPremium * COMMISSION_RATE,
      netProduction: grossPremium - refunds,
      policies
    };
  });

  const totals = accounts.reduce((sum, account) => ({
    policies: sum.policies + account.policies.length,
    activePolicies: sum.activePolicies + account.policies.filter((policy) => policy.status === "ACTIVE").length,
    grossPremium: sum.grossPremium + account.grossPremium,
    netProduction: sum.netProduction + account.netProduction,
    earnedCommission: sum.earnedCommission + account.earnedCommission,
    refunds: sum.refunds + account.refunds
  }), { policies: 0, activePolicies: 0, grossPremium: 0, netProduction: 0, earnedCommission: 0, refunds: 0 });

  return (
    <AppShell>
      <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-l from-slate-950 via-[#173b4d] to-primary p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -left-16 -top-20 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute -bottom-24 right-1/3 h-60 w-60 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-cyan-100">
              <Landmark className="h-4 w-4" />للإدارة العامة فقط
            </div>
            <h1 className="text-3xl font-black sm:text-4xl">حسابات الوكلاء</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              مركز مالي موحّد لمتابعة إنتاج كل وكيل، الأقساط، العمولات، الإلغاءات، الاستردادات وصافي الأعمال.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
            <p className="text-xs text-slate-300">نسبة العمولة المعتمدة حاليًا</p>
            <p className="mt-1 text-3xl font-black text-amber-300">{COMMISSION_RATE * 100}%</p>
          </div>
        </div>
      </section>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Users} label="إجمالي الوكلاء" value={accounts.length} note={`${accounts.filter((item) => item.active).length} وكيل فعّال`} tone="bg-primary/10 text-primary" />
        <Metric icon={FileCheck2} label="الوثائق الصادرة" value={totals.policies} note={`${totals.activePolicies} وثيقة فعّالة`} tone="bg-blue-50 text-blue-600" />
        <Metric icon={Banknote} label="إجمالي الأقساط" value={formatCurrency(totals.grossPremium)} note={`الصافي ${formatCurrency(totals.netProduction)}`} tone="bg-emerald-50 text-emerald-600" />
        <Metric icon={BadgeDollarSign} label="العمولات المستحقة" value={formatCurrency(totals.earnedCommission)} note={`استردادات ${formatCurrency(totals.refunds)}`} tone="bg-amber-50 text-amber-600" />
      </div>

      <AgentAccountsDashboard accounts={accounts} />
    </AppShell>
  );
}

function Metric({ icon: Icon, label, value, note, tone }: {
  icon: typeof BriefcaseBusiness;
  label: string;
  value: string | number;
  note: string;
  tone: string;
}) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tone}`}><Icon className="h-6 w-6" /></span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-2xl font-black">{value}</p>
          <p className="mt-1 truncate text-[11px] text-muted-foreground">{note}</p>
        </div>
      </CardContent>
    </Card>
  );
}
