import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, FileText, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { demoPolicies } from "@/lib/demo-data";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { isValidPolicyVerificationToken } from "@/lib/policy-verification";

const statusLabels: Record<string, string> = {
  ACTIVE: "Active",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
  DRAFT: "Draft"
};

const statusClasses: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  EXPIRED: "bg-amber-50 text-amber-700 ring-amber-200",
  CANCELLED: "bg-red-50 text-red-700 ring-red-200",
  DRAFT: "bg-slate-100 text-slate-700 ring-slate-200"
};

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

  return (
    <main className="min-h-screen bg-[#F1ECE2] p-4" dir="rtl">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-4xl items-center justify-center">
        <Card className="w-full overflow-hidden border-white/80 bg-white shadow-2xl shadow-slate-900/10">
          <div className="h-2 bg-gradient-to-l from-[#293545] via-[#AE8F50] to-cyan-700" />
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border bg-white p-2 shadow-sm">
                  <Image src="/iraq-takaful-logo.svg" alt="Iraq Takaful Insurance Company" width={52} height={52} className="h-full w-full object-contain" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-normal text-[#AE8F50]">TRINSU Verification</p>
                  <h1 className="mt-1 text-2xl font-black text-[#293545]">التحقق من وثيقة التأمين</h1>
                  <p className="mt-1 text-sm text-slate-500">Iraq Takaful Insurance Company</p>
                </div>
              </div>
              <Badge className={`w-fit px-3 py-1.5 text-sm ring-1 ${statusClasses[policy.status] ?? statusClasses.DRAFT}`}>
                {statusLabels[policy.status] ?? policy.status}
              </Badge>
            </div>

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
              <Info label="رقم الوثيقة" value={policy.policyNumber} dir="ltr" strong />
              <Info label="حالة الوثيقة" value={statusLabels[policy.status] ?? policy.status} />
              <Info label="اسم المؤمن له" value={policy.customer.arabicName} />
              <Info label="اسم المؤمن له بالإنجليزية" value={policy.customer.englishName} dir="ltr" />
              <Info label="نوع التأمين" value={policy.policyType} dir="ltr" />
              <Info label="الخطة" value={policy.travelPlan.name} />
              <Info label="الوجهة" value={policy.destinationCountry.nameAr} />
              <Info label="مبلغ التغطية" value={formatCurrency(String(policy.coverageAmount))} dir="ltr" />
              <Info label="تاريخ الإصدار" value={formatDate(issueDate)} />
              <Info label="تاريخ الانتهاء" value={formatDate(policy.returnDate)} />
              <Info label="اسم الوكيل" value={issuerName} />
              <Info label="قسط التأمين" value={formatCurrency(String(policy.premium))} dir="ltr" />
            </div>

            <div className="mt-7 flex flex-col gap-2 sm:flex-row">
              <Button asChild className="bg-[#293545] hover:bg-[#1f2937]"><Link href="/verify"><ShieldCheck className="h-4 w-4" />التحقق من وثيقة أخرى</Link></Button>
              <Button asChild variant="outline"><Link href="/"><FileText className="h-4 w-4" />العودة للنظام</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Info({ label, value, dir, strong = false }: { label: string; value: string; dir?: "ltr" | "rtl"; strong?: boolean }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className={`mt-1.5 break-words text-sm ${strong ? "font-black text-[#293545]" : "font-bold text-slate-800"}`} dir={dir}>{value}</p>
    </div>
  );
}
