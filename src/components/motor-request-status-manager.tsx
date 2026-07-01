"use client";

import { MotorRequestStatus } from "@prisma/client";
import { CheckCircle2, Clock3, RotateCcw, Send, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const actions = [
  { status: MotorRequestStatus.UNDER_REVIEW, label: "قيد المراجعة", icon: Clock3, className: "border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-200 dark:hover:bg-blue-950/40" },
  { status: MotorRequestStatus.NEEDS_INFO, label: "بحاجة معلومات", icon: RotateCcw, className: "border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-200 dark:hover:bg-amber-950/40" },
  { status: MotorRequestStatus.APPROVED, label: "موافقة", icon: CheckCircle2, className: "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-200 dark:hover:bg-emerald-950/40" },
  { status: MotorRequestStatus.REJECTED, label: "رفض", icon: XCircle, className: "border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-200 dark:hover:bg-red-950/40" }
];

export function MotorRequestStatusManager({
  requestId,
  currentStatus,
  initialNotes
}: {
  requestId: string;
  currentStatus: MotorRequestStatus;
  initialNotes?: string | null;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [busyStatus, setBusyStatus] = useState<MotorRequestStatus | null>(null);
  const [error, setError] = useState("");

  async function updateStatus(status: MotorRequestStatus) {
    setBusyStatus(status);
    setError("");
    const response = await fetch(`/api/motor-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, managerNotes: notes })
    });
    const result = await response.json();
    setBusyStatus(null);
    if (!response.ok) {
      setError(result.error ?? "تعذر تحديث حالة الطلب.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="managerNotes">ملاحظات الإدارة</Label>
        <textarea
          id="managerNotes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={5}
          placeholder="اكتب سبب الموافقة أو الرفض أو المعلومات المطلوبة من الوكيل"
          className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring dark:border-border dark:bg-slate-900/40"
        />
      </div>

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">{error}</p> : null}

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
  );
}
