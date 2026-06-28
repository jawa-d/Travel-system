import { BarChart3, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { workflowStatusColors, workflowStatusLabelsAr } from "@/lib/policy-status-display";

export function DashboardInsights({
  destinations,
  statuses
}: {
  destinations: Array<{ name: string; count: number }>;
  statuses: Array<{ status: string; count: number }>;
}) {
  const max = Math.max(1, ...destinations.map((item) => item.count));

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />أكثر الوجهات إصداراً</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {destinations.map((item) => (
            <div key={item.name}>
              <div className="mb-1 flex justify-between text-sm"><span>{item.name}</span><strong>{item.count}</strong></div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-l from-primary to-cyan-500" style={{ width: `${item.count / max * 100}%` }} /></div>
            </div>
          ))}
          {!destinations.length ? <p className="py-10 text-center text-sm text-muted-foreground">تظهر البيانات بعد إصدار الوثائق.</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><PieChart className="h-5 w-5 text-primary" />توزيع الحالات</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {statuses.map((item) => (
            <div key={item.status} className="flex items-center justify-between rounded-xl border p-3">
              <span className="flex items-center gap-2 text-sm">
                <span className={`h-2.5 w-2.5 rounded-full ${workflowStatusColors[item.status] ?? "bg-primary"}`} />
                {workflowStatusLabelsAr[item.status] ?? item.status}
              </span>
              <strong>{item.count}</strong>
            </div>
          ))}
          {!statuses.length ? <p className="col-span-2 py-10 text-center text-sm text-muted-foreground">لا توجد بيانات كافية بعد.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
