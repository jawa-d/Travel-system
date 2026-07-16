"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";

export function ProfileImageForm({ initialImage = "" }: { initialImage?: string | null }) {
  const [image, setImage] = useState(initialImage ?? "");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function saveImage() {
    startTransition(async () => {
      const response = await fetch("/api/profile/image", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: image || null })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({ title: result.error ?? "تعذر حفظ صورة الحساب", tone: "error" });
        return;
      }
      toast({ title: "تم حفظ صورة الحساب", tone: "success" });
    });
  }

  return (
    <div className="space-y-4">
      <ImageUpload name="profileImage" label="صورة الحساب" value={image} onChange={setImage} />
      <Button type="button" className="w-full" onClick={saveImage} disabled={isPending}>
        <Save className="h-4 w-4" />
        {isPending ? "جارٍ الحفظ..." : "حفظ صورة الحساب"}
      </Button>
    </div>
  );
}
