import Link from "next/link";
import {
  BadgeDollarSign,
  Calculator,
  CarFront,
  FileCheck2,
  Percent,
  ReceiptText,
  ShieldCheck
} from "lucide-react";
import { MotorRequestStatus } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/page-guard";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

const COMPANY_SHARE_RATE = 0.3;
const REMAINING_RATE = 0.7;
const FIXED_SERVICE_USD = 10;

export default async function MotorAccountsPage() {
  await requirePagePermission("motorAccountsRead");

  const requests = await prisma.motorInsuranceRequest.findMany({
    where: {
      OR: [
        { policyIssuedAt: { not: null } },
        { issuedPolicyNumber: { not: null } },
        { status: MotorRequestStatus.APPROVED }
      ]
    },
    orderBy: [{ policyIssuedAt: "desc" }, { approvedAt: "desc" }, { createdAt: "desc" }],
    take: 200,
    select: {
      id: true,
      requestNumber: true,
      status: true,
      customerFullName: true,
      manufacturer: true,
      model: true,
      manufacturingYear: true,
      plateNumber: true,
      insurancePremium: true,
      discount: true,
      additionalFees: true,
      taxes: true,
      netPremium: true,
      pricingCurrency: true,
      pricingNotes: true,
      approvedAt: true,
      approvedByName: true,
      issuedPolicyNumber: true,
      policyIssuedAt: true
    }
  });

  const accounts = requests.map((request) => {
    const grossPremium = toNumber(request.insurancePremium);
    const netPremium = toNumber(request.netPremium) || grossPremium;
    const companyShare = netPremium * COMPANY_SHARE_RATE;
    const remainingShare = netPremium * REMAINING_RATE;
    const remainingAfterFixedFee = request.pricingCurrency === "USD"
      ? Math.max(0, remainingShare - FIXED_SERVICE_USD)
      : remainingShare;

    return {
      ...request,
      grossPremium,
      netPremium,
      companyShare,
      remainingShare,
      fixedServiceFeeUsd: FIXED_SERVICE_USD,
      remainingAfterFixedFee
    };
  });

  const totals = accounts.reduce((sum, account) => {
    addCurrency(sum.netPremiumByCurrency, account.pricingCurrency, account.netPremium);
    addCurrency(sum.companyShareByCurrency, account.pricingCurrency, account.companyShare);
    addCurrency(sum.remainingByCurrency, account.pricingCurrency, account.remainingShare);
    return {
      ...sum,
      documents: sum.documents + 1,
      issued: sum.issued + (account.policyIssuedAt || account.issuedPolicyNumber ? 1 : 0),
      approvedOnly: sum.approvedOnly + (!account.policyIssuedAt && !account.issuedPolicyNumber ? 1 : 0),
      fixedFeesUsd: sum.fixedFeesUsd + FIXED_SERVICE_USD
    };
  }, {
    documents: 0,
    issued: 0,
    approvedOnly: 0,
    fixedFeesUsd: 0,
    netPremiumByCurrency: {} as Record<string, number>,
    companyShareByCurrency: {} as Record<string, number>,
    remainingByCurrency: {} as Record<string, number>
  });

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary">
            <ReceiptText className="h-4 w-4" />
            Motor Policy Accounts
          </div>
          <h1 className="text-2xl font-black tracking-normal text-slate-950 dark:text-foreground sm:text-3xl">حسابات وثائق تأمين المركبات</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            متابعة مالية لكل وثيقة مركبات بعد الموافقة أو الإصدار، مع تفصيل القسط الكامل 100%، حصة 30%، المتبقي 70%، ورسم ثابت 10 دولار من المتبقي.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/motor-requests">
            <CarFront className="h-4 w-4" />
            طلبات تأمين المركبات
          </Link>
        </Button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={FileCheck2} label="الوثائق المحتسبة" value={totals.documents} note={`${totals.issued} مصدرة، ${totals.approvedOnly} موافق عليها`} tone="bg-primary/10 text-primary" />
        <Metric icon={BadgeDollarSign} label="إجمالي القسط 100%" value={formatGroupedTotals(totals.netPremiumByCurrency)} note="حسب صافي القسط المعتمد" tone="bg-emerald-50 text-emerald-700" />
        <Metric icon={Percent} label="حصة 30%" value={formatGroupedTotals(totals.companyShareByCurrency)} note="30% من إجمالي القسط" tone="bg-blue-50 text-blue-700" />
        <Metric icon={Calculator} label="رسم 10 دولار" value={formatMoney(totals.fixedFeesUsd, "USD")} note="10 دولار لكل وثيقة من المتبقي" tone="bg-amber-50 text-amber-700" />
      </div>

      <Card>
        <CardHeader className="border-b bg-muted/10">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            تفاصيل حسابات وثائق المركبات
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {accounts.length ? (
            <div className="divide-y">
              {accounts.map((account) => (
                <div key={account.id} className="grid gap-5 p-5 xl:grid-cols-[1.1fr_1.8fr_auto]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-sm font-black text-primary" dir="ltr">{account.issuedPolicyNumber || account.requestNumber}</p>
                      <Badge className={account.policyIssuedAt || account.issuedPolicyNumber ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-blue-200 bg-blue-50 text-blue-700"}>
                        {account.policyIssuedAt || account.issuedPolicyNumber ? "وثيقة مصدرة" : "موافق عليها"}
                      </Badge>
                    </div>
                    <p className="mt-3 text-base font-black">{account.customerFullName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {account.manufacturer} {account.model} {account.manufacturingYear} · <span dir="ltr">{account.plateNumber}</span>
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {account.policyIssuedAt ? `تاريخ الإصدار: ${formatDate(account.policyIssuedAt)}` : account.approvedAt ? `تاريخ الموافقة: ${formatDate(account.approvedAt)}` : "بانتظار تاريخ الإصدار"}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Breakdown label="القسط الكامل 100%" value={formatMoney(account.netPremium, account.pricingCurrency)} note="صافي القسط بعد الخصم والرسوم والضريبة" strong />
                    <Breakdown label="30% من القسط" value={formatMoney(account.companyShare, account.pricingCurrency)} note="الحصة المحسوبة من 100%" />
                    <Breakdown label="المتبقي 70%" value={formatMoney(account.remainingShare, account.pricingCurrency)} note="بعد استقطاع 30%" />
                    <Breakdown label="رسم ثابت" value={formatMoney(account.fixedServiceFeeUsd, "USD")} note="يحسب من المتبقي 70%" />
                    <Breakdown label="المتبقي بعد الرسم" value={formatRemainingAfterFee(account)} note="الرسم بالدولار حسب المطلوب" />
                    <Breakdown label="ملاحظات التسعير" value={account.pricingNotes || "لا توجد ملاحظات"} note={account.approvedByName ? `اعتمد بواسطة ${account.approvedByName}` : "مرتبطة بسجل الطلب"} />
                  </div>

                  <div className="flex items-start xl:justify-end">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/motor-requests/${account.id}`}>
                        عرض الوثيقة
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-lg bg-primary/10 text-primary">
                <ReceiptText className="h-7 w-7" />
              </div>
              <p className="font-bold">لا توجد وثائق مركبات موافق عليها أو مصدرة للحسابات حالياً.</p>
              <p className="mt-2 text-sm text-muted-foreground">ستظهر الحسابات تلقائياً بعد الموافقة على الطلب أو إصدار رقم الوثيقة.</p>
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

function Breakdown({ label, value, note, strong = false }: {
  label: string;
  value: string;
  note: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-border dark:bg-card">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 truncate ${strong ? "text-lg font-black text-primary" : "text-sm font-black"}`} dir="ltr">{value}</p>
      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted-foreground">{note}</p>
    </div>
  );
}

function toNumber(value: unknown) {
  return Number(value ?? 0);
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

function formatRemainingAfterFee(account: { pricingCurrency: string; remainingAfterFixedFee: number; remainingShare: number }) {
  if (account.pricingCurrency === "USD") return formatMoney(account.remainingAfterFixedFee, "USD");
  return `${formatMoney(account.remainingShare, account.pricingCurrency)} - ${formatMoney(FIXED_SERVICE_USD, "USD")}`;
}
