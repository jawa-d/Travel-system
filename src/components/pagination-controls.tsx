"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PaginationControls({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-5 flex items-center justify-center gap-3">
      <Button type="button" variant="outline" size="icon" disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronRight className="h-4 w-4" /></Button>
      <span className="text-sm text-muted-foreground">صفحة {page} من {pages}</span>
      <Button type="button" variant="outline" size="icon" disabled={page >= pages} onClick={() => onChange(page + 1)}><ChevronLeft className="h-4 w-4" /></Button>
    </div>
  );
}
