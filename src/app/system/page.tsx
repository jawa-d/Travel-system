import { Settings2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SystemManager } from "@/components/system-manager";
import { requirePagePermission } from "@/lib/page-guard";
import { prisma } from "@/lib/prisma";

export default async function SystemPage() {
  const currentUser = await requirePagePermission("systemManage");
  const users = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true, email: true, role: true, active: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <AppShell>
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary"><Settings2 className="h-4 w-4" />إدارة النظام</div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">المستخدمون والبيانات</h1>
        <p className="mt-1 text-sm text-muted-foreground">إدارة الصلاحيات والنسخ الاحتياطية وبيانات العرض المحلية.</p>
      </div>
      <SystemManager users={users.filter((user) => Boolean(user?.id && user.email))} currentUserId={currentUser.id} />
    </AppShell>
  );
}
