import { ListPlus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { LookupManager } from "@/components/lookup-manager";
import { requirePagePermission } from "@/lib/page-guard";
import { prisma } from "@/lib/prisma";

export default async function LookupsPage() {
  await requirePagePermission("lookupsManage");
  const values = await prisma.lookupValue.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] });
  return (
    <AppShell>
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary"><ListPlus className="h-4 w-4" />القوائم الديناميكية</div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">إدارة القيم المرجعية</h1>
        <p className="mt-1 text-sm text-muted-foreground">أضف القيم التي تظهر في قوائم النظام أو عطّلها بدون تعديل الكود.</p>
      </div>
      <LookupManager initialValues={values} />
    </AppShell>
  );
}
