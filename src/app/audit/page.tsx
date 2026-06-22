import { Activity, CircleAlert, ShieldCheck, ShieldX } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AuditLogViewer } from "@/components/audit-log-viewer";
import { Card, CardContent } from "@/components/ui/card";
import { getDemoAuditLogs } from "@/lib/demo-audit-store";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { requirePagePermission } from "@/lib/page-guard";
import { prisma } from "@/lib/prisma";

export default async function AuditPage() {
  await requirePagePermission("auditRead");
  const logs = isDirectAccessEnabled()
    ? getDemoAuditLogs()
    : await prisma.auditLog.findMany({
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 200
      });

  const sensitive = logs.filter((log) =>
    log.action.includes("CANCELLED") || log.action.includes("REJECTED") || log.action.includes("DELETE")
  ).length;
  const users = new Set(logs.map((log) => log.user?.name).filter(Boolean)).size;
  const today = logs.filter((log) => log.createdAt.toDateString() === new Date().toDateString()).length;

  return (
    <AppShell>
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
          <ShieldCheck className="h-4 w-4" />الرقابة والأمان
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">سجل التدقيق</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          تتبع العمليات والمستخدم والأدوار والتوقيت وعنوان IP وتفاصيل التغييرات.
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat icon={Activity} label="عمليات اليوم" value={today} className="bg-blue-50 text-blue-600" />
        <Stat icon={CircleAlert} label="عمليات حساسة" value={sensitive} className="bg-red-50 text-red-600" />
        <Stat icon={ShieldX} label="المستخدمون النشطون" value={users} className="bg-emerald-50 text-emerald-600" />
      </div>

      <AuditLogViewer
        logs={logs.map((log) => ({
          id: log.id,
          userName: log.user?.name ?? "النظام",
          role: log.role,
          action: log.action,
          entity: log.entity,
          entityId: log.entityId,
          ipAddress: log.ipAddress,
          metadata: log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)
            ? log.metadata as Record<string, unknown>
            : null,
          createdAt: log.createdAt.toISOString()
        }))}
      />
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, className }: {
  icon: typeof Activity;
  label: string;
  value: number;
  className: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${className}`}><Icon className="h-5 w-5" /></div>
        <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-black">{value}</p></div>
      </CardContent>
    </Card>
  );
}
