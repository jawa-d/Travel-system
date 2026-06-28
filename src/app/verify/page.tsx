import Link from "next/link";
import { Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  VerificationBrandHeader,
  VerificationCard,
  VerificationContent,
  VerificationResultRow
} from "@/components/policy-verification-ui";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { demoPolicies } from "@/lib/demo-data";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { getPolicyVerificationUrl } from "@/lib/policy-verification";

export default async function VerifySearchPage({ searchParams }: { searchParams: Promise<{ policyNumber?: string }> }) {
  const { policyNumber = "" } = await searchParams;
  const policy = policyNumber
    ? isDirectAccessEnabled()
      ? demoPolicies.find((item) => item.policyNumber === policyNumber) ?? null
      : await prisma.policy.findFirst({ where: { policyNumber, deletedAt: null }, include: { customer: true, destinationCountry: true, travelPlan: true } })
    : null;

  return (
    <VerificationCard>
      <VerificationBrandHeader description="أدخل رقم الوثيقة أو امسح رمز QR الموجود داخل PDF." />
      <VerificationContent>
        <form action="/verify" className="flex flex-col gap-3 sm:flex-row">
          <Input name="policyNumber" placeholder="رقم الوثيقة" defaultValue={policyNumber} dir="ltr" className="h-11 flex-1 font-mono" />
          <Button className="h-11 bg-[#293545] hover:bg-[#1f2937]"><Search className="h-4 w-4" />تحقق</Button>
        </form>

        {policy ? (
          <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <strong className="font-mono text-lg text-[#293545]" dir="ltr">{policy.policyNumber}</strong>
              <Badge className="bg-emerald-100 text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" />تم التحقق</Badge>
            </div>
            <VerificationResultRow label="العميل" value={policy.customer.arabicName} />
            <VerificationResultRow label="رقم الجواز" value={policy.customer.passportNumber} />
            <VerificationResultRow label="المدة" value={`${formatDate(policy.departureDate)} - ${formatDate(policy.returnDate)}`} />
            <VerificationResultRow label="الخطة" value={policy.travelPlan.name} />
            <VerificationResultRow label="التغطية" value={formatCurrency(String(policy.coverageAmount))} />
            <VerificationResultRow label="الوجهة" value={policy.destinationCountry.nameAr} />
            <Button asChild variant="outline" className="mt-2 w-full bg-white">
              <Link href={getPolicyVerificationUrl(policy.policyNumber)}>فتح صفحة التحقق الكاملة</Link>
            </Button>
          </div>
        ) : policyNumber ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">لم يتم العثور على الوثيقة.</p>
        ) : null}
      </VerificationContent>
    </VerificationCard>
  );
}
