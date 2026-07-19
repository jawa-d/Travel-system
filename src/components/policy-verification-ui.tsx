import type { ReactNode } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type VerificationBrandHeaderProps = {
  description?: string;
  status?: ReactNode;
  align?: "center" | "split";
};

export function VerificationCard({ children, maxWidth = "max-w-2xl" }: { children: ReactNode; maxWidth?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F1ECE2] p-4" dir="rtl">
      <Card className={`w-full ${maxWidth} overflow-hidden border-white/80 bg-white shadow-xl shadow-slate-900/10`}>
        <div className="h-2 bg-gradient-to-l from-[#293545] via-[#AE8F50] to-cyan-700" />
        {children}
      </Card>
    </main>
  );
}

export function VerificationBrandHeader({ description, status, align = "center" }: VerificationBrandHeaderProps) {
  const brand = (
    <div className={align === "center" ? "text-center" : "flex items-center gap-4"}>
      <span className={`${align === "center" ? "mx-auto" : ""} grid h-16 w-16 shrink-0 place-items-center rounded-xl border bg-white p-2 shadow-sm`}>
        <Image src="/iraq-takaful-logo.svg" alt="Iraq Takaful Insurance Company" width={52} height={52} className="h-full w-full object-contain" />
      </span>
      <div>
        {align === "split" ? <p className="text-xs font-bold uppercase tracking-normal text-[#AE8F50]">Iraq Takaful Verification</p> : null}
        <h1 className={`${align === "center" ? "mt-3" : "mt-1"} text-2xl font-black text-[#293545]`}>التحقق من وثيقة التأمين</h1>
        <p className="mt-1 text-sm text-slate-500">{description ?? "Iraq Takaful Insurance Company"}</p>
      </div>
    </div>
  );

  if (align === "center") {
    return (
      <CardHeader className="text-center">
        {brand}
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </CardHeader>
    );
  }

  return (
    <div className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
      {brand}
      {status}
    </div>
  );
}

export function VerificationContent({ children, className = "space-y-6" }: { children: ReactNode; className?: string }) {
  return <CardContent className={className}>{children}</CardContent>;
}

export function VerificationResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-emerald-200/70 pb-2 text-sm">
      <span className="text-emerald-900/70">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

export function VerificationDetailItem({
  label,
  value,
  dir,
  strong = false
}: {
  label: string;
  value: string;
  dir?: "ltr" | "rtl";
  strong?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-slate-50 p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className={`mt-1.5 break-words text-sm ${strong ? "font-black text-[#293545]" : "font-bold text-slate-800"}`} dir={dir}>{value}</p>
    </div>
  );
}
