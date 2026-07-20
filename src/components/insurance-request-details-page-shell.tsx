import Link from "next/link";
import { ArrowRight, CalendarDays, ClipboardList } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { InsuranceRequestWorkspace } from "@/components/insurance-request-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InsuranceModuleView, InsuranceRequestView } from "@/lib/insurance-request-ui";
import { formatDate } from "@/lib/utils";

export function InsuranceRequestDetailsPageShell({
  module,
  request
}: {
  module: InsuranceModuleView;
  request: InsuranceRequestView;
}) {
  const Icon = module.icon;
  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -mr-3">
            <Link href={`/${module.route}`}><ArrowRight className="h-4 w-4" />الرجوع للطلبات</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <h1 className="font-mono text-2xl font-black text-primary sm:text-3xl" dir="ltr">{request.requestNumber}</h1>
            <Badge className="border border-slate-200 bg-white text-slate-700 hover:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">{module.productLabel}</Badge>
            <Badge className={module.statusClasses[request.status]}>{module.statusLabels[request.status]}</Badge>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            تفاصيل طلب مستلم من بوابة TRINSU. هذه الصفحة تعرض بيانات البوابة ولا تحتوي على استمارة تقديم.
          </p>
        </div>
        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:text-left">
          <span className="inline-flex items-center gap-2"><ClipboardList className="h-4 w-4" />{request.portalSource}</span>
          <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDate(request.submittedAt)}</span>
        </div>
      </div>

      <InsuranceRequestWorkspace module={module} request={request} />
    </AppShell>
  );
}

