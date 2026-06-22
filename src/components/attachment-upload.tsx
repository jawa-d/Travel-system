"use client";

import { useId, useState } from "react";
import { Download, FilePlus2, Paperclip, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { deleteStoredFile, getStoredFile, storeFile } from "@/lib/file-storage";

type Attachment = { id: string; name: string; type: string; size: number };

export function AttachmentUpload({
  value,
  onChange,
  label = "المرفقات"
}: {
  value: Attachment[];
  onChange: (value: Attachment[]) => void;
  label?: string;
}) {
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    if (!files.length) return;
    if (files.some((file) => file.size > 8 * 1024 * 1024)) {
      setError("حجم الملف الواحد يجب ألا يتجاوز 8 ميجابايت.");
      return;
    }
    setBusy(true);
    try {
      const stored = await Promise.all(files.map(storeFile));
      onChange([...value, ...stored]);
      setError("");
    } catch {
      setError("تعذر حفظ المرفقات داخل المتصفح.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  async function open(attachment: Attachment) {
    const stored = await getStoredFile(attachment.id);
    if (!stored) return;
    const url = URL.createObjectURL(stored.blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <label htmlFor={inputId} className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/15 p-4 hover:border-primary/50 hover:bg-primary/5">
        <FilePlus2 className="mb-2 h-6 w-6 text-primary" />
        <span className="text-sm font-semibold">{busy ? "جارٍ حفظ الملفات..." : "اختر ملفات أو صور"}</span>
        <span className="mt-1 text-xs text-muted-foreground">حتى 8 MB لكل ملف</span>
        <input id={inputId} type="file" multiple className="sr-only" disabled={busy} onChange={upload} />
      </label>
      {value.map((attachment) => (
        <div key={attachment.id} className="flex items-center justify-between rounded-lg border bg-white p-2">
          <span className="flex min-w-0 items-center gap-2 text-sm"><Paperclip className="h-4 w-4 text-primary" /><span className="truncate">{attachment.name}</span></span>
          <div className="flex gap-1">
            <Button type="button" size="icon" variant="ghost" onClick={() => open(attachment)}><Download className="h-4 w-4" /></Button>
            <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={async () => {
              await deleteStoredFile(attachment.id);
              onChange(value.filter((item) => item.id !== attachment.id));
            }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      ))}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
