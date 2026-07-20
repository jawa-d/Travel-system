import Link from "next/link";
import { ArrowUpRight, Clock3, FileText, Inbox, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { InsuranceModuleView, InsuranceRequestView } from "@/lib/insurance-request-ui";
import { formatDate } from "@/lib/utils";

export function InsuranceRequestsList({
  module,
  requests
}: {
  module: InsuranceModuleView;
  requests: InsuranceRequestView[];
}) {
  const Icon = module.icon;
  if (!requests.length) {
    return (
      <div className="p-4">
        <EmptyState
          icon={Inbox}
          title="لا توجد طلبات"
          description={`لم يتم استلام أي طلبات ${module.productLabel} من البوابة حتى الآن.`}
        />
      </div>
    );
  }

  return (
    <div className="divide-y">
      {requests.map((request) => (
        <div key={request.id} className="grid gap-3 p-4 transition-colors hover:bg-muted/30 lg:grid-cols-[auto_1.1fr_1fr_1fr_auto]">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-mono text-sm font-black text-primary" dir="ltr">{request.requestNumber}</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-bold">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              {request.customer.fullName}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">نوع الطلب</p>
            <p className="mt-1 text-sm font-bold">{module.productLabel}</p>
            <p className="mt-1 text-xs text-muted-foreground">{request.portalSource}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">المسؤول والتاريخ</p>
            <p className="mt-1 text-sm font-bold">{request.assignedTo}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" />
              {formatDate(request.submittedAt)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Badge className={module.statusClasses[request.status]}>{module.statusLabels[request.status]}</Badge>
            {request.priority !== "normal" ? (
              <Badge className={request.priority === "urgent" ? "bg-red-100 text-red-700 hover:bg-red-100" : "bg-amber-100 text-amber-700 hover:bg-amber-100"}>
                {request.priority === "urgent" ? "عاجل" : "مهم"}
              </Badge>
            ) : null}
            <Button asChild size="sm" variant="outline">
              <Link href={`/${module.route}/${request.id}`}>
                <FileText className="h-4 w-4" />
                عرض
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}


