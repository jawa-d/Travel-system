"use client";

import { useEffect, useState } from "react";
import { ClipboardList, FileCheck2, FileClock, FilePenLine, Files, ShieldX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const cards = [
  { key: "total", label: "إجمالي الوثائق", icon: Files, tone: "from-cyan-500/15 to-cyan-50 text-cyan-700" },
  { key: "active", label: "الوثائق الفعالة", icon: FileCheck2, tone: "from-emerald-500/15 to-emerald-50 text-emerald-700" },
  { key: "expired", label: "الوثائق المنتهية", icon: FileClock, tone: "from-amber-500/15 to-amber-50 text-amber-700" },
  { key: "cancelled", label: "الوثائق الملغاة", icon: ShieldX, tone: "from-red-500/15 to-red-50 text-red-700" },
  { key: "claims", label: "المطالبات", icon: ClipboardList, tone: "from-blue-500/15 to-blue-50 text-blue-700" },
  { key: "endorsements", label: "الملاحق", icon: FilePenLine, tone: "from-violet-500/15 to-violet-50 text-violet-700" }
] as const;

export function PolicyDashboardStats({ values }: { values: Record<(typeof cards)[number]["key"], number> }) {
  return (
    <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {cards.map((card) => (
        <Metric key={card.key} label={card.label} value={values[card.key]} icon={card.icon} tone={card.tone} />
      ))}
    </div>
  );
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Files; tone: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const started = performance.now();
    const duration = 650;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - started) / duration, 1);
      setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <Card className="group overflow-hidden border-slate-200/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <CardContent className={`relative bg-gradient-to-br ${tone} p-5`}>
        <div className="absolute -left-5 -top-6 h-20 w-20 rounded-full bg-white/50 blur-2xl transition-transform group-hover:scale-150" />
        <div className="relative flex items-start justify-between gap-4">
          <div><p className="text-sm font-semibold opacity-75">{label}</p><p className="mt-3 text-4xl font-black tracking-tight">{shown.toLocaleString("ar-IQ")}</p></div>
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/70 shadow-sm"><Icon className="h-6 w-6" /></span>
        </div>
      </CardContent>
    </Card>
  );
}
