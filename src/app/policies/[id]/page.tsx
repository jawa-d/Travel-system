import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  ExternalLink,
  FileClock,
  FilePenLine,
  FileText,
  Mail,
  MapPin,
  Phone,
  Printer,
  QrCode,
  ShieldCheck,
  UserRound,
  XCircle
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDemoCancellations } from "@/lib/demo-cancellation-store";
import { getDemoClaims } from "@/lib/demo-claim-store";
import { getDemoEndorsements } from "@/lib/demo-endorsement-store";
import { getDemoPolicies } from "@/lib/demo-policy-store";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { requirePagePermission } from "@/lib/page-guard";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { canAccessPolicy } from "@/lib/policy-access";
import { createPolicyVerificationQr, getPolicyVerificationUrl } from "@/lib/policy-verification";
import { policyStatusClasses, policyStatusLabelsAr } from "@/lib/policy-status-display";

export default async function PolicyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePagePermission("policiesRead");
  const { id } = await params;
  const demo = isDirectAccessEnabled();
  const demoPolicy = demo ? getDemoPolicies().find((item) => item.id === id) : null;
  const databasePolicy = !demo ? await prisma.policy.findUnique({
    where: { id },
    include: {
      customer: true,
      destinationCountry: true,
      travelPlan: true,
      issuedBy: true,
      claims: { orderBy: { createdAt: "desc" } },
      endorsements: { orderBy: { createdAt: "desc" } },
      cancellation: true
    }
  }) : null;
  const policy = demoPolicy ?? databasePolicy;
  if (!policy) notFound();
  if (!demo && databasePolicy && (!canAccessPolicy(user, databasePolicy) || (databasePolicy.deletedAt && user.role !== "SUPER_ADMIN"))) notFound();

  const claims = demo ? getDemoClaims().filter((item) => item.policy.id === id) : databasePolicy?.claims ?? [];
  const endorsements = demo ? getDemoEndorsements().filter((item) => item.policy.id === id) : databasePolicy?.endorsements ?? [];
  const cancellation = demo ? getDemoCancellations().find((item) => item.policy.id === id) ?? null : databasePolicy?.cancellation ?? null;
  const verificationUrl = getPolicyVerificationUrl(policy.policyNumber);
  const qrCodeData = policy.qrCodeData ?? await createPolicyVerificationQr(policy.policyNumber);

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -mr-3"><Link href="/policies"><ArrowRight className="h-4 w-4" />العودة للوثائق</Link></Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-black text-primary sm:text-3xl" dir="ltr">{policy.policyNumber}</h1>
            <Badge className={policyStatusClasses[policy.status]}>{policyStatusLabelsAr[policy.status] ?? policy.status}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">ملف الوثيقة وتغطيتها ورمز التحقق والعمليات المرتبطة بها.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href={verificationUrl}><ExternalLink className="h-4 w-4" />صفحة التحقق</Link></Button>
          <Button asChild variant="outline"><Link href={`/api/policies/${id}/pdf`}><Download className="h-4 w-4" />تنزيل PDF</Link></Button>
          <Button asChild><Link target="_blank" href={`/api/policies/${id}/pdf`}><Printer className="h-4 w-4" />طباعة</Link></Button>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />بيانات التغطية والرحلة</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Detail icon={MapPin} label="الوجهة" value={policy.destinationCountry.nameAr} />
              <Detail icon={FileText} label="الخطة" value={policy.travelPlan.name} />
              <Detail icon={ShieldCheck} label="مبلغ التغطية" value={formatCurrency(Number(policy.coverageAmount))} />
              <Detail icon={CalendarDays} label="تاريخ المغادرة" value={formatDate(policy.departureDate)} />
              <Detail icon={CalendarDays} label="تاريخ العودة" value={formatDate(policy.returnDate)} />
              <Detail icon={CheckCircle2} label="قسط التأمين" value={formatCurrency(Number(policy.premium))} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" />المطالبات ({claims.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {claims.map((item) => (
                <div key={item.id} className="flex flex-col justify-between gap-2 rounded-lg border p-4 sm:flex-row sm:items-center">
                  <div><p className="font-mono text-sm font-bold text-primary" dir="ltr">{item.claimNumber}</p><p className="mt-1 text-sm text-muted-foreground">{item.description}</p></div>
                  <Badge>{item.status}</Badge>
                </div>
              ))}
              {!claims.length ? <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">لا توجد مطالبات مرتبطة بهذه الوثيقة.</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FilePenLine className="h-5 w-5 text-primary" />الملاحق ({endorsements.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {endorsements.map((item) => (
                <div key={item.id} className="flex flex-col justify-between gap-2 rounded-lg border p-4 sm:flex-row sm:items-center">
                  <div><p className="font-mono text-sm font-bold text-primary" dir="ltr">{item.endorsementNumber}</p><p className="mt-1 text-xs text-muted-foreground">{item.endorsementType}</p></div>
                  <Badge>{item.status}</Badge>
                </div>
              ))}
              {!endorsements.length ? <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">لا توجد ملاحق على الوثيقة.</p> : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5 text-primary" />رمز التحقق QR</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="mx-auto w-fit rounded-xl border border-primary/15 bg-white p-3 shadow-sm">
                <img src={qrCodeData} alt="Scan QR Code to Verify Policy" className="h-44 w-44" />
              </div>
              <div>
                <p className="text-sm font-bold text-primary">امسح رمز QR للتحقق من صحة الوثيقة</p>
                <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground" dir="ltr">{verificationUrl}</p>
              </div>
              <Button asChild variant="outline" className="w-full"><Link href={verificationUrl}>فتح صفحة التحقق</Link></Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-primary" />المؤمن له</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><p className="font-bold">{policy.customer.arabicName}</p><p className="text-sm text-muted-foreground">{policy.customer.englishName}</p></div>
              <Detail icon={FileText} label="رقم الجواز" value={policy.customer.passportNumber} dir="ltr" />
              <Detail icon={Phone} label="الهاتف" value={policy.customer.mobile} dir="ltr" />
              <Detail icon={Mail} label="البريد" value={policy.customer.email ?? "غير مسجل"} dir="ltr" />
              <Button asChild variant="outline" className="w-full"><Link href={`/customers/${policy.customer.id}`}>عرض ملف العميل</Link></Button>
            </CardContent>
          </Card>

          <Card className={cancellation ? "border-red-200" : ""}>
            <CardHeader><CardTitle className="flex items-center gap-2">{cancellation ? <XCircle className="h-5 w-5 text-red-600" /> : <FileClock className="h-5 w-5 text-primary" />}{cancellation ? "بيانات الإلغاء" : "حالة الوثيقة"}</CardTitle></CardHeader>
            <CardContent>
              {cancellation ? (
                <div className="space-y-3 text-sm">
                  <p className="font-mono font-bold text-red-700" dir="ltr">{cancellation.cancellationNumber}</p>
                  <p>الاسترداد: <strong>{formatCurrency(Number(cancellation.refundAmount))}</strong></p>
                  <p>الرسوم: <strong>{formatCurrency(Number(cancellation.administrativeFees))}</strong></p>
                </div>
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">الوثيقة غير ملغاة ويمكن التحقق من حالتها من خلال رمز QR أو صفحة التحقق العامة.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Detail({ icon: Icon, label, value, dir }: { icon: typeof FileText; label: string; value: ReactNode; dir?: "ltr" | "rtl" }) {
  return (
    <div className="rounded-lg border bg-muted/15 p-3">
      <p className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</p>
      <p className="mt-1.5 text-sm font-bold" dir={dir}>{value}</p>
    </div>
  );
}
