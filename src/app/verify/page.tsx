import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { demoPolicies } from "@/lib/demo-data";
import { isDirectAccessEnabled } from "@/lib/direct-access";

export default async function VerifySearchPage({ searchParams }: { searchParams: Promise<{ policyNumber?: string }> }) {
  const { policyNumber = "" } = await searchParams;
  const policy = policyNumber
    ? isDirectAccessEnabled()
      ? demoPolicies.find((item) => item.policyNumber === policyNumber) ?? null
      : await prisma.policy.findFirst({ where: { policyNumber, deletedAt: null }, include: { customer: true, destinationCountry: true, travelPlan: true } })
    : null;
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-2xl">
        <CardHeader><CardTitle>التحقق من وثيقة</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <form action="/verify" className="space-y-3">
            <Input name="policyNumber" placeholder="رقم الوثيقة" defaultValue={policyNumber} />
            <Button className="w-full">تحقق</Button>
          </form>
          {policy ? (
            <div className="space-y-3 rounded-md border p-4">
              <div className="flex justify-between"><strong>{policy.policyNumber}</strong><Badge>{policy.status}</Badge></div>
              <div>العميل: {policy.customer.arabicName}</div>
              <div>رقم الجواز: {policy.customer.passportNumber}</div>
              <div>المدة: {formatDate(policy.departureDate)} - {formatDate(policy.returnDate)}</div>
              <div>الخطة: {policy.travelPlan.name}</div>
              <div>التغطية: {formatCurrency(String(policy.coverageAmount))}</div>
              <div>الوجهة: {policy.destinationCountry.nameAr}</div>
            </div>
          ) : policyNumber ? <p className="text-sm text-destructive">لم يتم العثور على الوثيقة.</p> : null}
        </CardContent>
      </Card>
    </main>
  );
}
