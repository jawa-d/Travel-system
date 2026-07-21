import { Building2, CheckCircle2, ClipboardList, Clock3 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EngineeringRequestsList } from "@/components/engineering-requests-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/page-guard";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";

export default async function EngineeringRequestsPage() {
  const user = await requirePagePermission("engineeringRequestsRead");
  const requests = await prisma.engineeringInsuranceRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      requestNumber: true,
      status: true,
      customerFullName: true,
      customerMobile: true,
      projectName: true,
      projectType: true,
      projectLocation: true,
      contractValue: true,
      currency: true,
      insuranceType: true,
      source: true,
      createdDate: true,
      createdTime: true
    }
  });

  const inProgress = requests.filter((request) => request.status === "UNDER_REVIEW" || request.status === "NEEDS_INFO").length;
  const decided = requests.filter((request) => request.status === "APPROVED" || request.status === "REJECTED").length;
  const listRequests = requests.map((request) => ({
    ...request,
    contractValue: String(request.contractValue),
    createdDate: request.createdDate.toISOString()
  }));

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 text-sm font-semibold text-primary">Engineering Insurance Requests</div>
          <h1 className="text-2xl font-black tracking-normal text-slate-950 dark:text-foreground sm:text-3xl">طلبات التأمين الهندسي</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            متابعة طلبات التأمين الهندسي المرسلة من النماذج الخارجية أو من داخل النظام.
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Metric title="إجمالي الطلبات" value={requests.length} icon={ClipboardList} />
        <Metric title="قيد المراجعة" value={inProgress} icon={Clock3} />
        <Metric title="المحسومة" value={decided} icon={CheckCircle2} />
      </div>

      <Card>
        <CardHeader className="border-b bg-muted/10">
          <CardTitle>سجل طلبات التأمين الهندسي</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {requests.length ? (
            <EngineeringRequestsList
              requests={listRequests}
              canManage={can(user.role, "engineeringRequestsManage")}
              canDelete={can(user.role, "engineeringRequestsDelete")}
            />
          ) : (
            <div className="p-10 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-7 w-7" />
              </div>
              <p className="font-bold">لا توجد طلبات تأمين هندسي بعد.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: number; icon: typeof ClipboardList }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-black">{value}</p>
        </div>
        <span className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </span>
      </CardContent>
    </Card>
  );
}
