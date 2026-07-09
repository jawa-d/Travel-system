"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Trash2, UserRound } from "lucide-react";
import { MotorRequestStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast-provider";
import { formatCurrency, formatDate } from "@/lib/utils";

type MotorRequestListItem = {
  id: string;
  requestNumber: string;
  status: MotorRequestStatus;
  customerFullName: string;
  manufacturer: string;
  model: string;
  plateNumber: string;
  estimatedVehicleValue: unknown;
  createdDate: Date | string;
  createdTime: string;
};

export function MotorRequestsList({
  requests,
  canDelete
}: {
  requests: MotorRequestListItem[];
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

  async function deleteSelected() {
    setBusy(true);
    try {
      const failed: string[] = [];
      for (const id of selected) {
        const response = await fetch(`/api/motor-requests/${id}`, { method: "DELETE" });
        if (!response.ok) failed.push(id);
      }

      if (failed.length) {
        toast({
          title: "تعذر حذف بعض الطلبات",
          description: `تم رفض حذف ${failed.length} من ${selected.length} طلب.`,
          tone: "error"
        });
      } else {
        toast({
          title: "تم حذف الطلبات",
          description: `تم حذف ${selected.length} طلب بنجاح.`,
          tone: "success"
        });
      }

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
          <Button
            type="button"
            variant="destructive"
            disabled={!selected.length || busy}
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            حذف المحدد ({selected.length})
          </Button>
        </div>
      ) : null}

      <div className="divide-y">
        {requests.map((request) => (
          <div
            key={request.id}
            className="grid gap-3 p-4 transition-colors hover:bg-muted/30 lg:grid-cols-[auto_1fr_1fr_1fr_auto]"
          >
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
              <p className="mt-1 flex items-center gap-2 text-sm font-bold">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                {request.customerFullName}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">المركبة</p>
              <p className="mt-1 text-sm font-bold">{request.manufacturer} {request.model}</p>
              <p className="mt-1 text-xs text-muted-foreground" dir="ltr">{request.plateNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">القيمة والتاريخ</p>
              <p className="mt-1 text-sm font-bold" dir="ltr">{formatCurrency(Number(request.estimatedVehicleValue))}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatDate(request.createdDate)} - {request.createdTime}</p>
            </div>
            <div className="flex items-center gap-2 lg:justify-end">
              <Badge className={statusClasses[request.status]}>{statusLabels[request.status]}</Badge>
              <Button asChild size="sm" variant="outline">
                <Link href={`/motor-requests/${request.id}`}>عرض</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="حذف الطلبات المحددة؟"
        description={`سيتم حذف ${selected.length} طلب نهائيًا إذا لم تكن صادرة كوثائق.`}
        confirmLabel="حذف المحدد"
        destructive
        busy={busy}
        onConfirm={deleteSelected}
      />
    </>
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
