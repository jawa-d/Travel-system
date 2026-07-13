import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/page-guard";
import { prisma } from "@/lib/prisma";
import { referralStatusLabels, referralTypeLabels, transportModeLabels } from "@/lib/referrals";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ReferralDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePagePermission("referralsRead");
  const { id } = await params;
  const referral = await prisma.referral.findFirst({
    where: { id, ...(user.role === Role.BANK ? { createdById: user.id } : {}) },
    include: { installments: true, commission: true }
  });
  if (!referral) notFound();

  return (
    <AppShell>
      <div className="mb-6">
        <div className="mb-2 text-sm font-semibold text-primary" dir="ltr">{referral.referralNumber}</div>
        <h1 className="text-2xl font-black sm:text-3xl">{referral.applicantName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{referralStatusLabels[referral.status]} - {referralTypeLabels[referral.type]}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader><CardTitle>تفاصيل الحالة</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Info label="المستفيد" value={referral.beneficiaryName} />
            <Info label="مبلغ التأمين" value={`${formatCurrency(Number(referral.insuredAmount))} ${referral.currency}`} />
            <Info label="مدة التأمين" value={`${formatDate(referral.insuranceFrom)} الى ${formatDate(referral.insuranceTo)}`} />
            <Info label="بعد الزيادة" value={`${formatCurrency(Number(referral.totalInsuredAfterIncrease))} - ${referral.increaseRate}%`} />
            <Info label="نوع الغطاء" value={referral.coverType} />
            <Info label="البضاعة المنقولة" value={referral.cargoDescription} />
            <Info label="مسار الرحلة" value={`${referral.routeFrom} الى ${referral.routeTo}`} />
            <Info label="نوع النقل" value={transportModeLabels[referral.transportMode]} />
            <Info label="نوع التغليف" value={referral.packagingType} />
            <Info label="LC NO" value={referral.lcNumber || "-"} />
            <Info label="واسطة النقل" value={referral.carrierName || "-"} />
            <Info label="Invoice" value={referral.invoiceNumber} />
            <Info label="الأخطار الإضافية" value={referral.extraRisks.length ? referral.extraRisks.join("، ") : "-"} />
            <Info label="تعويض سابق" value={referral.hasPreviousCompensation ? "نعم" : "لا"} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>دفعات القسط</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {referral.installments.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <span>{item.label}{item.dueDate ? ` - ${formatDate(item.dueDate)}` : ""}</span>
                  <strong dir="ltr">{formatCurrency(Number(item.amount))}</strong>
                </div>
              ))}
              <div className="rounded-lg bg-primary/10 p-3 font-black text-primary">القسط الكلي: {formatCurrency(Number(referral.totalPremium))}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>العمولة</CardTitle></CardHeader>
            <CardContent>
              {referral.commission ? (
                <div className="space-y-2 text-sm">
                  <Info label="مبلغ العمولة" value={`${formatCurrency(Number(referral.commission.commissionAmount))} ${referral.commission.currency}`} />
                  <Info label="النسبة" value={`${referral.commission.commissionRate}%`} />
                  <Info label="مصروفة إلى" value={referral.commission.paidToBank || referral.commission.paidToName || "-"} />
                </div>
              ) : <p className="text-sm text-muted-foreground">لم يتم صرف العمولة بعد.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border bg-muted/10 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-bold">{value}</p></div>;
}
