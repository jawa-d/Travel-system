import Link from "next/link";
import { Banknote, FileText, Plus, Ship, WalletCards } from "lucide-react";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { ReferralsList } from "@/components/referrals-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/page-guard";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { addCurrencyTotal, formatCurrencyTotals } from "@/lib/referrals";

export default async function ReferralsPage() {
  const user = await requirePagePermission("referralsRead");
  const where = user.role === Role.BANK ? { createdById: user.id } : undefined;
  const referrals = await prisma.referral.findMany({
    where,
    include: { commission: { select: { id: true, commissionAmount: true } } },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  const premiumByCurrency: Record<string, number> = {};
  const commissionByCurrency: Record<string, number> = {};
  referrals.forEach((item) => {
    addCurrencyTotal(premiumByCurrency, item.currency, Number(item.totalPremium));
    addCurrencyTotal(commissionByCurrency, item.currency, Number(item.commission?.commissionAmount ?? 0));
  });
  const issued = referrals.filter((item) => item.status === "ISSUED").length;

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary"><Ship className="h-4 w-4" />الإحالات البحرية</div>
          <h1 className="text-2xl font-black tracking-normal text-slate-950 dark:text-foreground sm:text-3xl">الحالات والإحالات</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">رفع ومتابعة الإحالات البحرية مع دفعات القسط وحالة الإصدار والعمولات.</p>
        </div>
        {can(user.role, "referralsCreate") ? (
          <Button asChild><Link href="/referrals/new"><Plus className="h-4 w-4" />رفع إحالة</Link></Button>
        ) : null}
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Metric title="إجمالي الإحالات" value={referrals.length} icon={FileText} />
        <Metric title="تم الإصدار" value={issued} icon={Ship} />
        <Metric title="إجمالي الأقساط" value={formatCurrencyTotals(premiumByCurrency)} icon={Banknote} />
        <Metric title="العمولات المصروفة" value={formatCurrencyTotals(commissionByCurrency)} icon={WalletCards} />
      </div>

      <Card>
        <CardHeader className="border-b bg-muted/10"><CardTitle>سجل الإحالات</CardTitle></CardHeader>
        <CardContent className="p-0">
          {referrals.length ? (
            <ReferralsList
              referrals={referrals.map((item) => ({
                id: item.id,
                referralNumber: item.referralNumber,
                status: item.status,
                applicantName: item.applicantName,
                beneficiaryName: item.beneficiaryName,
                totalPremium: String(item.totalPremium),
                currency: item.currency,
                createdByName: item.createdByName,
                createdByBank: item.createdByBank,
                createdAt: item.createdAt.toISOString(),
                commission: item.commission ? { id: item.commission.id, commissionAmount: String(item.commission.commissionAmount) } : null
              }))}
              canManage={can(user.role, "referralsManage")}
              canPayCommission={can(user.role, "referralCommissionsWrite")}
              canDelete={can(user.role, "referralsDelete")}
            />
          ) : (
            <div className="p-10 text-center text-sm text-muted-foreground">لا توجد إحالات حتى الآن.</div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: string | number; icon: typeof FileText }) {
  return <Card><CardContent className="flex items-center justify-between gap-4 p-5"><div><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 text-2xl font-black">{value}</p></div><span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span></CardContent></Card>;
}

