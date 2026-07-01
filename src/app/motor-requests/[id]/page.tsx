import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, CarFront, FileImage, FileText, UserRound } from "lucide-react";
import { MotorRequestStatus, Role } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { MotorRequestFileDownloads } from "@/components/motor-request-file-downloads";
import { MotorRequestStatusManager } from "@/components/motor-request-status-manager";
import { StoredImage } from "@/components/stored-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/page-guard";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { formatCurrency, formatDate } from "@/lib/utils";

type VehicleImage = { id: string; category: string; name: string; size: number; type: string };
type CustomerDocument = { key: string; label: string; id: string; name: string; size: number; type: string };

export default async function MotorRequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePagePermission("motorRequestsRead");
  const { id } = await params;
  const request = await prisma.motorInsuranceRequest.findUnique({ where: { id } });
  if (!request) notFound();
  if (user.role === Role.AGENT && request.agentId !== user.id) notFound();

  const images = request.vehicleImages as VehicleImage[];
  const documents = request.customerDocuments as CustomerDocument[];
  const canManage = can(user.role, "motorRequestsManage");

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -mr-3">
            <Link href="/motor-requests/new"><ArrowRight className="h-4 w-4" />طلب جديد</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-black text-primary sm:text-3xl" dir="ltr">{request.requestNumber}</h1>
            <Badge className={statusClasses[request.status]}>{statusLabels[request.status]}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">ملف طلب تأمين المركبة المرسل من الوكيل.</p>
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
              <Detail label="رقم البطاقة الوطنية" value={request.customerNationalId} dir="ltr" />
              <Detail label="العنوان" value={request.customerAddress} />
              <Detail label="المدينة" value={request.customerCity} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CarFront className="h-5 w-5 text-primary" />معلومات المركبة</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="نوع المركبة" value={request.vehicleType} />
              <Detail label="الشركة المصنعة" value={request.manufacturer} />
              <Detail label="الطراز" value={request.model} />
              <Detail label="سنة الصنع" value={request.manufacturingYear} dir="ltr" />
              <Detail label="اللون" value={request.color} />
              <Detail label="رقم اللوحة" value={request.plateNumber} dir="ltr" />
              <Detail label="رقم الشاصي" value={request.chassisNumber} dir="ltr" />
              <Detail label="رقم المحرك" value={request.engineNumber} dir="ltr" />
              <Detail label="القيمة التقديرية" value={formatCurrency(Number(request.estimatedVehicleValue))} dir="ltr" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileImage className="h-5 w-5 text-primary" />صور المركبة ({images.length})</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((image) => (
                <div key={image.id} className="overflow-hidden rounded-lg border bg-card">
                  <StoredImage source={image.id} alt={image.category} className="h-40 w-full bg-white object-contain dark:bg-slate-950" />
                  <div className="border-t p-3">
                    <p className="text-sm font-bold">{image.category}</p>
                    <p className="truncate text-xs text-muted-foreground">{image.name}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />مستندات العميل</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {documents.map((document) => (
                <div key={document.key} className="rounded-lg border bg-muted/15 p-4">
                  <p className="font-bold">{document.label}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{document.name}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />تحميل الملفات</CardTitle></CardHeader>
            <CardContent>
              <MotorRequestFileDownloads
                requestNumber={request.requestNumber}
                vehicleImages={images}
                documents={documents}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" />معلومات الطلب</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Detail label="رقم الطلب" value={request.requestNumber} dir="ltr" />
              <Detail label="الحالة" value={statusLabels[request.status]} />
              <Detail label="تاريخ الإنشاء" value={formatDate(request.createdDate)} />
              <Detail label="وقت الإنشاء" value={request.createdTime} dir="ltr" />
              <Detail label="اسم الوكيل" value={request.agentName} />
              <Detail label="بريد الوكيل" value={request.agentEmail ?? "-"} dir="ltr" />
              <Detail label="الوكالة" value={request.agentAgency ?? "-"} />
              <Detail label="آخر مراجع" value={request.reviewedByName ?? "-"} />
              <Detail label="تاريخ المراجعة" value={request.reviewedAt ? formatDate(request.reviewedAt) : "-"} />
            </CardContent>
          </Card>

          {canManage ? (
            <Card>
              <CardHeader><CardTitle>إدارة الطلب</CardTitle></CardHeader>
              <CardContent>
                <MotorRequestStatusManager
                  requestId={request.id}
                  currentStatus={request.status}
                  initialNotes={request.managerNotes}
                />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader><CardTitle>ملاحظات إضافية</CardTitle></CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{request.notes || "لا توجد ملاحظات."}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>ملاحظات الإدارة</CardTitle></CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{request.managerNotes || "لا توجد ملاحظات إدارية."}</p>
            </CardContent>
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

const statusLabels: Record<MotorRequestStatus, string> = {
  DRAFT: "مسودة",
  SUBMITTED: "مرسل",
  UNDER_REVIEW: "قيد المراجعة",
  NEEDS_INFO: "بحاجة معلومات",
  APPROVED: "مقبول",
  REJECTED: "مرفوض"
};

const statusClasses: Record<MotorRequestStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200",
  SUBMITTED: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-200",
  UNDER_REVIEW: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-950 dark:text-cyan-200",
  NEEDS_INFO: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-200",
  REJECTED: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-200"
};
