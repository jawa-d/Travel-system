"use client";

import { ReportRequestStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2, Clock3, Download, Eye, FileUp, LockKeyhole, Mail, MessageSquareText, RefreshCw, Trash2, UserRound, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast-provider";
import { reportRequestStatusLabels } from "@/lib/report-requests";
import { cn } from "@/lib/utils";

export type ReportRequestItem = {
  id: string;
  requestNumber: string;
  title: string;
  details: string;
  status: ReportRequestStatus;
  requesterName: string | null;
  requesterEmail: string | null;
  requesterBank: string | null;
  managerNotes: string | null;
  reportFileUrl: string | null;
  reportFileName: string | null;
  reportFileSize: number | null;
  reportFileUploadedAt: string | null;
  isLocked: boolean;
  lockedAt: string | null;
  lockedByName: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

const statusStyles: Record<ReportRequestStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  IN_REVIEW: "border-blue-200 bg-blue-50 text-blue-800",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  REJECTED: "border-red-200 bg-red-50 text-red-800"
};

export function ReportRequestsManager({ requests }: { requests: ReportRequestItem[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ReportRequestItem | null>(null);
  const [expandedLocked, setExpandedLocked] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  function updateRequest(id: string, formData: FormData) {
    setActiveId(id);
    startTransition(async () => {
      const response = await fetch(`/api/report-requests/${id}`, {
        method: "PATCH",
        body: formData
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({ title: result.error ?? "تعذر تحديث طلب التقرير", tone: "error" });
        setActiveId(null);
        return;
      }
      toast({ title: formData.get("action") === "lock" ? "تم قفل طلب التقرير" : "تم تحديث طلب التقرير", tone: "success" });
      setActiveId(null);
      router.refresh();
    });
  }

  function toggleLocked(id: string) {
    setExpandedLocked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function deleteRequest() {
    if (!deleting) return;
    const request = deleting;
    setActiveId(request.id);
    startTransition(async () => {
      const response = await fetch(`/api/report-requests/${request.id}`, {
        method: "DELETE"
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({ title: result.error ?? "تعذر حذف طلب التقرير", tone: "error" });
        setActiveId(null);
        return;
      }
      toast({ title: "تم حذف طلب التقرير", tone: "success" });
      setDeleting(null);
      setActiveId(null);
      router.refresh();
    });
  }

  if (!requests.length) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <MessageSquareText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <p className="font-bold">لا توجد طلبات تقارير حتى الآن</p>
        <p className="mt-1 text-sm text-muted-foreground">ستظهر هنا الطلبات المرسلة من مستخدمي المصارف.</p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-4">
      {requests.map((request) => {
        const lockedExpanded = expandedLocked.has(request.id);
        if (request.isLocked && !lockedExpanded) {
          return (
            <button
              key={request.id}
              type="button"
              onClick={() => toggleLocked(request.id)}
              className="flex w-full items-center justify-between gap-4 rounded-lg border bg-card p-4 text-right shadow-sm transition-colors hover:bg-muted/20"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <LockKeyhole className="h-4 w-4 text-primary" />
                  <span className="font-mono text-sm font-black text-primary" dir="ltr">{request.requestNumber}</span>
                  <Badge className={cn("border", statusStyles[request.status])}>{reportRequestStatusLabels[request.status]}</Badge>
                </div>
                <p className="mt-2 truncate text-base font-black text-slate-950 dark:text-foreground">{request.title}</p>
              </div>
              <span className="flex shrink-0 items-center gap-2 rounded-md border bg-muted/10 px-3 py-2 text-xs font-bold text-muted-foreground">
                <Eye className="h-4 w-4" />
                عرض
              </span>
            </button>
          );
        }
        return (
        <article key={request.id} className={cn("overflow-hidden rounded-lg border bg-card shadow-sm", request.isLocked && "border-primary/30")}>
          <div className="grid gap-4 border-b bg-muted/10 p-5 xl:grid-cols-[1fr_320px]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-black text-primary" dir="ltr">{request.requestNumber}</span>
                <Badge className={cn("border", statusStyles[request.status])}>{reportRequestStatusLabels[request.status]}</Badge>
                {request.isLocked ? <Badge className="border-primary/20 bg-primary/10 text-primary"><LockKeyhole className="ml-1 h-3.5 w-3.5" />مقفل</Badge> : null}
              </div>
              <h2 className="mt-3 text-xl font-black text-slate-950 dark:text-foreground">{request.title}</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">{request.details}</p>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setDeleting(request)}
                disabled={isPending && activeId === request.id}
                className="mt-4"
              >
                <Trash2 className="h-4 w-4" />
                حذف الطلب
              </Button>
            </div>

            <div className="space-y-3 rounded-lg border bg-background p-4 text-sm">
              <InfoLine icon={UserRound} label="مقدم الطلب" value={request.requesterName ?? "غير محدد"} />
              <InfoLine icon={Mail} label="البريد الإلكتروني" value={request.requesterEmail ?? "غير محدد"} dir="ltr" />
              <InfoLine icon={CheckCircle2} label="المصرف" value={request.requesterBank ?? "غير محدد"} />
              <InfoLine icon={Clock3} label="تاريخ الطلب" value={formatDate(request.createdAt)} />
              {request.reviewedByName ? <InfoLine icon={RefreshCw} label="آخر تحديث" value={`${request.reviewedByName} - ${formatDate(request.reviewedAt)}`} /> : null}
              {request.isLocked ? <InfoLine icon={LockKeyhole} label="قفل الطلب" value={`${request.lockedByName ?? "المدير العام"} - ${formatDate(request.lockedAt)}`} /> : null}
              {request.reportFileUrl ? (
                <a href={request.reportFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border bg-primary/5 p-3 text-sm font-bold text-primary hover:bg-primary/10">
                  <Download className="h-4 w-4" />
                  <span className="min-w-0 flex-1 truncate">{request.reportFileName ?? "ملف التقرير"}</span>
                </a>
              ) : null}
            </div>
          </div>

          {request.isLocked ? (
            <div className="flex items-center justify-between gap-3 border-t p-4">
              <p className="text-sm font-semibold text-muted-foreground">هذا الطلب مقفل للعرض فقط ولا يمكن تعديله.</p>
              <Button type="button" variant="outline" onClick={() => toggleLocked(request.id)}>تصغير</Button>
            </div>
          ) : (
          <form action={(formData) => updateRequest(request.id, formData)} className="grid gap-4 p-5 xl:grid-cols-[220px_1fr_280px_auto] xl:items-end">
            <label className="grid gap-2 text-sm font-semibold">
              حالة الطلب
              <select name="status" defaultValue={request.status} className="h-11 rounded-md border bg-background px-3 text-sm">
                {Object.values(ReportRequestStatus).map((status) => (
                  <option key={status} value={status}>{reportRequestStatusLabels[status]}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              ملاحظات المدير العام
              <textarea
                name="managerNotes"
                defaultValue={request.managerNotes ?? ""}
                rows={3}
                placeholder="اكتب قرارك، الملاحظات المطلوبة، أو تفاصيل إنجاز التقرير."
                className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm leading-6"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              رفع ملف التقرير
              <span className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/10 px-3 text-center text-xs text-muted-foreground hover:border-primary/50 hover:bg-primary/5">
                <FileUp className="mb-1 h-5 w-5 text-primary" />
                PDF / Word / Excel حتى 15 MB
                <input name="reportFile" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" className="sr-only" />
              </span>
            </label>

            <div className="grid gap-2">
              <Button name="action" value="save" disabled={isPending && activeId === request.id} className="h-11">
                {request.status === "REJECTED" ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                {isPending && activeId === request.id ? "جارٍ الحفظ..." : "حفظ التحديث"}
              </Button>
              <Button name="action" value="lock" variant="outline" disabled={isPending && activeId === request.id} className="h-11">
                <LockKeyhole className="h-4 w-4" />
                قفل الطلب
              </Button>
            </div>
          </form>
          )}
        </article>
        );
      })}
    </div>
    <ConfirmDialog
      open={Boolean(deleting)}
      onOpenChange={(open) => !open && setDeleting(null)}
      title="حذف طلب التقرير؟"
      description={`سيتم حذف الطلب ${deleting?.requestNumber ?? ""} نهائياً مع ملف التقرير المرفوع إن وجد.`}
      confirmLabel="حذف"
      destructive
      busy={Boolean(deleting && isPending && activeId === deleting.id)}
      onConfirm={deleteRequest}
    />
    </>
  );
}

function InfoLine({ icon: Icon, label, value, dir }: { icon: typeof UserRound; label: string; value: string; dir?: "ltr" | "rtl" }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-words font-bold" dir={dir}>{value}</p>
      </div>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "غير محدد";
  return new Intl.DateTimeFormat("ar-IQ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
