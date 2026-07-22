"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BadgeDollarSign, RotateCcw, Trash2, UserRound, X } from "lucide-react";
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
  estimatedVehicleValue: string;
  insurancePremium: string;
  netPremium: string;
  pricingCurrency: string;
  commission: { id: string; paid: boolean; commissionAmount: string } | null;
  createdDate: string;
  createdTime: string;
};

export function MotorRequestsList({
  requests,
  canDelete,
  canPayCommission
}: {
  requests: MotorRequestListItem[];
  canDelete: boolean;
  canPayCommission: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [commissionRequest, setCommissionRequest] = useState<MotorRequestListItem | null>(null);
  const [commissionRate, setCommissionRate] = useState("10");
  const [commissionAmount, setCommissionAmount] = useState("");
  const [commissionNotes, setCommissionNotes] = useState("");
  const [cancelCommissionRequest, setCancelCommissionRequest] = useState<MotorRequestListItem | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [busy, setBusy] = useState(false);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const allSelected = requests.length > 0 && selected.length === requests.length;

  function toggleRequest(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleAll() {
    setSelected(allSelected ? [] : requests.map((request) => request.id));
  }

  function openCommissionDialog(request: MotorRequestListItem) {
    const rate = "10";
    setCommissionRequest(request);
    setCommissionRate(rate);
    setCommissionAmount(((premiumValue(request) * Number(rate)) / 100).toFixed(2));
    setCommissionNotes("");
  }

  function updateRate(rate: string) {
    setCommissionRate(rate);
    if (commissionRequest) {
      setCommissionAmount(((premiumValue(commissionRequest) * Number(rate || 0)) / 100).toFixed(2));
    }
  }

  function openCancelCommissionDialog(request: MotorRequestListItem) {
    setCancelCommissionRequest(request);
    setCancelReason("");
  }

  async function deleteSelected() {
    setBusy(true);
    try {
      const failed: string[] = [];
      for (const id of selected) {
        const response = await fetch(`/api/motor-requests/${id}`, { method: "DELETE" });
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

  async function payCommission() {
    if (!commissionRequest) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/motor-requests/${commissionRequest.id}/commission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionRate, commissionAmount, notes: commissionNotes })
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        toast({
          title: "تعذر صرف العمولة",
          description: result?.error ?? "حدث خطأ أثناء صرف العمولة.",
          tone: "error"
        });
        return;
      }

      toast({
        title: "تم صرف العمولة",
        description: `تم تسجيل عمولة الطلب ${commissionRequest.requestNumber}.`,
        tone: "success"
      });
      setCommissionRequest(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function cancelCommission() {
    if (!cancelCommissionRequest) return;
    const reason = cancelReason.trim();
    if (!reason) {
      toast({
        title: "سبب الإلغاء مطلوب",
        description: "يرجى كتابة سبب إلغاء صرف العمولة قبل المتابعة.",
        tone: "error"
      });
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`/api/motor-requests/${cancelCommissionRequest.id}/commission`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason })
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        toast({
          title: "تعذر إلغاء صرف العمولة",
          description: result?.error ?? "حدث خطأ أثناء إلغاء صرف العمولة.",
          tone: "error"
        });
        return;
      }

      toast({
        title: "تم إلغاء صرف العمولة",
        description: `تم تسجيل سبب الإلغاء للطلب ${cancelCommissionRequest.requestNumber}.`,
        tone: "success"
      });
      setCancelCommissionRequest(null);
      setCancelReason("");
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
          <div key={request.id} className="grid gap-3 p-4 transition-colors hover:bg-muted/30 lg:grid-cols-[auto_1fr_1fr_1fr_auto]">
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
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <Badge className={statusClasses[request.status]}>{statusLabels[request.status]}</Badge>
              {canPayCommission ? (
                request.commission?.paid ? (
                  <>
                    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">مصروفة</Badge>
                    <Button type="button" size="sm" variant="outline" onClick={() => openCancelCommissionDialog(request)}>
                      <RotateCcw className="h-4 w-4" />
                      إلغاء صرف العمولة
                    </Button>
                  </>
                ) : (
                  <Button type="button" size="sm" variant="secondary" onClick={() => openCommissionDialog(request)}>
                    <BadgeDollarSign className="h-4 w-4" />
                    صرف العمولة
                  </Button>
                )
              ) : null}
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

      <Dialog.Root open={Boolean(cancelCommissionRequest)} onOpenChange={(open) => !busy && !open && setCancelCommissionRequest(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-slate-950/55 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[81] max-h-[88vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl focus:outline-none">
            <div className="flex items-start justify-between gap-3 border-b p-5">
              <div>
                <Dialog.Title className="text-lg font-black">إلغاء صرف العمولة</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  {cancelCommissionRequest ? `طلب رقم ${cancelCommissionRequest.requestNumber}` : ""}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label="إغلاق">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">
                سيتم تحويل حالة العمولة إلى غير مصروفة، ويمكن صرفها مرة أخرى لاحقًا عند الحاجة.
              </div>
              <label className="space-y-1.5 text-sm font-bold">
                <span>سبب الإلغاء</span>
                <textarea
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                  placeholder="اكتب سبب إلغاء صرف العمولة"
                  className="min-h-28 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t p-4">
              <Button type="button" variant="outline" disabled={busy} onClick={() => setCancelCommissionRequest(null)}>تراجع</Button>
              <Button type="button" variant="destructive" disabled={busy || !cancelReason.trim()} onClick={cancelCommission}>
                <RotateCcw className="h-4 w-4" />
                {busy ? "جارٍ الإلغاء..." : "إلغاء صرف العمولة"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={Boolean(commissionRequest)} onOpenChange={(open) => !busy && !open && setCommissionRequest(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-slate-950/55 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[81] max-h-[88vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl focus:outline-none">
            <div className="flex items-start justify-between gap-3 border-b p-5">
              <div>
                <Dialog.Title className="text-lg font-black">صرف العمولة</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  {commissionRequest ? `طلب رقم ${commissionRequest.requestNumber}` : ""}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label="إغلاق">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            {commissionRequest ? (
              <div className="space-y-4 p-5">
                <div className="rounded-lg border bg-muted/10 p-3">
                  <p className="text-xs text-muted-foreground">قيمة القسط</p>
                  <p className="mt-1 text-2xl font-black text-primary" dir="ltr">
                    {formatMoney(premiumValue(commissionRequest), commissionRequest.pricingCurrency)}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-sm font-bold">
                    <span>نسبة العمولة %</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={commissionRate}
                      onChange={(event) => updateRate(event.target.value)}
                      className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      dir="ltr"
                    />
                  </label>
                  <label className="space-y-1.5 text-sm font-bold">
                    <span>مبلغ العمولة</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={commissionAmount}
                      onChange={(event) => setCommissionAmount(event.target.value)}
                      className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      dir="ltr"
                    />
                  </label>
                </div>

                <label className="space-y-1.5 text-sm font-bold">
                  <span>ملاحظات</span>
                  <textarea
                    value={commissionNotes}
                    onChange={(event) => setCommissionNotes(event.target.value)}
                    className="min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
              </div>
            ) : null}

            <div className="flex justify-end gap-2 border-t p-4">
              <Button type="button" variant="outline" disabled={busy} onClick={() => setCommissionRequest(null)}>تراجع</Button>
              <Button type="button" disabled={busy || !Number(commissionAmount)} onClick={payCommission}>
                <BadgeDollarSign className="h-4 w-4" />
                {busy ? "جارٍ الصرف..." : "صرف عمولة"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function premiumValue(request: MotorRequestListItem) {
  return Number(request.netPremium) || Number(request.insurancePremium) || 0;
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
