"use client";

import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { getStoredFile } from "@/lib/file-storage";
import { cn } from "@/lib/utils";

export function StoredImage({ source, alt, className }: { source?: string | null; alt: string; className?: string }) {
  const [url, setUrl] = useState(source?.startsWith("data:") || source?.startsWith("http") ? source : "");

  useEffect(() => {
    let objectUrl = "";
    if (!source?.startsWith("idb://")) {
      setUrl(source ?? "");
      return;
    }
    getStoredFile(source).then((file) => {
      if (!file) return;
      objectUrl = URL.createObjectURL(file.blob);
      setUrl(objectUrl);
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source]);

  if (!url) return <span className={cn("grid place-items-center bg-muted text-muted-foreground", className)}><ImageIcon className="h-6 w-6" /></span>;
  return <img src={url} alt={alt} className={className} />;
}
