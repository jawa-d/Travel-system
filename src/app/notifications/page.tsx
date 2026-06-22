import { Bell, BellRing, CheckCheck, CircleAlert } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { NotificationCenter } from "@/components/notification-center";
import { Card, CardContent } from "@/components/ui/card";
import { getDemoNotifications } from "@/lib/demo-notification-store";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { requirePagePermission } from "@/lib/page-guard";
import { prisma } from "@/lib/prisma";

export default async function NotificationsPage() {
  await requirePagePermission("notificationsRead");
  const notifications = isDirectAccessEnabled()
    ? getDemoNotifications()
    : await prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  const unread = notifications.filter((item) => item.status !== "READ").length;
  const expiry = notifications.filter((item) => item.type === "EXPIRY").length;
  const failed = notifications.filter((item) => item.status === "FAILED").length;

  return (
    <AppShell>
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
          <BellRing className="h-4 w-4" />متابعة تنبيهات النظام
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">الإشعارات</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          إشعارات النظام والبريد وتنبيهات انتهاء وثائق التأمين.
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat icon={Bell} label="غير المقروءة" value={unread} className="bg-blue-50 text-blue-600" />
        <Stat icon={CheckCheck} label="إجمالي الإشعارات" value={notifications.length} className="bg-emerald-50 text-emerald-600" />
        <Stat icon={CircleAlert} label="تنبيهات الانتهاء" value={expiry} className={failed ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"} />
      </div>

      <NotificationCenter
        notifications={notifications.map((item) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          message: item.message,
          status: item.status,
          dueAt: item.dueAt?.toISOString() ?? null,
          createdAt: item.createdAt.toISOString()
        }))}
      />
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, className }: {
  icon: typeof Bell;
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
