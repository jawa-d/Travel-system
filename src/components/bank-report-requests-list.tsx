"use client";

import { ReportRequestStatus } from "@prisma/client";
import { Clock3, Download, FileQuestion, Inbox } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { reportRequestStatusLabels } from "@/lib/report-requests";
import { cn } from "@/lib/utils";

export type BankReportRequestItem = {
  id: string;
  requestNumber: string;
  title: string;
  status: ReportRequestStatus;
  reportFileUrl: string | null;
  reportFileName: string | null;
  reportFileUploadedAt: string | null;
  createdAt: string;
};

const statusStyles: Record<ReportRequestStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  IN_REVIEW: "border-blue-200 bg-blue-50 text-blue-800",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  REJECTED: "border-red-200 bg-red-50 text-red-800"
};

export function BankReportRequestsList({ requests }: { requests: BankReportRequestItem[] }) {
  if (!requests.length) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <Inbox className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <p className="font-bold">لا توجد طلبات تقارير</p>
        <p className="mt-1 text-sm text-muted-foreground">يمكنك إرسال طلب جديد ومتابعة حالته من هنا.</p>
        <Button asChild className="mt-5"><Link href="/report-requests/new">طلب تقرير جديد</Link></Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {requests.map((request) => (
        <article key={request.id} className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-black text-primary" dir="ltr">{request.requestNumber}</span>
                <Badge className={cn("border", statusStyles[request.status])}>{reportRequestStatusLabels[request.status]}</Badge>
              </div>
              <h2 className="mt-3 text-xl font-black text-slate-950 dark:text-foreground">{request.title}</h2>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                {formatDate(request.createdAt)}
              </div>
            </div>

            {request.reportFileUrl ? (
              <Button asChild className="shrink-0">
                <a href={request.reportFileUrl} target="_blank" rel="noreferrer">
                  <Download className="h-4 w-4" />
                  تنزيل التقرير
                </a>
              </Button>
            ) : (
              <div className="flex shrink-0 items-center gap-2 rounded-lg border bg-muted/10 px-4 py-3 text-sm font-semibold text-muted-foreground">
                <FileQuestion className="h-4 w-4" />
                لم يتم رفع الملف بعد
              </div>
            )}
          </div>

          {request.reportFileName ? <p className="mt-4 border-t pt-4 text-xs font-semibold text-muted-foreground">{request.reportFileName} - {formatDate(request.reportFileUploadedAt)}</p> : null}
        </article>
      ))}
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "غير محدد";
  return new Intl.DateTimeFormat("ar-IQ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
