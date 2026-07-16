import Link from "next/link";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { FileQuestion, Inbox, ListChecks, Timer } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BankReportRequestsList, type BankReportRequestItem } from "@/components/bank-report-requests-list";
import { ReportRequestsManager, type ReportRequestItem } from "@/components/report-requests-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/page-guard";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";

export default async function ReportRequestsPage() {
  const user = await requirePagePermission("dashboard");
  const isManager = can(user.role, "reportRequestsManage");
  const canReadOwnRequests = can(user.role, "reportRequestsRead");
  if (!isManager && !canReadOwnRequests) redirect("/access-denied?permission=reportRequestsRead&from=report-requests");
  const requests = await prisma.reportRequest.findMany({
    where: user.role === Role.BANK ? { requesterId: user.id } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100
  });

  if (!isManager) {
    const bankItems: BankReportRequestItem[] = requests.map((item) => ({
      id: item.id,
      requestNumber: item.requestNumber,
      title: item.title,
      status: item.status,
      reportFileUrl: item.reportFileUrl,
      reportFileName: item.reportFileName,
      reportFileUploadedAt: item.reportFileUploadedAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString()
    }));

    return (
      <AppShell>
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary"><FileQuestion className="h-4 w-4" />طلبات التقارير</div>
            <h1 className="text-2xl font-black tracking-normal text-slate-950 dark:text-foreground sm:text-3xl">طلباتي وحالة التقارير</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              تابع طلبات التقارير المرسلة من حساب المصرف، واعرف حالة كل طلب، وحمّل ملف التقرير عند رفعه من المدير العام.
            </p>
          </div>
          <Button asChild><Link href="/report-requests/new">طلب تقرير جديد</Link></Button>
        </div>
        <BankReportRequestsList requests={bankItems} />
      </AppShell>
    );
  }

  const stats = {
    total: requests.length,
    pending: requests.filter((item) => item.status === "PENDING").length,
    inReview: requests.filter((item) => item.status === "IN_REVIEW").length,
    completed: requests.filter((item) => item.status === "COMPLETED").length
  };

  const items: ReportRequestItem[] = requests.map((item) => ({
    id: item.id,
    requestNumber: item.requestNumber,
    title: item.title,
    details: item.details,
    status: item.status,
    requesterName: item.requesterName,
    requesterEmail: item.requesterEmail,
    requesterBank: item.requesterBank,
    managerNotes: item.managerNotes,
    reportFileUrl: item.reportFileUrl,
    reportFileName: item.reportFileName,
    reportFileSize: item.reportFileSize,
    reportFileUploadedAt: item.reportFileUploadedAt?.toISOString() ?? null,
    isLocked: item.isLocked,
    lockedAt: item.lockedAt?.toISOString() ?? null,
    lockedByName: item.lockedByName,
    reviewedByName: item.reviewedByName,
    reviewedAt: item.reviewedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString()
  }));

  return (
    <AppShell>
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary"><FileQuestion className="h-4 w-4" />إدارة طلبات التقارير</div>
        <h1 className="text-2xl font-black tracking-normal text-slate-950 dark:text-foreground sm:text-3xl">طلبات التقارير من المصارف</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          مراجعة طلبات التقارير الواردة، معرفة المصرف والبريد الإلكتروني لمقدم الطلب، وتحديث حالة التنفيذ بملاحظات واضحة.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Metric title="إجمالي الطلبات" value={stats.total} icon={Inbox} />
        <Metric title="بانتظار المراجعة" value={stats.pending} icon={Timer} />
        <Metric title="قيد المراجعة" value={stats.inReview} icon={FileQuestion} />
        <Metric title="مكتملة" value={stats.completed} icon={ListChecks} />
      </div>

      <ReportRequestsManager requests={items} />
    </AppShell>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: string | number; icon: typeof FileQuestion }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-black">{value}</p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </CardContent>
    </Card>
  );
}
