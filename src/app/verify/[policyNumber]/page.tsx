import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { demoPolicies } from "@/lib/demo-data";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function VerifyPolicyPage({ params }: { params: Promise<{ policyNumber: string }> }) {
  const { policyNumber } = await params;
  const policy = isDirectAccessEnabled()
    ? demoPolicies.find((item) => item.policyNumber === policyNumber) ?? demoPolicies[0]
    : await prisma.policy.findFirst({
        where: { policyNumber, deletedAt: null },
        include: { customer: true, destinationCountry: true, travelPlan: true }
      });
  if (!policy) notFound();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">التحقق من وثيقة التأمين</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md bg-accent p-4">
            <span className="font-mono text-lg">{policy.policyNumber}</span>
            <Badge>{policy.status}</Badge>
          </div>
          <Info label="العميل" value={policy.customer.arabicName} />
          <Info label="رقم الجواز" value={policy.customer.passportNumber} />
          <Info label="الدولة" value={policy.destinationCountry.nameAr} />
          <Info label="الخطة" value={policy.travelPlan.name} />
          <Info label="مدة السفر" value={`${formatDate(policy.departureDate)} - ${formatDate(policy.returnDate)}`} />
          <Info label="القسط" value={formatCurrency(String(policy.premium))} />
        </CardContent>
      </Card>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b pb-2"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}
