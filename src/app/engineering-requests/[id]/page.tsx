import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Building2, CalendarDays, FileText, ReceiptText, UserRound } from "lucide-react";
import { EngineeringRequestStatus, Role } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { EngineeringRequestEnterpriseManager } from "@/components/engineering-request-enterprise-manager";
import { EngineeringRequestStatusCard } from "@/components/engineering-request-status-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/page-guard";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";

type EngineeringDocument = { url?: string; name: string; size?: number; type?: string };

export default async function EngineeringRequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePagePermission("engineeringRequestsRead");
  const { id } = await params;
  const request = await prisma.engineeringInsuranceRequest.findUnique({ where: { id } });
  if (!request) notFound();

  const documents = Array.isArray(request.documents) ? request.documents as EngineeringDocument[] : [];
  const canManage = can(user.role, "engineeringRequestsManage");
  const issued = Boolean(request.policyIssuedAt || request.issuedPolicyNumber);
  const canEdit = user.role === Role.SUPER_ADMIN || user.role === Role.ADMIN || (user.role === Role.UNDERWRITER && !issued);

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -mr-3">
            <Link href="/engineering-requests"><ArrowRight className="h-4 w-4" />رجوع للسجل</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-black text-primary sm:text-3xl" dir="ltr">{request.requestNumber}</h1>
            <Badge className={statusClasses[request.status]}>{statusLabels[request.status]}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">ملف طلب التأمين الهندسي المرسل إلى النظام.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-primary" />معلومات العميل</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="الاسم الكامل" value={request.customerFullName} />
              <Detail label="الهاتف" value={request.customerMobile} dir="ltr" />
              <Detail label="البريد الإلكتروني" value={request.customerEmail ?? "-"} dir="ltr" />
              <Detail label="رقم البطاقة الوطنية" value={request.customerNationalId ?? "-"} dir="ltr" />
              <Detail label="العنوان" value={request.customerAddress ?? "-"} />
              <Detail label="المدينة" value={request.customerCity ?? "-"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />معلومات المشروع</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="اسم المشروع" value={request.projectName} />
              <Detail label="نوع المشروع" value={request.projectType} />
              <Detail label="موقع المشروع" value={request.projectLocation} />
              <Detail label="قيمة العقد" value={formatMoney(Number(request.contractValue), request.currency)} dir="ltr" />
              <Detail label="نوع التأمين" value={request.insuranceType} />
              <Detail label="اسم المقاول" value={request.contractorName ?? "-"} />
              <Detail label="اسم المالك" value={request.ownerName ?? "-"} />
              <Detail label="تاريخ البداية" value={request.startDate ? formatDate(request.startDate) : "-"} />
              <Detail label="تاريخ النهاية" value={request.endDate ? formatDate(request.endDate) : "-"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />تفاصيل المخاطر والتغطية</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Detail label="نوع التغطية" value={request.coverageType ?? "-"} />
              <Detail label="تفاصيل المخاطر" value={<span className="whitespace-pre-wrap">{request.riskDetails || "-"}</span>} />
              <Detail label="ملاحظات التغطية" value={<span className="whitespace-pre-wrap">{request.coverageNotes || "-"}</span>} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />المستندات ({documents.length})</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {documents.length ? documents.map((document) => (
                <div key={document.url ?? document.name} className="rounded-lg border bg-muted/15 p-4">
                  <p className="font-bold">{document.name}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{document.type ?? "Document"}</p>
                  {document.url ? (
                    <Button asChild size="sm" variant="outline" className="mt-3">
                      <a href={document.url} target="_blank" rel="noopener noreferrer">فتح / تحميل</a>
                    </Button>
                  ) : null}
                </div>
              )) : <p className="text-sm text-muted-foreground">لا توجد مستندات مرفقة.</p>}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" />معلومات الطلب</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Detail label="رقم الطلب" value={request.requestNumber} dir="ltr" />
              <Detail label="الحالة" value={statusLabels[request.status]} />
              <Detail label="تاريخ الإنشاء" value={formatDate(request.createdDate)} />
              <Detail label="وقت الإنشاء" value={request.createdTime} dir="ltr" />
              <Detail label="المصدر" value={request.source} />
              <Detail label="اسم الوكيل / القناة" value={request.agentName ?? "-"} />
              <Detail label="آخر مراجع" value={request.reviewedByName ?? "-"} />
              <Detail label="رقم الوثيقة" value={request.issuedPolicyNumber ?? "-"} dir="ltr" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ReceiptText className="h-5 w-5 text-primary" />التسعير</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Detail label="قسط التأمين" value={`${request.insurancePremium} ${request.pricingCurrency}`} dir="ltr" />
              <Detail label="الخصم" value={`${request.discount} ${request.pricingCurrency}`} dir="ltr" />
              <Detail label="رسوم إضافية" value={`${request.additionalFees} ${request.pricingCurrency}`} dir="ltr" />
              <Detail label="الضرائب" value={`${request.taxes} ${request.pricingCurrency}`} dir="ltr" />
              <Detail label="صافي القسط" value={`${request.netPremium} ${request.pricingCurrency}`} dir="ltr" />
              <Detail label="ملاحظات" value={request.pricingNotes ?? "-"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>الشروط الخاصة</CardTitle></CardHeader>
            <CardContent>
              {request.policyTermsHtml ? (
                <div className="rounded-lg border bg-muted/10 p-3 text-sm leading-7" dangerouslySetInnerHTML={{ __html: request.policyTermsHtml }} />
              ) : (
                <p className="text-sm text-muted-foreground">لا توجد شروط مدخلة بعد.</p>
              )}
              {request.termsApprovedByName ? <p className="mt-3 text-xs text-muted-foreground">معتمدة من {request.termsApprovedByName}</p> : null}
            </CardContent>
          </Card>

          {canManage ? (
            <Card>
              <CardHeader><CardTitle>إدارة الطلب</CardTitle></CardHeader>
              <CardContent>
                <EngineeringRequestStatusCard requestId={request.id} currentStatus={request.status} initialNotes={request.managerNotes} />
              </CardContent>
            </Card>
          ) : null}

          {(canEdit || can(user.role, "engineeringRequestsDelete")) ? (
            <Card>
              <CardHeader><CardTitle>Enterprise Controls</CardTitle></CardHeader>
              <CardContent>
                <EngineeringRequestEnterpriseManager
                  request={{
                    id: request.id,
                    customerFullName: request.customerFullName,
                    customerMobile: request.customerMobile,
                    customerEmail: request.customerEmail,
                    customerNationalId: request.customerNationalId,
                    customerAddress: request.customerAddress,
                    customerCity: request.customerCity,
                    projectName: request.projectName,
                    projectType: request.projectType,
                    projectLocation: request.projectLocation,
                    contractValue: String(request.contractValue),
                    currency: request.currency,
                    insuranceType: request.insuranceType,
                    startDate: request.startDate?.toISOString() ?? null,
                    endDate: request.endDate?.toISOString() ?? null,
                    contractorName: request.contractorName,
                    ownerName: request.ownerName,
                    riskDetails: request.riskDetails,
                    coverageType: request.coverageType,
                    coverageNotes: request.coverageNotes,
                    insurancePremium: String(request.insurancePremium),
                    discount: String(request.discount),
                    additionalFees: String(request.additionalFees),
                    taxes: String(request.taxes),
                    netPremium: String(request.netPremium),
                    pricingCurrency: request.pricingCurrency,
                    pricingNotes: request.pricingNotes,
                    policyTermsHtml: request.policyTermsHtml,
                    termsApprovedByName: request.termsApprovedByName,
                    underwriterSignature: request.underwriterSignature as { url?: string; name?: string; uploadedByName?: string } | null,
                    managerSignature: request.managerSignature as { url?: string; name?: string; uploadedByName?: string } | null,
                    companyStamp: request.companyStamp as { url?: string; name?: string; uploadedByName?: string } | null
                  }}
                  permissions={{
                    canEdit,
                    canDelete: can(user.role, "engineeringRequestsDelete") && !issued,
                    canEditPricing: user.role === Role.SUPER_ADMIN || user.role === Role.UNDERWRITER,
                    canEditTerms: user.role === Role.SUPER_ADMIN || user.role === Role.UNDERWRITER,
                    canApproveTerms: user.role === Role.SUPER_ADMIN,
                    canUploadUnderwriterSignature: user.role === Role.SUPER_ADMIN || user.role === Role.UNDERWRITER,
                    canUploadManagerAssets: user.role === Role.SUPER_ADMIN
                  }}
                />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader><CardTitle>ملاحظات إضافية</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{request.notes || "لا توجد ملاحظات."}</p></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>ملاحظات الإدارة</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{request.managerNotes || "لا توجد ملاحظات إدارية."}</p></CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Detail({ label, value, dir }: { label: string; value: React.ReactNode; dir?: "ltr" | "rtl" }) {
  return (
    <div className="rounded-lg border bg-muted/15 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-sm font-bold" dir={dir}>{value}</p>
    </div>
  );
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "IQD", maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount)} ${currency || "IQD"}`;
  }
}

const statusLabels: Record<EngineeringRequestStatus, string> = {
  SUBMITTED: "مرسل",
  UNDER_REVIEW: "قيد المراجعة",
  NEEDS_INFO: "بحاجة معلومات",
  QUOTED: "تم التسعير",
  APPROVED: "مقبول",
  REJECTED: "مرفوض"
};

const statusClasses: Record<EngineeringRequestStatus, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-200",
  UNDER_REVIEW: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-950 dark:text-cyan-200",
  NEEDS_INFO: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-200",
  QUOTED: "bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-200",
  APPROVED: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-200",
  REJECTED: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-200"
};
