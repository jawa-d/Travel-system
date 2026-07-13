import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Pencil } from "lucide-react";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { ReferralForm } from "@/components/referral-form";
import { ReferralTakafulAttachments, type ReferralAttachment } from "@/components/referral-takaful-attachments";
import { Button } from "@/components/ui/button";
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
  const isGeneralManager = user.role === Role.SUPER_ADMIN;
  const canManageTakafulAttachments = user.role === Role.SUPER_ADMIN || user.role === Role.ADMIN || user.role === Role.UNDERWRITER || user.role === Role.FINANCE;
  const takafulAttachments = attachmentsFrom(referral.takafulAttachments);

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 text-sm font-semibold text-primary" dir="ltr">{referral.referralNumber}</div>
          <h1 className="text-2xl font-black sm:text-3xl">{text(referral.applicantName, "إحالة بدون اسم")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{referralStatusLabels[referral.status]} - {referralTypeLabels[referral.type]}</p>
        </div>
        {isGeneralManager ? (
          <Button asChild>
            <Link href={`/api/referrals/${referral.id}/pdf`}><Download className="h-4 w-4" />PDF</Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader><CardTitle>تفاصيل الحالة</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Info label="المستفيد" value={text(referral.beneficiaryName)} />
            <Info label="مبلغ التأمين" value={money(referral.insuredAmount, referral.currency)} />
            <Info label="مدة التأمين" value={`${date(referral.insuranceFrom)} الى ${date(referral.insuranceTo)}`} />
            <Info label="بعد الزيادة" value={`${money(referral.totalInsuredAfterIncrease, referral.currency)} - ${referral.increaseRate ?? 0}%`} />
            <Info label="نوع الغطاء" value={text(referral.coverType)} />
            <Info label="البضاعة المنقولة" value={text(referral.cargoDescription)} />
            <Info label="مسار الرحلة" value={`${text(referral.routeFrom)} الى ${text(referral.routeTo)}`} />
            <Info label="نوع النقل" value={referral.transportMode ? transportModeLabels[referral.transportMode] : "-"} />
            <Info label="نوع التغليف" value={text(referral.packagingType)} />
            <Info label="LC NO" value={text(referral.lcNumber)} />
            <Info label="واسطة النقل" value={text(referral.carrierName)} />
            <Info label="Invoice" value={text(referral.invoiceNumber)} />
            <Info label="الأخطار الإضافية" value={referral.extraRisks.length ? referral.extraRisks.join("، ") : "-"} />
            <Info label="تعويض سابق" value={referral.hasPreviousCompensation ? "نعم" : "لا"} />
            <Info label="نوت شرح" value={text(referral.notes)} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>دفعات القسط</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {referral.installments.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <span>{text(item.label, "دفعة")}{item.dueDate ? ` - ${formatDate(item.dueDate)}` : ""}</span>
                  <strong dir="ltr">{money(item.amount, referral.currency)}</strong>
                </div>
              ))}
              {!referral.installments.length ? <p className="text-sm text-muted-foreground">لا توجد دفعات مسجلة.</p> : null}
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
              ) : <p className="text-sm text-muted-foreground">لا يمكن صرف العمولة إلا عندما تكون حالة الإحالة تم الاصدار.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>مرفقات تكافل العراق</CardTitle></CardHeader>
            <CardContent>
              <ReferralTakafulAttachments
                referralId={referral.id}
                initialAttachments={takafulAttachments}
                canManage={canManageTakafulAttachments}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {isGeneralManager ? (
        <div className="mt-8">
          <div className="mb-4 flex items-center gap-2 text-lg font-black"><Pencil className="h-5 w-5 text-primary" />تعديل المدير العام</div>
          <ReferralForm
            canEditStatus
            initialData={{
              id: referral.id,
              type: referral.type,
              status: referral.status,
              applicantName: referral.applicantName ?? "",
              beneficiaryName: referral.beneficiaryName ?? "",
              insuredAmount: referral.insuredAmount ? String(referral.insuredAmount) : "",
              insuranceFrom: referral.insuranceFrom ? referral.insuranceFrom.toISOString().slice(0, 10) : "",
              insuranceTo: referral.insuranceTo ? referral.insuranceTo.toISOString().slice(0, 10) : "",
              totalInsuredAfterIncrease: referral.totalInsuredAfterIncrease ? String(referral.totalInsuredAfterIncrease) : "",
              increaseRate: referral.increaseRate ? String(referral.increaseRate) : "",
              coverType: referral.coverType ?? "",
              cargoDescription: referral.cargoDescription ?? "",
              routeFrom: referral.routeFrom ?? "",
              routeTo: referral.routeTo ?? "",
              transportMode: referral.transportMode ?? "",
              packagingType: referral.packagingType ?? "",
              lcNumber: referral.lcNumber ?? "",
              carrierName: referral.carrierName ?? "",
              invoiceNumber: referral.invoiceNumber ?? "",
              currency: referral.currency,
              extraRisks: referral.extraRisks,
              hasPreviousCompensation: referral.hasPreviousCompensation,
              totalPremium: String(referral.totalPremium),
              notes: referral.notes ?? "",
              installments: referral.installments.map((item) => ({
                label: item.label ?? "",
                amount: item.amount ? String(item.amount) : "",
                dueDate: item.dueDate ? item.dueDate.toISOString().slice(0, 10) : ""
              }))
            }}
          />
        </div>
      ) : null}
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border bg-muted/10 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-bold">{value}</p></div>;
}

function text(value: string | null | undefined, fallback = "-") {
  return value?.trim() ? value : fallback;
}

function date(value: Date | null) {
  return value ? formatDate(value) : "-";
}

function money(value: unknown, currency: string) {
  return value === null || value === undefined ? "-" : `${formatCurrency(Number(value))} ${currency}`;
}

function attachmentsFrom(value: unknown): ReferralAttachment[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ReferralAttachment => Boolean(
    item &&
    typeof item === "object" &&
    "url" in item &&
    typeof (item as { url?: unknown }).url === "string" &&
    "name" in item &&
    typeof (item as { name?: unknown }).name === "string"
  ));
}
