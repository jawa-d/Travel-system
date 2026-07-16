import { FileQuestion, Inbox, ListChecks, Timer } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ReportRequestsManager, type ReportRequestItem } from "@/components/report-requests-manager";
import { Card, CardContent } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/page-guard";
import { prisma } from "@/lib/prisma";

export default async function ReportRequestsPage() {
  await requirePagePermission("reportRequestsManage");
  const requests = await prisma.reportRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100
  });

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
