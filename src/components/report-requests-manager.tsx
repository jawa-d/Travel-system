"use client";

import { ReportRequestStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2, Clock3, Mail, MessageSquareText, RefreshCw, UserRound, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const [isPending, startTransition] = useTransition();

  function updateRequest(id: string, formData: FormData) {
    const status = String(formData.get("status")) as ReportRequestStatus;
    const managerNotes = String(formData.get("managerNotes") ?? "").trim();
    setActiveId(id);
    startTransition(async () => {
      const response = await fetch(`/api/report-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, managerNotes })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({ title: result.error ?? "تعذر تحديث طلب التقرير", tone: "error" });
        setActiveId(null);
        return;
      }
      toast({ title: "تم تحديث طلب التقرير", tone: "success" });
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
    <div className="space-y-4">
      {requests.map((request) => (
        <article key={request.id} className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="grid gap-4 border-b bg-muted/10 p-5 xl:grid-cols-[1fr_320px]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-black text-primary" dir="ltr">{request.requestNumber}</span>
                <Badge className={cn("border", statusStyles[request.status])}>{reportRequestStatusLabels[request.status]}</Badge>
              </div>
              <h2 className="mt-3 text-xl font-black text-slate-950 dark:text-foreground">{request.title}</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">{request.details}</p>
            </div>

            <div className="space-y-3 rounded-lg border bg-background p-4 text-sm">
              <InfoLine icon={UserRound} label="مقدم الطلب" value={request.requesterName ?? "غير محدد"} />
              <InfoLine icon={Mail} label="البريد الإلكتروني" value={request.requesterEmail ?? "غير محدد"} dir="ltr" />
              <InfoLine icon={CheckCircle2} label="المصرف" value={request.requesterBank ?? "غير محدد"} />
              <InfoLine icon={Clock3} label="تاريخ الطلب" value={formatDate(request.createdAt)} />
              {request.reviewedByName ? <InfoLine icon={RefreshCw} label="آخر تحديث" value={`${request.reviewedByName} - ${formatDate(request.reviewedAt)}`} /> : null}
            </div>
          </div>

          <form action={(formData) => updateRequest(request.id, formData)} className="grid gap-4 p-5 lg:grid-cols-[240px_1fr_auto] lg:items-end">
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

            <Button disabled={isPending && activeId === request.id} className="h-11">
              {request.status === "REJECTED" ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {isPending && activeId === request.id ? "جارٍ الحفظ..." : "حفظ التحديث"}
            </Button>
          </form>
        </article>
      ))}
    </div>
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
