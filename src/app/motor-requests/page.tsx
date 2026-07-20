import Link from "next/link";
import { CalendarDays, CarFront, FileText, Plus } from "lucide-react";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { MotorRequestsList } from "@/components/motor-requests-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createMotorRequestService } from "@/lib/motor-requests";
import { requirePagePermission } from "@/lib/page-guard";
import { can } from "@/lib/rbac";

export default async function MotorRequestsPage() {
  const user = await requirePagePermission("motorRequestsRead");
  const requests = await createMotorRequestService().list(user);

  const submitted = requests.filter((request) => request.status === "SUBMITTED").length;
  const inProgress = requests.filter((request) => request.status === "UNDER_REVIEW" || request.status === "NEEDS_INFO").length;
  const decided = requests.filter((request) => request.status === "APPROVED" || request.status === "REJECTED").length;

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 text-sm font-semibold text-primary">Motor Insurance Requests</div>
          <h1 className="text-2xl font-black tracking-normal text-slate-950 dark:text-foreground sm:text-3xl">طلبات تأمين المركبات</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            متابعة طلبات تأمين المركبات المرسلة من الوكلاء قبل إصدار الوثائق.
          </p>
        </div>
        {user.role === Role.AGENT ? (
          <Button asChild>
            <Link href="/motor-requests/new">
              <Plus className="h-4 w-4" />
              طلب تأمين مركبة
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Metric title="إجمالي الطلبات" value={requests.length} icon={FileText} />
        <Metric title="المرسلة وقيد المراجعة" value={submitted + inProgress} icon={CarFront} />
        <Metric title="المحسومة" value={decided} icon={CalendarDays} />
      </div>

      <Card>
        <CardHeader className="border-b bg-muted/10">
          <CardTitle>سجل طلبات المركبات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {requests.length ? (
            <MotorRequestsList
              requests={requests}
              canDelete={can(user.role, "motorRequestsDelete")}
              canPayCommission={can(user.role, "motorCommissionsWrite")}
            />
          ) : (
            <div className="p-10 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-lg bg-primary/10 text-primary">
                <CarFront className="h-7 w-7" />
              </div>
              <p className="font-bold">لا توجد طلبات تأمين مركبات بعد.</p>
              {user.role === Role.AGENT ? (
                <Button asChild className="mt-4">
                  <Link href="/motor-requests/new">إنشاء أول طلب</Link>
                </Button>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: number; icon: typeof FileText }) {
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
