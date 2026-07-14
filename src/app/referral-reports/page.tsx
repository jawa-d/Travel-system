import Link from "next/link";
import { endOfDay, endOfMonth, endOfQuarter, startOfDay, startOfMonth, startOfQuarter } from "date-fns";
import { ReferralStatus } from "@prisma/client";
import { ClipboardCheck, Download, FileText, ShieldAlert, WalletCards } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/page-guard";
import { prisma } from "@/lib/prisma";
import { addCurrencyTotal, formatCurrencyTotals, formatReferralMoney, referralStatusLabels } from "@/lib/referrals";
import { formatDate } from "@/lib/utils";

type ReportType = "monthly-operational" | "quarterly-regulatory";

type Params = {
  type?: string;
  from?: string;
  to?: string;
  bank?: string;
  status?: string;
  applicant?: string;
  referralNumber?: string;
};

export default async function ReferralReportsPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requirePagePermission("referralReportsRead");
  const params = await searchParams;
  const reportType = (params.type === "quarterly-regulatory" ? "quarterly-regulatory" : "monthly-operational") satisfies ReportType;
  const now = new Date();
  const from = params.from ? startOfDay(new Date(params.from)) : reportType === "quarterly-regulatory" ? startOfQuarter(now) : startOfMonth(now);
  const to = params.to ? endOfDay(new Date(params.to)) : reportType === "quarterly-regulatory" ? endOfQuarter(now) : endOfMonth(now);
  const status = Object.values(ReferralStatus).includes(params.status as ReferralStatus) ? params.status as ReferralStatus : undefined;
  const where = {
    AND: [
      { createdAt: { gte: from, lte: to } },
      status ? { status } : {},
      params.referralNumber ? { referralNumber: { contains: params.referralNumber, mode: "insensitive" as const } } : {},
      params.applicant ? { applicantName: { contains: params.applicant, mode: "insensitive" as const } } : {},
      params.bank ? { OR: [
        { beneficiaryName: { contains: params.bank, mode: "insensitive" as const } },
        { createdByBank: { contains: params.bank, mode: "insensitive" as const } },
        { createdByName: { contains: params.bank, mode: "insensitive" as const } },
        { createdByEmail: { contains: params.bank, mode: "insensitive" as const } }
      ] } : {}
    ]
  };
  const bankOptionWhere = {
    AND: [
      { createdAt: { gte: from, lte: to } },
      status ? { status } : {},
      params.referralNumber ? { referralNumber: { contains: params.referralNumber, mode: "insensitive" as const } } : {},
      params.applicant ? { applicantName: { contains: params.applicant, mode: "insensitive" as const } } : {}
    ]
  };

  const [referrals, bankSources] = await Promise.all([
    prisma.referral.findMany({
      where,
      include: { commission: true, installments: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.referral.findMany({
      where: bankOptionWhere,
      select: { beneficiaryName: true, createdByBank: true, createdByName: true, createdByEmail: true },
      orderBy: { createdAt: "desc" }
    })
  ]);
  const bankOptions = Array.from(new Set(bankSources
    .flatMap((item) => [item.beneficiaryName, item.createdByBank, item.createdByName, item.createdByEmail])
    .filter((value): value is string => Boolean(value?.trim()))
  )).sort((a, b) => a.localeCompare(b, "ar"));

  const issuedCount = referrals.filter((item) => item.status === "ISSUED").length;
  const premiumByCurrency: Record<string, number> = {};
  const commissionByCurrency: Record<string, number> = {};
  const bankSummaries = new Map<string, { bank: string; referralCount: number; issuedCount: number; premiumByCurrency: Record<string, number>; commissionByCurrency: Record<string, number> }>();
  referrals.forEach((item) => {
    addCurrencyTotal(premiumByCurrency, item.currency, Number(item.totalPremium));
    addCurrencyTotal(commissionByCurrency, item.currency, Number(item.commission?.commissionAmount ?? 0));
    const bank = item.beneficiaryName || item.createdByBank || item.createdByName || "غير محدد";
    const summary = bankSummaries.get(bank) ?? { bank, referralCount: 0, issuedCount: 0, premiumByCurrency: {}, commissionByCurrency: {} };
    summary.referralCount += 1;
    if (item.status === "ISSUED") summary.issuedCount += 1;
    addCurrencyTotal(summary.premiumByCurrency, item.currency, Number(item.totalPremium));
    addCurrencyTotal(summary.commissionByCurrency, item.currency, Number(item.commission?.commissionAmount ?? 0));
    bankSummaries.set(bank, summary);
  });
  const bankSummaryRows = Array.from(bankSummaries.values()).sort((a, b) => b.referralCount - a.referralCount);
  const conversionRate = referrals.length ? issuedCount / referrals.length * 100 : 0;
  const incompleteForms = referrals.filter((item) => referralCompletion(item) < 80).length;
  const complianceScore = referrals.length ? Math.round(referrals.reduce((sum, item) => sum + referralCompletion(item), 0) / referrals.length) : 100;
  const riskLevel = complianceScore >= 90 ? "منخفض" : complianceScore >= 70 ? "متوسط" : "مرتفع";
  const query = new URLSearchParams({
    type: reportType,
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    ...(params.bank ? { bank: params.bank } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.applicant ? { applicant: params.applicant } : {}),
    ...(params.referralNumber ? { referralNumber: params.referralNumber } : {})
  });

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary"><WalletCards className="h-4 w-4" />تقارير الإحالات</div>
          <h1 className="text-2xl font-black sm:text-3xl">{reportType === "quarterly-regulatory" ? "تقرير ربع سنوي رقابي" : "تقرير شهري تشغيلي"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">بحث تفصيلي حسب المصرف المستفيد، الجهة الرافعة، الحالة، طالب التأمين، ورقم الحالة مع تصدير PDF وXLSX.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href={`/api/referral-reports?${query}&format=xlsx`}><Download className="h-4 w-4" />XLSX</Link></Button>
          <Button asChild><Link href={`/api/referral-reports?${query}&format=pdf`}><FileText className="h-4 w-4" />PDF</Link></Button>
        </div>
      </div>

      <form className="mb-6 grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2 xl:grid-cols-[220px_1fr_1fr_1fr_1fr_1fr_1fr_auto]">
        <select name="type" defaultValue={reportType} className="h-11 rounded-md border bg-background px-3 text-sm">
          <option value="monthly-operational">تقرير شهري تشغيلي</option>
          <option value="quarterly-regulatory">تقرير ربع سنوي رقابي</option>
        </select>
        <input name="from" type="date" defaultValue={from.toISOString().slice(0, 10)} className="h-11 rounded-md border bg-background px-3 text-sm" />
        <input name="to" type="date" defaultValue={to.toISOString().slice(0, 10)} className="h-11 rounded-md border bg-background px-3 text-sm" />
        <select name="bank" defaultValue={params.bank ?? ""} className="h-11 rounded-md border bg-background px-3 text-sm">
          <option value="">كل المصارف/المستفيدين/المستخدمين</option>
          {bankOptions.map((bank) => <option key={bank} value={bank}>{bank}</option>)}
        </select>
        <select name="status" defaultValue={params.status ?? ""} className="h-11 rounded-md border bg-background px-3 text-sm">
          <option value="">كل الحالات</option>
          {Object.entries(referralStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <input name="applicant" defaultValue={params.applicant} placeholder="طالب التأمين" className="h-11 rounded-md border bg-background px-3 text-sm" />
        <input name="referralNumber" defaultValue={params.referralNumber} placeholder="رقم الحالة" className="h-11 rounded-md border bg-background px-3 text-sm" dir="ltr" />
        <Button>تطبيق</Button>
      </form>

      {reportType === "monthly-operational" ? (
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Metric title="عدد الإحالات" value={referrals.length} />
          <Metric title="عدد الوثائق الصادرة" value={issuedCount} />
          <Metric title="معدل/نسبة التحويل" value={`${conversionRate.toFixed(1)}%`} />
          <Metric title="إجمالي الاشتراكات" value={formatCurrencyTotals(premiumByCurrency)} />
          <Metric title="إجمالي العمولات" value={formatCurrencyTotals(commissionByCurrency)} />
        </div>
      ) : (
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric title="مراجعة الالتزام بنموذج الإحالة" value={`${complianceScore}%`} />
          <Metric title="حالات الشكاوى" value="0" />
          <Metric title="أي مخالفات تنظيمية" value="0" />
          <Metric title="تقييم مخاطر الامتثال" value={riskLevel} />
        </div>
      )}

      {reportType === "quarterly-regulatory" ? (
        <Card className="mb-6">
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-primary" />ملخص رقابي</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Info label="نماذج تحتاج إكمال" value={incompleteForms} />
            <Info label="أساس تقييم الالتزام" value="اكتمال الحقول الأساسية في نموذج الإحالة" />
            <Info label="الشكاوى" value="لا توجد شكاوى مسجلة ضمن النظام الحالي" />
            <Info label="المخالفات التنظيمية" value="لا توجد مخالفات مسجلة ضمن النظام الحالي" />
          </CardContent>
        </Card>
      ) : null}

      <Card className="mb-6">
        <CardHeader><CardTitle className="flex items-center gap-2"><WalletCards className="h-5 w-5 text-primary" />ملخص حسب المصرف المستفيد</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[780px] text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="p-3 text-right">المصرف/المستفيد</th>
                <th className="p-3 text-right">عدد الإحالات</th>
                <th className="p-3 text-right">تم الإصدار</th>
                <th className="p-3 text-right">إجمالي الأقساط</th>
                <th className="p-3 text-right">إجمالي العمولات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bankSummaryRows.map((item) => (
                <tr key={item.bank}>
                  <td className="p-3 font-bold">{item.bank}</td>
                  <td className="p-3">{item.referralCount}</td>
                  <td className="p-3">{item.issuedCount}</td>
                  <td className="whitespace-pre-line p-3" dir="ltr">{formatCurrencyTotals(item.premiumByCurrency)}</td>
                  <td className="whitespace-pre-line p-3" dir="ltr">{formatCurrencyTotals(item.commissionByCurrency)}</td>
                </tr>
              ))}
              {!bankSummaryRows.length ? <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">لا توجد بيانات ملخص ضمن معايير البحث.</td></tr> : null}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" />تفاصيل التقرير</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="p-3 text-right">رقم الحالة</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-right">طالب التأمين</th>
                <th className="p-3 text-right">المصرف المستفيد</th>
                <th className="p-3 text-right">الجهة الرافعة</th>
                <th className="p-3 text-right">القسط</th>
                <th className="p-3 text-right">العمولة</th>
                <th className="p-3 text-right">اكتمال النموذج</th>
                <th className="p-3 text-right">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {referrals.map((item) => (
                <tr key={item.id}>
                  <td className="p-3 font-mono font-black text-primary" dir="ltr">{item.referralNumber}</td>
                  <td className="p-3">{referralStatusLabels[item.status]}</td>
                  <td className="p-3">{item.applicantName || "-"}</td>
                  <td className="p-3">{item.beneficiaryName || "-"}</td>
                  <td className="p-3">{item.createdByBank || item.createdByName || "-"}</td>
                  <td className="p-3" dir="ltr">{formatReferralMoney(Number(item.totalPremium), item.currency)}</td>
                  <td className="p-3" dir="ltr">{formatReferralMoney(Number(item.commission?.commissionAmount ?? 0), item.currency)}</td>
                  <td className="p-3">{referralCompletion(item)}%</td>
                  <td className="p-3">{formatDate(item.createdAt)}</td>
                </tr>
              ))}
              {!referrals.length ? <tr><td colSpan={9} className="p-10 text-center text-muted-foreground">لا توجد بيانات ضمن معايير البحث المحددة.</td></tr> : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function referralCompletion(referral: {
  applicantName: string | null;
  beneficiaryName: string | null;
  insuredAmount: unknown;
  insuranceFrom: Date | null;
  insuranceTo: Date | null;
  totalInsuredAfterIncrease: unknown;
  coverType: string | null;
  cargoDescription: string | null;
  routeFrom: string | null;
  routeTo: string | null;
  transportMode: unknown;
  packagingType: string | null;
  invoiceNumber: string | null;
}) {
  const fields = [
    referral.applicantName,
    referral.beneficiaryName,
    referral.insuredAmount,
    referral.insuranceFrom,
    referral.insuranceTo,
    referral.totalInsuredAfterIncrease,
    referral.coverType,
    referral.cargoDescription,
    referral.routeFrom,
    referral.routeTo,
    referral.transportMode,
    referral.packagingType,
    referral.invoiceNumber
  ];
  return Math.round(fields.filter(Boolean).length / fields.length * 100);
}

function Metric({ title, value }: { title: string; value: string | number }) {
  return <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 whitespace-pre-line text-2xl font-black" dir="ltr">{value}</p></CardContent></Card>;
}

function Info({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg border bg-muted/10 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-bold">{value}</p></div>;
}

