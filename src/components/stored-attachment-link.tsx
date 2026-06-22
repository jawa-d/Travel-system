"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoredFile } from "@/lib/file-storage";
import { useToast } from "@/components/ui/toast-provider";

export function StoredAttachmentLink({ id, index }: { id: string; index: number }) {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  return (
    <Button type="button" size="sm" variant="outline" disabled={busy} onClick={async () => {
      setBusy(true);
      const file = await getStoredFile(id);
      setBusy(false);
      if (!file) {
        toast({ title: "المرفق غير موجود", description: "قد يكون محفوظًا في متصفح أو جهاز آخر.", tone: "error" });
        return;
      }
      const url = URL.createObjectURL(file.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    }}>
      {busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      مرفق {index + 1}
    </Button>
  );
}
