import { Settings2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SystemManager } from "@/components/system-manager";
import { requirePagePermission } from "@/lib/page-guard";

export default async function SystemPage() {
  await requirePagePermission("systemManage");

  return (
    <AppShell>
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary"><Settings2 className="h-4 w-4" />إدارة النظام</div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">المستخدمون والبيانات</h1>
        <p className="mt-1 text-sm text-muted-foreground">إدارة الصلاحيات والنسخ الاحتياطية وبيانات العرض المحلية.</p>
      </div>
      <SystemManager />
    </AppShell>
  );
}
