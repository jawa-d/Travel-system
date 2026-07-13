import Link from "next/link";
import { endOfDay, startOfDay } from "date-fns";
import { BadgeDollarSign, Download, FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/page-guard";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ReferralCommissionsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; bank?: string; referralNumber?: string }> }) {
  await requirePagePermission("referralCommissionsRead");
  const params = await searchParams;
  const from = params.from ? startOfDay(new Date(params.from)) : undefined;
  const to = params.to ? endOfDay(new Date(params.to)) : undefined;
  const commissions = await prisma.referralCommission.findMany({
    where: {
      referral: {
        ...(from || to ? { createdAt: { gte: from, lte: to } } : {}),
        ...(params.referralNumber ? { referralNumber: { contains: params.referralNumber, mode: "insensitive" } } : {}),
        ...(params.bank ? { OR: [
          { createdByBank: { contains: params.bank, mode: "insensitive" } },
          { createdByName: { contains: params.bank, mode: "insensitive" } },
          { createdByEmail: { contains: params.bank, mode: "insensitive" } }
        ] } : {})
      }
    },
    include: { referral: true },
    orderBy: { paidAt: "desc" }
  });
  const grouped = new Map<string, { bank: string; referralCount: number; commissionTotal: number; premiumTotal: number }>();
  for (const commission of commissions) {
    const bank = commission.paidToBank || commission.referral.createdByBank || commission.paidToName || commission.referral.createdByName || "غير محدد";
    const current = grouped.get(bank) ?? { bank, referralCount: 0, commissionTotal: 0, premiumTotal: 0 };
    current.referralCount += 1;
    current.commissionTotal += Number(commission.commissionAmount);
    current.premiumTotal += Number(commission.premiumAmount);
    grouped.set(bank, current);
  }
  const summaries = [...grouped.values()].sort((a, b) => b.commissionTotal - a.commissionTotal);
  const totalCommission = commissions.reduce((sum, item) => sum + Number(item.commissionAmount), 0);
  const query = new URLSearchParams({
    ...(params.from ? { from: params.from } : {}),
    ...(params.to ? { to: params.to } : {}),
    ...(params.bank ? { bank: params.bank } : {}),
    ...(params.referralNumber ? { referralNumber: params.referralNumber } : {})
  });

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary"><BadgeDollarSign className="h-4 w-4" />عمولات الإحالات</div>
          <h1 className="text-2xl font-black sm:text-3xl">كشف عمولات المصارف</h1>
          <p className="mt-2 text-sm text-muted-foreground">كشف كامل حسب المصرف مع عدد الإحالات ومبالغ العمولات وأرقام الحالات.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href={`/api/referral-commissions?${query}&format=xlsx`}><Download className="h-4 w-4" />XLSX</Link></Button>
          <Button asChild><Link href={`/api/referral-commissions?${query}&format=pdf`}><FileText className="h-4 w-4" />PDF</Link></Button>
        </div>
      </div>

      <form className="mb-6 grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
        <input name="from" type="date" defaultValue={params.from} className="h-11 rounded-md border bg-background px-3 text-sm" />
        <input name="to" type="date" defaultValue={params.to} className="h-11 rounded-md border bg-background px-3 text-sm" />
        <input name="bank" defaultValue={params.bank} placeholder="المصرف/المستخدم" className="h-11 rounded-md border bg-background px-3 text-sm" />
        <input name="referralNumber" defaultValue={params.referralNumber} placeholder="رقم الحالة" className="h-11 rounded-md border bg-background px-3 text-sm" dir="ltr" />
        <Button>بحث</Button>
      </form>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Metric title="عدد المصارف" value={summaries.length} />
        <Metric title="عدد العمولات" value={commissions.length} />
        <Metric title="إجمالي العمولات" value={formatCurrency(totalCommission)} />
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>ملخص حسب المصرف</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="p-3 text-right">المصرف/المستخدم</th>
                <th className="p-3 text-right">عدد الإحالات</th>
                <th className="p-3 text-right">إجمالي الأقساط</th>
                <th className="p-3 text-right">إجمالي العمولات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {summaries.map((item) => (
                <tr key={item.bank}>
                  <td className="p-3 font-bold">{item.bank}</td>
                  <td className="p-3">{item.referralCount}</td>
                  <td className="p-3" dir="ltr">{formatCurrency(item.premiumTotal)}</td>
                  <td className="p-3" dir="ltr">{formatCurrency(item.commissionTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>تفاصيل العمولات</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="p-3 text-right">رقم الحالة</th>
                <th className="p-3 text-right">المصرف/المستخدم</th>
                <th className="p-3 text-right">طالب التأمين</th>
                <th className="p-3 text-right">القسط</th>
                <th className="p-3 text-right">العمولة</th>
                <th className="p-3 text-right">تاريخ الصرف</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {commissions.map((item) => (
                <tr key={item.id}>
                  <td className="p-3 font-mono font-black text-primary" dir="ltr">{item.referral.referralNumber}</td>
                  <td className="p-3">{item.paidToBank || item.referral.createdByBank || item.paidToName || item.referral.createdByName || "-"}</td>
                  <td className="p-3">{item.referral.applicantName || "-"}</td>
                  <td className="p-3" dir="ltr">{formatCurrency(Number(item.premiumAmount))}</td>
                  <td className="p-3" dir="ltr">{formatCurrency(Number(item.commissionAmount))}</td>
                  <td className="p-3">{formatDate(item.paidAt)}</td>
                </tr>
              ))}
              {!commissions.length ? <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">لا توجد عمولات ضمن البحث المحدد.</td></tr> : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Metric({ title, value }: { title: string; value: string | number }) {
  return <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 text-2xl font-black">{value}</p></CardContent></Card>;
}
