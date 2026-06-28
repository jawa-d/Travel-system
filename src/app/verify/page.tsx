import Image from "next/image";
import Link from "next/link";
import { Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    <main className="flex min-h-screen items-center justify-center bg-[#F1ECE2] p-4" dir="rtl">
      <Card className="w-full max-w-2xl overflow-hidden border-white/80 shadow-xl">
        <div className="h-2 bg-gradient-to-l from-[#293545] via-[#AE8F50] to-cyan-700" />
        <CardHeader className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-xl border bg-white p-2 shadow-sm">
            <Image src="/iraq-takaful-logo.svg" alt="Iraq Takaful Insurance Company" width={52} height={52} className="h-full w-full object-contain" />
          </span>
          <CardTitle className="mt-3 text-2xl text-[#293545]">التحقق من وثيقة التأمين</CardTitle>
          <p className="text-sm text-muted-foreground">أدخل رقم الوثيقة أو امسح رمز QR الموجود داخل PDF.</p>
        </CardHeader>
        <CardContent className="space-y-6">
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
              <Info label="العميل" value={policy.customer.arabicName} />
              <Info label="رقم الجواز" value={policy.customer.passportNumber} />
              <Info label="المدة" value={`${formatDate(policy.departureDate)} - ${formatDate(policy.returnDate)}`} />
              <Info label="الخطة" value={policy.travelPlan.name} />
              <Info label="التغطية" value={formatCurrency(String(policy.coverageAmount))} />
              <Info label="الوجهة" value={policy.destinationCountry.nameAr} />
              <Button asChild variant="outline" className="mt-2 w-full bg-white"><Link href={getPolicyVerificationUrl(policy.policyNumber)}>فتح صفحة التحقق الكاملة</Link></Button>
            </div>
          ) : policyNumber ? <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">لم يتم العثور على الوثيقة.</p> : null}
        </CardContent>
      </Card>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b border-emerald-200/70 pb-2 text-sm"><span className="text-emerald-900/70">{label}</span><span className="font-bold">{value}</span></div>;
}
