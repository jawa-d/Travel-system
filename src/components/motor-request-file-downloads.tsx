"use client";

import { Download, Images } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getStoredFile } from "@/lib/file-storage";

type DownloadableFile = {
  id: string;
  name: string;
  label?: string;
  category?: string;
  type?: string;
};

function sanitizeFileName(value: string) {
  return value
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140) || "trinsu-file";
}

function extensionFromType(type?: string) {
  if (type === "image/jpeg") return ".jpg";
  if (type === "image/png") return ".png";
  if (type === "image/webp") return ".webp";
  if (type === "application/pdf") return ".pdf";
  return "";
}

async function downloadOne(file: DownloadableFile, prefix: string, index: number) {
  let url = file.id;
  let revoke = false;
  let type = file.type;

  if (file.id.startsWith("idb://")) {
    const stored = await getStoredFile(file.id);
    if (!stored) throw new Error(`Missing file: ${file.name}`);
    url = URL.createObjectURL(stored.blob);
    revoke = true;
    type = stored.type;
  }

  const extension = /\.[A-Za-z0-9]{2,5}$/.test(file.name) ? "" : extensionFromType(type);
  const readableName = file.category ?? file.label ?? file.name;
  const name = sanitizeFileName(`${prefix}-${String(index + 1).padStart(2, "0")}-${readableName}`) + extension;
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  if (revoke) {
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export function MotorRequestFileDownloads({
  requestNumber,
  vehicleImages,
  documents
}: {
  requestNumber: string;
  vehicleImages: DownloadableFile[];
  documents: DownloadableFile[];
}) {
  const [busy, setBusy] = useState<"images" | "documents" | "all" | null>(null);
  const [error, setError] = useState("");

  async function downloadFiles(kind: "images" | "documents" | "all") {
    setBusy(kind);
    setError("");
    const files = kind === "images" ? vehicleImages : kind === "documents" ? documents : [...vehicleImages, ...documents];
    try {
      for (const [index, file] of files.entries()) {
        await downloadOne(file, `${requestNumber}-${kind}`, index);
        await new Promise((resolve) => window.setTimeout(resolve, 160));
      }
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "تعذر تحميل الملفات.");
    } finally {
      setBusy(null);
    }
  }

  const disabled = Boolean(busy);

  return (
    <div className="space-y-3">
      <Button type="button" className="w-full" disabled={disabled} onClick={() => downloadFiles("all")}>
        <Download className="h-4 w-4" />
        {busy === "all" ? "جاري التحميل..." : "تحميل كل الملفات"}
      </Button>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" variant="outline" disabled={disabled || !vehicleImages.length} onClick={() => downloadFiles("images")}>
          <Images className="h-4 w-4" />
          صور المركبة
        </Button>
        <Button type="button" variant="outline" disabled={disabled || !documents.length} onClick={() => downloadFiles("documents")}>
          <Download className="h-4 w-4" />
          المستندات
        </Button>
      </div>
      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">{error}</p> : null}
      <p className="text-xs leading-5 text-muted-foreground">
        سيتم تحميل الملفات كملفات منفصلة. قد يطلب المتصفح السماح بتنزيل عدة ملفات.
      </p>
    </div>
  );
}
