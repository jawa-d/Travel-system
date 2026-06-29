import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  VerificationBrandHeader,
  VerificationCard,
  VerificationContent,
  VerificationDetailItem
} from "@/components/policy-verification-ui";
import { demoPolicies } from "@/lib/demo-data";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { isValidPolicyVerificationToken } from "@/lib/policy-verification";
import { policyStatusLabelsEn, policyVerificationStatusClasses } from "@/lib/policy-status-display";

export default async function VerifyPolicyPage({
  params,
  searchParams
}: {
  params: Promise<{ policyNumber: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { policyNumber } = await params;
  const { token } = await searchParams;
  const decodedPolicyNumber = decodeURIComponent(policyNumber);
  if (token && !isValidPolicyVerificationToken(decodedPolicyNumber, token)) notFound();

  const policy = isDirectAccessEnabled()
    ? demoPolicies.find((item) => item.policyNumber === decodedPolicyNumber) ?? null
    : await prisma.policy.findFirst({
        where: { policyNumber: decodedPolicyNumber, deletedAt: null },
        include: { customer: true, destinationCountry: true, travelPlan: true, issuedBy: true, agency: true }
      });
  if (!policy) notFound();

  const issuerName = "issuedByName" in policy
    ? policy.issuedByName ?? policy.issuedBy?.name ?? policy.agency?.name ?? "-"
    : "-";
  const issueDate = "issuedAt" in policy ? policy.issuedAt ?? policy.createdAt : policy.createdAt;
  const statusLabel = policyStatusLabelsEn[policy.status] ?? policy.status;

  return (
    <VerificationCard maxWidth="max-w-4xl">
      <VerificationContent className="p-6 sm:p-8">
        <VerificationBrandHeader
          align="split"
          status={<Badge className={`w-fit px-3 py-1.5 text-sm ring-1 ${policyVerificationStatusClasses[policy.status] ?? policyVerificationStatusClasses.DRAFT}`}>{statusLabel}</Badge>}
        />

        <div className="my-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 shrink-0" />
            <div>
              <p className="font-black">تم التحقق من صحة الوثيقة بنجاح.</p>
              <p className="mt-1 text-sm">This policy record matches an official TRINSU policy verification entry.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <VerificationDetailItem label="رقم الوثيقة" value={policy.policyNumber} dir="ltr" strong />
          <VerificationDetailItem label="حالة الوثيقة" value={statusLabel} />
          <VerificationDetailItem label="اسم المؤمن له" value={policy.customer.arabicName} />
          <VerificationDetailItem label="اسم المؤمن له بالإنجليزية" value={policy.customer.englishName} dir="ltr" />
          <VerificationDetailItem label="نوع التأمين" value={policy.policyType} dir="ltr" />
          <VerificationDetailItem label="الخطة" value={policy.travelPlan.name} />
          <VerificationDetailItem label="الوجهة" value={policy.destinationCountry.nameAr} />
          <VerificationDetailItem label="مبلغ التغطية" value={formatCurrency(String(policy.coverageAmount))} dir="ltr" />
          <VerificationDetailItem label="تاريخ الإصدار" value={formatDate(issueDate)} />
          <VerificationDetailItem label="تاريخ الانتهاء" value={formatDate(policy.returnDate)} />
          <VerificationDetailItem label="اسم الوكيل" value={issuerName} />
          <VerificationDetailItem label="قسط التأمين" value={formatCurrency(String(policy.premium))} dir="ltr" />
        </div>

        <div className="mt-7 flex justify-center">
          <Button asChild className="bg-[#293545] hover:bg-[#1f2937]">
            <Link href="/verify"><ShieldCheck className="h-4 w-4" />Verify Another Policy</Link>
          </Button>
        </div>
      </VerificationContent>
    </VerificationCard>
  );
}
