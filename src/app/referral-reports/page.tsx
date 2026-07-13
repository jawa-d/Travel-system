import Link from "next/link";
import { Download, FileText, WalletCards } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/page-guard";
import { prisma } from "@/lib/prisma";
import { referralStatusLabels } from "@/lib/referrals";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ReferralReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  await requirePagePermission("referralReportsRead");
  const params = await searchParams;
  const from = params.from ? new Date(params.from) : undefined;
  const to = params.to ? new Date(params.to) : undefined;
  if (to) to.setHours(23, 59, 59, 999);
  const referrals = await prisma.referral.findMany({
    where: from || to ? { createdAt: { gte: from, lte: to } } : undefined,
    include: { commission: true },
    orderBy: { createdAt: "desc" }
  });
  const totalPremium = referrals.reduce((sum, item) => sum + Number(item.totalPremium), 0);
  const totalCommission = referrals.reduce((sum, item) => sum + Number(item.commission?.commissionAmount ?? 0), 0);
  const query = new URLSearchParams({ ...(params.from ? { from: params.from } : {}), ...(params.to ? { to: params.to } : {}) });

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary"><WalletCards className="h-4 w-4" />تقارير الإحالات</div>
          <h1 className="text-2xl font-black sm:text-3xl">تقرير الحالات والعمولات</h1>
          <p className="mt-2 text-sm text-muted-foreground">حساب كامل للإحالات، الأقساط، والعمولات المصروفة.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href={`/api/referral-reports?${query}&format=xlsx`}><Download className="h-4 w-4" />XLSX</Link></Button>
          <Button asChild><Link href={`/api/referral-reports?${query}&format=pdf`}><FileText className="h-4 w-4" />PDF</Link></Button>
        </div>
      </div>

      <form className="mb-6 grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[1fr_1fr_auto]">
        <input name="from" type="date" defaultValue={params.from} className="h-11 rounded-md border bg-background px-3 text-sm" />
        <input name="to" type="date" defaultValue={params.to} className="h-11 rounded-md border bg-background px-3 text-sm" />
        <Button>تطبيق</Button>
      </form>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Metric title="إجمالي الحالات" value={referrals.length} />
        <Metric title="إجمالي الأقساط" value={formatCurrency(totalPremium)} />
        <Metric title="إجمالي العمولات" value={formatCurrency(totalCommission)} />
      </div>

      <Card>
        <CardHeader><CardTitle>تفاصيل التقرير</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="p-3 text-right">رقم الإحالة</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-right">طالب التأمين</th>
                <th className="p-3 text-right">المصرف/المستخدم</th>
                <th className="p-3 text-right">القسط</th>
                <th className="p-3 text-right">العمولة</th>
                <th className="p-3 text-right">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {referrals.map((item) => (
                <tr key={item.id}>
                  <td className="p-3 font-mono font-black text-primary" dir="ltr">{item.referralNumber}</td>
                  <td className="p-3">{referralStatusLabels[item.status]}</td>
                  <td className="p-3">{item.applicantName}</td>
                  <td className="p-3">{item.createdByBank || item.createdByName || "-"}</td>
                  <td className="p-3" dir="ltr">{formatCurrency(Number(item.totalPremium))}</td>
                  <td className="p-3" dir="ltr">{formatCurrency(Number(item.commission?.commissionAmount ?? 0))}</td>
                  <td className="p-3">{formatDate(item.createdAt)}</td>
                </tr>
              ))}
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
