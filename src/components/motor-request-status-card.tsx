"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ClipboardList, X } from "lucide-react";
import { MotorRequestStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { MotorRequestStatusManager } from "@/components/motor-request-status-manager";
import { useState } from "react";

export function MotorRequestStatusCard({
  requestId,
  currentStatus,
  initialNotes
}: {
  requestId: string;
  currentStatus: MotorRequestStatus;
  initialNotes: string | null;
}) {
  const [open, setOpen] = useState(false);

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
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
          فتح
        </Button>
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-slate-950/55 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[81] max-h-[88vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl focus:outline-none">
            <div className="flex items-start justify-between gap-4 border-b bg-muted/20 p-5">
              <div>
                <Dialog.Title className="text-lg font-black">إدارة الطلب</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm leading-6 text-muted-foreground">
                  تعديل حالة الطلب وإضافة ملاحظات الإدارة.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="إغلاق">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            <div className="max-h-[calc(88vh-104px)] overflow-y-auto p-5">
              <MotorRequestStatusManager requestId={requestId} currentStatus={currentStatus} initialNotes={initialNotes} />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
