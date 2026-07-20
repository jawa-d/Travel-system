import { Activity, ClipboardList, FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { InsuranceRequestsList } from "@/components/insurance-requests-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InsuranceModuleView } from "@/lib/insurance-request-ui";

export function InsuranceRequestsPageShell({ module }: { module: InsuranceModuleView }) {
  const active = module.requests.filter((request) => !["completed", "rejected"].includes(request.status)).length;
  const documents = module.requests.filter((request) => request.documents.some((document) => document.status !== "received")).length;
  const completed = module.requests.filter((request) => request.status === "completed").length;

  return (
    <AppShell>
      <div className="mb-6">
        <div className="mb-2 text-sm font-semibold text-primary">TRINSU Portal Intake</div>
        <h1 className="text-2xl font-black tracking-normal text-slate-950 dark:text-foreground sm:text-3xl">{module.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{module.subtitle}</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Metric title="طلبات نشطة" value={active} icon={ClipboardList} />
        <Metric title="مستندات للمراجعة" value={documents} icon={FileText} />
        <Metric title="مكتملة" value={completed} icon={Activity} />
      </div>

      <Card>
        <CardHeader className="border-b bg-muted/10">
          <CardTitle>سجل {module.productLabel}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <InsuranceRequestsList module={module} requests={module.requests} />
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


