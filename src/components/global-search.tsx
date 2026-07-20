"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CarFront, FileQuestion, Loader2, Search, Ship, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Result = { id: string; title: string; subtitle: string; href: string; type: "motorRequest" | "referral" | "reportRequest" };

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
        setResults(response.ok ? await response.json() : []);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  return (
    <>
      <Button type="button" variant="ghost" size="icon" className="rounded-xl" onClick={() => setOpen(true)} aria-label="بحث شامل"><Search className="h-5 w-5" /></Button>
      {open ? (
        <div role="dialog" aria-modal="true" aria-label="البحث الشامل" className="fixed inset-0 z-[70] bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
          <div className="mx-auto mt-[10vh] max-w-2xl overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl">
            <div className="flex items-center gap-2 border-b p-3">
              {loading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Search className="h-5 w-5 text-muted-foreground" />}
              <Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن إحالة، طلب تقرير، أو طلب مركبة..." className="border-0 shadow-none focus-visible:ring-0" />
              <kbd className="hidden rounded border bg-muted px-2 py-1 text-[10px] text-muted-foreground sm:block">Ctrl K</kbd>
              <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="إغلاق"><X className="h-5 w-5" /></Button>
            </div>
            <div className="max-h-[55vh] overflow-y-auto p-2">
              {results.map((result) => (
                <Link key={`${result.type}-${result.id}`} href={result.href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl p-3 hover:bg-muted">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    {result.type === "motorRequest" ? <CarFront className="h-4 w-4" /> : result.type === "referral" ? <Ship className="h-4 w-4" /> : <FileQuestion className="h-4 w-4" />}
                  </span>
                  <span><strong className="block text-sm">{result.title}</strong><span className="text-xs text-muted-foreground">{result.subtitle}</span></span>
                </Link>
              ))}
              {query.length >= 2 && !loading && !results.length ? <p className="p-8 text-center text-sm text-muted-foreground">لا توجد نتائج مطابقة.</p> : null}
              {query.length < 2 ? <p className="p-8 text-center text-sm text-muted-foreground">اكتب حرفين على الأقل للبحث.</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
