"use client";

import { Archive, Download, Images } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getStoredFile } from "@/lib/file-storage";

type DownloadableFile = {
  id?: string;
  url?: string;
  name: string;
  label?: string;
  category?: string;
  type?: string;
};

type ZipEntry = {
  name: string;
  data: Uint8Array<ArrayBuffer>;
};

const textEncoder = new TextEncoder();
const crcTable = makeCrcTable();

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

function fileExtension(name: string, type?: string) {
  const match = name.match(/\.[A-Za-z0-9]{2,5}$/);
  return match?.[0] ?? extensionFromType(type);
}

function makeDownloadName(file: DownloadableFile, folder: string, index: number, usedNames: Set<string>) {
  const readableName = file.category ?? file.label ?? file.name;
  const base = sanitizeFileName(`${String(index + 1).padStart(2, "0")}-${readableName}`);
  const extension = fileExtension(file.name, file.type);
  let name = `${folder}/${base}${extension}`;
  let duplicate = 2;

  while (usedNames.has(name)) {
    name = `${folder}/${base}-${duplicate}${extension}`;
    duplicate += 1;
  }

  usedNames.add(name);
  return name;
}

async function readFileBytes(file: DownloadableFile): Promise<Uint8Array<ArrayBuffer>> {
  const source = file.url ?? file.id ?? "";
  if (!source) throw new Error(`لا يوجد رابط للملف: ${file.name}`);

  if (source.startsWith("idb://")) {
    const stored = await getStoredFile(source);
    if (!stored) throw new Error(`تعذر إيجاد الملف المحلي: ${file.name}`);
    return new Uint8Array(await stored.blob.arrayBuffer());
  }

  const response = await fetch(source);
  if (!response.ok) throw new Error(`تعذر تحميل الملف: ${file.name}`);
  return new Uint8Array(await response.arrayBuffer());
}

async function buildZipEntries(files: DownloadableFile[], folder: string) {
  const usedNames = new Set<string>();
  const entries: ZipEntry[] = [];

  for (const [index, file] of files.entries()) {
    entries.push({
      name: makeDownloadName(file, folder, index, usedNames),
      data: await readFileBytes(file)
    });
  }

  return entries;
}

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let index = 0; index < table.length; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
}

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(output: number[], value: number) {
  output.push(value & 0xff, (value >>> 8) & 0xff);
}

function writeUint32(output: number[], value: number) {
  output.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function dosDateTime(date = new Date()) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, date: dosDate };
}

function createZip(entries: ZipEntry[]) {
  const parts: BlobPart[] = [];
  const centralDirectory: number[] = [];
  let offset = 0;
  const { time, date } = dosDateTime();

  for (const entry of entries) {
    const nameBytes = textEncoder.encode(entry.name);
    const checksum = crc32(entry.data);
    const localHeader: number[] = [];
    const localOffset = offset;

    writeUint32(localHeader, 0x04034b50);
    writeUint16(localHeader, 20);
    writeUint16(localHeader, 0x0800);
    writeUint16(localHeader, 0);
    writeUint16(localHeader, time);
    writeUint16(localHeader, date);
    writeUint32(localHeader, checksum);
    writeUint32(localHeader, entry.data.length);
    writeUint32(localHeader, entry.data.length);
    writeUint16(localHeader, nameBytes.length);
    writeUint16(localHeader, 0);

    parts.push(new Uint8Array(localHeader), nameBytes, entry.data);
    offset += localHeader.length + nameBytes.length + entry.data.length;

    writeUint32(centralDirectory, 0x02014b50);
    writeUint16(centralDirectory, 20);
    writeUint16(centralDirectory, 20);
    writeUint16(centralDirectory, 0x0800);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, time);
    writeUint16(centralDirectory, date);
    writeUint32(centralDirectory, checksum);
    writeUint32(centralDirectory, entry.data.length);
    writeUint32(centralDirectory, entry.data.length);
    writeUint16(centralDirectory, nameBytes.length);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint32(centralDirectory, 0);
    writeUint32(centralDirectory, localOffset);
    centralDirectory.push(...nameBytes);
  }

  const centralDirectoryOffset = offset;
  parts.push(new Uint8Array(centralDirectory));

  const endRecord: number[] = [];
  writeUint32(endRecord, 0x06054b50);
  writeUint16(endRecord, 0);
  writeUint16(endRecord, 0);
  writeUint16(endRecord, entries.length);
  writeUint16(endRecord, entries.length);
  writeUint32(endRecord, centralDirectory.length);
  writeUint32(endRecord, centralDirectoryOffset);
  writeUint16(endRecord, 0);
  parts.push(new Uint8Array(endRecord));

  return new Blob(parts, { type: "application/zip" });
}

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
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
    const files = kind === "images" ? vehicleImages : kind === "documents" ? documents : [...vehicleImages, ...documents];
    if (!files.length) {
      setError("لا توجد ملفات متاحة للتنزيل.");
      return;
    }

    setBusy(kind);
    setError("");

    try {
      const entries = kind === "all"
        ? [
            ...(await buildZipEntries(vehicleImages, "vehicle-images")),
            ...(await buildZipEntries(documents, "documents"))
          ]
        : await buildZipEntries(files, kind === "images" ? "vehicle-images" : "documents");

      const zip = createZip(entries);
      saveBlob(zip, `${sanitizeFileName(`${requestNumber}-${kind}`)}.zip`);
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
        <Archive className="h-4 w-4" />
        {busy === "all" ? "جاري تجهيز الملف..." : "تحميل كل الملفات"}
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
        سيتم تنزيل الملفات داخل ملف ZIP واحد، حتى لا يطلب المتصفح السماح بتنزيل عدة ملفات.
      </p>
    </div>
  );
}
