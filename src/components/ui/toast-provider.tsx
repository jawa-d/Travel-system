"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";
type ToastInput = { title: string; description?: string; tone?: ToastTone };
type ToastItem = ToastInput & { id: string };

const ToastContext = createContext<{ toast: (input: ToastInput) => void } | null>(null);

const tones = {
  success: { icon: CheckCircle2, className: "border-emerald-200 bg-emerald-50 text-emerald-900" },
  error: { icon: CircleAlert, className: "border-red-200 bg-red-50 text-red-900" },
  info: { icon: Info, className: "border-blue-200 bg-blue-50 text-blue-900" }
} as const;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: string) => setItems((current) => current.filter((item) => item.id !== id)), []);
  const toast = useCallback((input: ToastInput) => {
    const id = crypto.randomUUID();
    setItems((current) => [...current.slice(-3), { ...input, id }]);
    window.setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);
  const value = useMemo(() => ({ toast }), [toast]);
  useEffect(() => {
    const listener = (event: Event) => toast((event as CustomEvent<ToastInput>).detail);
    window.addEventListener("trinsu-toast", listener);
    return () => window.removeEventListener("trinsu-toast", listener);
  }, [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 left-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-2" aria-live="polite">
        {items.map((item) => {
          const tone = tones[item.tone ?? "info"];
          const Icon = tone.icon;
          return (
            <div key={item.id} className={cn("flex items-start gap-3 rounded-xl border p-4 shadow-xl", tone.className)}>
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{item.title}</p>
                {item.description ? <p className="mt-1 text-xs leading-5 opacity-80">{item.description}</p> : null}
              </div>
              <button type="button" onClick={() => dismiss(item.id)} className="rounded-md p-1 opacity-60 hover:bg-black/5 hover:opacity-100" aria-label="إغلاق">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
