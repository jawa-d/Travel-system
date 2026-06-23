"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

const resources: Record<string, string> = {
  "/": "dashboard",
  "/customers": "customers",
  "/policies": "policies",
  "/claims": "claims",
  "/plans": "plans",
  "/countries": "countries",
  "/endorsements": "endorsements",
  "/cancellations": "cancellations",
  "/notifications": "notifications",
  "/audit": "audit",
  "/agency": "agency",
  "/agent-accounts": "agent-accounts",
  "/reports": "reports"
};

export function ExportActions({ locale }: { locale: "ar" | "en" }) {
  const pathname = usePathname();
  const resource = resources[pathname];
  if (!resource) return null;

  const label = locale === "ar" ? "تصدير" : "Export";

  return (
    <div className="flex items-center gap-1">
      <Button asChild variant="outline" size="sm" className="rounded-xl bg-white">
        <Link href={`/api/export?resource=${resource}&format=xlsx`}>
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          <span className="hidden xl:inline">{label}</span>
          <span className="hidden sm:inline">Excel</span>
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm" className="rounded-xl bg-white">
        <Link href={`/api/export?resource=${resource}&format=pdf`}>
          <FileDown className="h-4 w-4 text-red-600" />
          <span className="hidden xl:inline">{label}</span>
          <span className="hidden sm:inline">PDF</span>
        </Link>
      </Button>
    </div>
  );
}
