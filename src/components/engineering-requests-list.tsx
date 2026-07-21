"use client";

import { EngineeringRequestStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Building2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast-provider";
import { formatDate } from "@/lib/utils";

type EngineeringRequestListItem = {
  id: string;
  requestNumber: string;
  status: EngineeringRequestStatus;
  customerFullName: string;
  customerMobile: string;
  projectName: string;
  projectType: string;
  projectLocation: string;
  contractValue: string;
  currency: string;
  insuranceType: string;
  source: string;
  createdDate: string;
  createdTime: string;
};

export function EngineeringRequestsList({
  requests,
  canManage,
  canDelete
}: {
  requests: EngineeringRequestListItem[];
  canManage: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const allSelected = requests.length > 0 && selected.length === requests.length;

  function toggleRequest(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleAll() {
    setSelected(allSelected ? [] : requests.map((request) => request.id));
  }

  async function updateStatus(id: string, status: EngineeringRequestStatus) {
    setBusy(true);
    try {
      const response = await fetch(`/api/engineering-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error("تعذر تحديث حالة الطلب.");
      toast({ title: "تم تحديث الحالة", tone: "success" });
      router.refresh();
    } catch (error) {
      toast({ title: "تعذر تحديث الحالة", description: error instanceof Error ? error.message : undefined, tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function deleteSelected() {
    setBusy(true);
    try {
      const failed: string[] = [];
      for (const id of selected) {
        const response = await fetch(`/api/engineering-requests/${id}`, { method: "DELETE" });
        if (!response.ok) failed.push(id);
      }
      toast(failed.length ? {
        title: "تعذر حذف بعض الطلبات",
        description: `تم رفض حذف ${failed.length} من ${selected.length} طلب.`,
        tone: "error"
      } : {
        title: "تم حذف الطلبات",
        description: `تم حذف ${selected.length} طلب بنجاح.`,
        tone: "success"
      });
      setSelected([]);
      setConfirmOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {canDelete ? (
        <div className="flex flex-col gap-3 border-b bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="h-5 w-5 rounded border-slate-300 accent-[hsl(var(--primary))]"
              aria-label="تحديد كل الطلبات"
            />
            تحديد الكل
          </label>
          <Button type="button" variant="destructive" disabled={!selected.length || busy} onClick={() => setConfirmOpen(true)}>
            <Trash2 className="h-4 w-4" />
            حذف المحدد ({selected.length})
          </Button>
        </div>
      ) : null}

      <div className="divide-y">
        {requests.map((request) => (
          <div key={request.id} className="grid gap-3 p-4 transition-colors hover:bg-muted/30 lg:grid-cols-[auto_1.2fr_1.2fr_1fr_auto]">
            {canDelete ? (
              <div className="flex items-start pt-1">
                <input
                  type="checkbox"
                  checked={selectedSet.has(request.id)}
                  onChange={() => toggleRequest(request.id)}
                  className="h-5 w-5 rounded border-slate-300 accent-[hsl(var(--primary))]"
                  aria-label={`تحديد الطلب ${request.requestNumber}`}
                />
              </div>
            ) : null}
            <div>
              <p className="font-mono text-sm font-black text-primary" dir="ltr">{request.requestNumber}</p>
              <p className="mt-1 text-sm font-bold">{request.customerFullName}</p>
              <p className="mt-1 text-xs text-muted-foreground" dir="ltr">{request.customerMobile}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">المشروع</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-bold">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {request.projectName}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{request.projectType} - {request.projectLocation}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">القيمة والتاريخ</p>
              <p className="mt-1 text-sm font-bold" dir="ltr">{formatMoney(Number(request.contractValue), request.currency)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatDate(request.createdDate)} - {request.createdTime}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <Badge className={statusClasses[request.status]}>{statusLabels[request.status]}</Badge>
              {canManage ? (
                <select
                  value={request.status}
                  disabled={busy}
                  onChange={(event) => updateStatus(request.id, event.target.value as EngineeringRequestStatus)}
                  className="h-9 rounded-lg border bg-background px-2 text-xs font-bold outline-none focus:ring-2 focus:ring-ring"
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="حذف الطلبات المحددة؟"
        description={`سيتم حذف ${selected.length} طلب تأمين هندسي نهائياً.`}
        confirmLabel="حذف المحدد"
        destructive
        busy={busy}
        onConfirm={deleteSelected}
      />
    </>
  );
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "IQD",
      maximumFractionDigits: 2
    }).format(amount);
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
