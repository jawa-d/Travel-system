"use client";

import { useState } from "react";
import { Download, FileUp, LoaderCircle, Paperclip, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";

export type ReferralAttachment = {
  url: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedByName: string;
};

export function ReferralTakafulAttachments({
  referralId,
  initialAttachments,
  canManage
}: {
  referralId: string;
  initialAttachments: ReferralAttachment[];
  canManage: boolean;
}) {
  const [attachments, setAttachments] = useState(initialAttachments);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`/api/referrals/${referralId}/attachments`, {
      method: "POST",
      body: formData
    });
    const result = await response.json().catch(() => null);
    setBusy(false);
    event.target.value = "";
    if (!response.ok) {
      toast({ title: "تعذر رفع المرفق", description: result?.error, tone: "error" });
      return;
    }
    setAttachments(result.attachments ?? []);
    toast({ title: "تم رفع المرفق", description: "أصبح الملف متاحا للبنك للتحميل.", tone: "success" });
  }

  async function remove(url: string) {
    if (!window.confirm("حذف هذا المرفق؟")) return;
    setBusy(true);
    const response = await fetch(`/api/referrals/${referralId}/attachments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });
    const result = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) {
      toast({ title: "تعذر حذف المرفق", description: result?.error, tone: "error" });
      return;
    }
    setAttachments(result.attachments ?? []);
    toast({ title: "تم حذف المرفق", tone: "success" });
  }

  return (
    <div className="space-y-4">
      {canManage ? (
        <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/15 p-4 text-center hover:border-primary/50 hover:bg-primary/5">
          {busy ? <LoaderCircle className="mb-2 h-6 w-6 animate-spin text-primary" /> : <FileUp className="mb-2 h-6 w-6 text-primary" />}
          <span className="text-sm font-bold">{busy ? "جاري رفع الملف..." : "إرفاق ملف من تكافل العراق"}</span>
          <span className="mt-1 text-xs text-muted-foreground">PDF, صور, Word, Excel حتى 12 MB</span>
          <input type="file" className="sr-only" disabled={busy} onChange={upload} accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx" />
        </label>
      ) : null}

      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div key={attachment.url} className="flex flex-col gap-3 rounded-lg border bg-muted/10 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="flex min-w-0 items-center gap-2 text-sm font-bold">
                <Paperclip className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{attachment.name}</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatSize(attachment.size)} - رفع بواسطة {attachment.uploadedByName || "تكافل العراق"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline">
                <a href={attachment.url} target="_blank" rel="noreferrer" download>
                  <Download className="h-4 w-4" />
                  تحميل
                </a>
              </Button>
              {canManage ? (
                <Button type="button" size="sm" variant="destructive" disabled={busy} onClick={() => remove(attachment.url)}>
                  <Trash2 className="h-4 w-4" />
                  حذف
                </Button>
              ) : null}
            </div>
          </div>
        ))}
        {!attachments.length ? <p className="rounded-lg border bg-muted/10 p-4 text-center text-sm text-muted-foreground">لا توجد مرفقات من تكافل العراق بعد.</p> : null}
      </div>
    </div>
  );
}

function formatSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
}
