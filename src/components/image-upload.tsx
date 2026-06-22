"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { deleteStoredFile, storeFile } from "@/lib/file-storage";
import { StoredImage } from "@/components/stored-image";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ImageUpload({
  name,
  label = "صورة الجواز",
  value = "",
  onChange
}: {
  name: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  function update(value: string) {
    onChange?.(value);
  }

  function selectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("اختر صورة بصيغة JPG أو PNG أو WEBP.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("حجم الصورة يجب ألا يتجاوز 2 ميجابايت.");
      event.target.value = "";
      return;
    }

    storeFile(file).then((stored) => {
      setError("");
      update(stored.id);
    }).catch(() => setError("تعذر حفظ الصورة، حاول اختيار ملف آخر."));
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`${name}-file`}>{label}</Label>
      <input type="hidden" name={name} value={value} readOnly />
      <input
        id={`${name}-file`}
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={selectFile}
        className="sr-only"
      />

      {value ? (
        <div className="overflow-hidden rounded-xl border bg-muted/20">
          <StoredImage source={value} alt={label} className="h-44 w-full object-contain bg-white" />
          <div className="flex items-center justify-between border-t p-2">
            <span className="text-xs text-muted-foreground">تم اختيار الصورة</span>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
                <Upload className="h-4 w-4" />
                تغيير
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={async () => {
                  if (value.startsWith("idb://")) await deleteStoredFile(value);
                  update("");
                  if (inputRef.current) inputRef.current.value = "";
                }}
              >
                <Trash2 className="h-4 w-4" />
                حذف
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex min-h-32 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/15 p-5 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
        >
          <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <ImagePlus className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold">اضغط لرفع صورة الجواز</span>
          <span className="mt-1 text-xs text-muted-foreground">JPG أو PNG أو WEBP — بحد أقصى 2 MB</span>
        </button>
      )}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
