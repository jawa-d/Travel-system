import Link from "next/link";
import { Banknote, Clock3, FileText, Plus, Ship, Users, WalletCards } from "lucide-react";
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
  const userSummaries = new Map<string, {
    name: string;
    bank: string | null;
    email: string | null;
    referralCount: number;
    issuedCount: number;
    premiumByCurrency: Record<string, number>;
    lastReferralAt: Date;
    lastReferralNumber: string;
  }>();

  referrals.forEach((item) => {
    addCurrencyTotal(premiumByCurrency, item.currency, Number(item.totalPremium));
    addCurrencyTotal(commissionByCurrency, item.currency, Number(item.commission?.commissionAmount ?? 0));

    const ownerName = item.createdByBank || item.createdByName || item.createdByEmail || "غير محدد";
    const current = userSummaries.get(ownerName) ?? {
      name: item.createdByName || ownerName,
      bank: item.createdByBank,
      email: item.createdByEmail,
      referralCount: 0,
      issuedCount: 0,
      premiumByCurrency: {},
      lastReferralAt: item.createdAt,
      lastReferralNumber: item.referralNumber
    };
    current.referralCount += 1;
    if (item.status === "ISSUED") current.issuedCount += 1;
    addCurrencyTotal(current.premiumByCurrency, item.currency, Number(item.totalPremium));
    if (item.createdAt > current.lastReferralAt) {
      current.lastReferralAt = item.createdAt;
      current.lastReferralNumber = item.referralNumber;
    }
    userSummaries.set(ownerName, current);
  });
  const issued = referrals.filter((item) => item.status === "ISSUED").length;
  const topUsers = Array.from(userSummaries.values())
    .sort((a, b) => b.referralCount - a.referralCount || b.lastReferralAt.getTime() - a.lastReferralAt.getTime())
    .slice(0, 6);

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

      {topUsers.length ? (
        <Card className="mb-6 overflow-hidden">
          <CardHeader className="border-b bg-muted/10">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              ملخص الجهات الرافعة
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {topUsers.map((item) => (
              <div key={`${item.bank ?? item.name}-${item.email ?? ""}`} className="rounded-lg border bg-background p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950 dark:text-foreground">{item.bank || item.name}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{item.bank && item.name !== item.bank ? item.name : item.email || "مستخدم داخلي"}</p>
                  </div>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <MiniStat label="الإحالات" value={item.referralCount} />
                  <MiniStat label="الصادر" value={item.issuedCount} />
                  <MiniStat label="التحويل" value={`${item.referralCount ? Math.round(item.issuedCount / item.referralCount * 100) : 0}%`} />
                </div>
                <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1"><Banknote className="h-3.5 w-3.5" /> إجمالي الأقساط</span>
                    <strong className="text-slate-900 dark:text-foreground" dir="ltr">{formatCurrencyTotals(item.premiumByCurrency)}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> آخر إحالة</span>
                    <strong className="font-mono text-slate-900 dark:text-foreground" dir="ltr">{item.lastReferralNumber}</strong>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

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
                createdByEmail: item.createdByEmail,
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

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-muted/30 px-2 py-2">
      <p className="text-[11px] font-bold text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-black text-slate-950 dark:text-foreground">{value}</p>
    </div>
  );
}
