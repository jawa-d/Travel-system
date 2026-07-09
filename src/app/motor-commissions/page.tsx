import Link from "next/link";
import { BadgeDollarSign, BarChart3, CarFront, CheckCircle2, Percent, ReceiptText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/page-guard";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function MotorCommissionsPage() {
  await requirePagePermission("motorCommissionsRead");

  const [commissions, totalRequests] = await Promise.all([
    prisma.motorCommission.findMany({
      orderBy: { paidAt: "desc" },
      include: {
        motorRequest: {
          select: {
            id: true,
            requestNumber: true,
            customerFullName: true,
            manufacturer: true,
            model: true,
            plateNumber: true,
            agentName: true,
            issuedPolicyNumber: true,
            policyIssuedAt: true,
            status: true
          }
        }
      },
      take: 300
    }),
    prisma.motorInsuranceRequest.count()
  ]);

  const totals = commissions.reduce((sum, item) => {
    addCurrency(sum.premiumByCurrency, item.currency, Number(item.premiumAmount));
    addCurrency(sum.commissionByCurrency, item.currency, Number(item.commissionAmount));
    return {
      ...sum,
      paid: sum.paid + (item.paid ? 1 : 0),
      rateTotal: sum.rateTotal + Number(item.commissionRate)
    };
  }, {
    paid: 0,
    rateTotal: 0,
    premiumByCurrency: {} as Record<string, number>,
    commissionByCurrency: {} as Record<string, number>
  });

  const averageRate = commissions.length ? totals.rateTotal / commissions.length : 0;

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary">
            <BadgeDollarSign className="h-4 w-4" />
            Motor Commissions
          </div>
          <h1 className="text-2xl font-black tracking-normal text-slate-950 dark:text-foreground sm:text-3xl">عمولات المركبات</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            متابعة عمولات طلبات تأمين المركبات، الطلب المرتبط، رقم الريكوست، قيمة العمولة، وحالة الصرف.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/motor-requests">
            <CarFront className="h-4 w-4" />
            طلبات المركبات
          </Link>
        </Button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={ReceiptText} label="طلبات المركبات" value={totalRequests} note="إجمالي الريكوستات المسجلة" tone="bg-primary/10 text-primary" />
        <Metric icon={CheckCircle2} label="تم صرفها" value={totals.paid} note="عدد العمولات المصروفة" tone="bg-emerald-50 text-emerald-700" />
        <Metric icon={BadgeDollarSign} label="إجمالي العمولات" value={formatGroupedTotals(totals.commissionByCurrency)} note="حسب عملة القسط" tone="bg-amber-50 text-amber-700" />
        <Metric icon={Percent} label="متوسط النسبة" value={`${averageRate.toFixed(2)}%`} note="متوسط نسب الصرف" tone="bg-blue-50 text-blue-700" />
      </div>

      <Card className="mb-6">
        <CardHeader className="border-b bg-muted/10">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            تقرير مختصر
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-5 md:grid-cols-2">
          <ReportLine label="إجمالي الأقساط المرتبطة بالعمولات" value={formatGroupedTotals(totals.premiumByCurrency)} />
          <ReportLine label="إجمالي العمولة المصروفة" value={formatGroupedTotals(totals.commissionByCurrency)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/10">
          <CardTitle>سجل عمولات المركبات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {commissions.length ? (
            <div className="divide-y">
              {commissions.map((commission) => (
                <div key={commission.id} className="grid gap-4 p-5 xl:grid-cols-[1.2fr_1fr_1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-sm font-black text-primary" dir="ltr">{commission.motorRequest.requestNumber}</p>
                      <Badge className={commission.paid ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>
                        {commission.paid ? "تم الصرف" : "غير مصروفة"}
                      </Badge>
                    </div>
                    <p className="mt-2 font-black">{commission.motorRequest.customerFullName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {commission.motorRequest.manufacturer} {commission.motorRequest.model} · <span dir="ltr">{commission.motorRequest.plateNumber}</span>
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">القسط والعمولة</p>
                    <p className="mt-1 text-sm font-black" dir="ltr">{formatMoney(Number(commission.premiumAmount), commission.currency)}</p>
                    <p className="mt-1 text-sm font-black text-emerald-700" dir="ltr">{formatMoney(Number(commission.commissionAmount), commission.currency)}</p>
                    <p className="mt-1 text-xs text-muted-foreground" dir="ltr">{Number(commission.commissionRate).toFixed(2)}%</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">بيانات الصرف</p>
                    <p className="mt-1 text-sm font-bold">{commission.paidByName ?? "-"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(commission.paidAt)}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{commission.notes || "لا توجد ملاحظات"}</p>
                  </div>

                  <div className="flex items-start xl:justify-end">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/motor-requests/${commission.motorRequest.id}`}>عرض الطلب</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-lg bg-primary/10 text-primary">
                <BadgeDollarSign className="h-7 w-7" />
              </div>
              <p className="font-bold">لا توجد عمولات مركبات مصروفة بعد.</p>
              <p className="mt-2 text-sm text-muted-foreground">اضغط “صرف العمولة” من سجل طلبات المركبات لتظهر هنا.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Metric({ icon: Icon, label, value, note, tone }: {
  icon: typeof ReceiptText;
  label: string;
  value: string | number;
  note: string;
  tone: string;
}) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${tone}`}><Icon className="h-6 w-6" /></span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-2xl font-black" dir="ltr">{value}</p>
          <p className="mt-1 truncate text-[11px] text-muted-foreground">{note}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-4 dark:bg-card">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-black text-primary" dir="ltr">{value}</p>
    </div>
  );
}

function addCurrency(target: Record<string, number>, currency: string, amount: number) {
  target[currency || "IQD"] = (target[currency || "IQD"] ?? 0) + amount;
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "IQD",
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount)} ${currency || "IQD"}`;
  }
}

function formatGroupedTotals(values: Record<string, number>) {
  const entries = Object.entries(values);
  if (!entries.length) return formatMoney(0, "IQD");
  return entries.map(([currency, amount]) => formatMoney(amount, currency)).join(" / ");
}
