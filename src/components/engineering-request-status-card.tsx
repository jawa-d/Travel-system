"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { EngineeringRequestStatus } from "@prisma/client";
import { CheckCircle2, ClipboardList, Clock3, FileCheck2, RotateCcw, Send, X, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const actions = [
  { status: EngineeringRequestStatus.UNDER_REVIEW, label: "قيد المراجعة", icon: Clock3, className: "border-blue-200 text-blue-700 hover:bg-blue-50" },
  { status: EngineeringRequestStatus.NEEDS_INFO, label: "بحاجة معلومات", icon: RotateCcw, className: "border-amber-200 text-amber-700 hover:bg-amber-50" },
  { status: EngineeringRequestStatus.QUOTED, label: "تم التسعير", icon: FileCheck2, className: "border-violet-200 text-violet-700 hover:bg-violet-50" },
  { status: EngineeringRequestStatus.APPROVED, label: "موافقة", icon: CheckCircle2, className: "border-emerald-200 text-emerald-700 hover:bg-emerald-50" },
  { status: EngineeringRequestStatus.REJECTED, label: "رفض", icon: XCircle, className: "border-red-200 text-red-700 hover:bg-red-50" }
];

export function EngineeringRequestStatusCard({
  requestId,
  currentStatus,
  initialNotes
}: {
  requestId: string;
  currentStatus: EngineeringRequestStatus;
  initialNotes: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [busyStatus, setBusyStatus] = useState<EngineeringRequestStatus | null>(null);
  const [error, setError] = useState("");

  async function updateStatus(status: EngineeringRequestStatus) {
    setBusyStatus(status);
    setError("");
    const response = await fetch(`/api/engineering-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, managerNotes: notes })
    });
    const result = await response.json().catch(() => null);
    setBusyStatus(null);
    if (!response.ok) {
      setError(result?.error ?? "تعذر تحديث حالة الطلب.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <ClipboardList className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">إدارة الطلب</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">تحديث حالة الطلب وملاحظات الإدارة من نافذة مخصصة.</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>فتح</Button>
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-slate-950/55 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[81] max-h-[88vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl focus:outline-none">
            <div className="flex items-start justify-between gap-4 border-b bg-muted/20 p-5">
              <div>
                <Dialog.Title className="text-lg font-black">إدارة الطلب</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm leading-6 text-muted-foreground">
                  تعديل حالة طلب التأمين الهندسي وإضافة ملاحظات الإدارة.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="إغلاق">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            <div className="space-y-4 p-5">
              <div className="space-y-2">
                <Label htmlFor="engineeringManagerNotes">ملاحظات الإدارة</Label>
                <textarea
                  id="engineeringManagerNotes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={5}
                  className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p> : null}
              <div className="grid gap-2 sm:grid-cols-2">
                {actions.map((action) => {
                  const Icon = action.icon;
                  const active = currentStatus === action.status;
                  return (
                    <Button
                      key={action.status}
                      type="button"
                      variant="outline"
                      disabled={Boolean(busyStatus)}
                      onClick={() => updateStatus(action.status)}
                      className={cn("justify-start", action.className, active && "ring-2 ring-primary/25")}
                    >
                      {busyStatus === action.status ? <Send className="h-4 w-4 animate-pulse" /> : <Icon className="h-4 w-4" />}
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
