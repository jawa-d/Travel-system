"use client";

import { useMemo, useState } from "react";
import {
  Activity, CircleAlert, Eye, FilePlus2, FileText, LogIn,
  Monitor, Printer, Search, ShieldX, UserRound, X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { useLocalCollection } from "@/lib/local-storage";
import { usePagination } from "@/lib/pagination";
import { PaginationControls } from "@/components/pagination-controls";

export type AuditItem = {
  id: string;
  userName: string;
  role: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  ipAddress: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

const actionDetails: Record<string, {
  label: string;
  severity: "normal" | "warning" | "critical";
  icon: typeof Activity;
}> = {
  USER_LOGIN: { label: "تسجيل دخول", severity: "normal", icon: LogIn },
  POLICY_CREATED: { label: "إصدار وثيقة", severity: "normal", icon: FilePlus2 },
  POLICY_UPDATED: { label: "تحديث وثيقة", severity: "normal", icon: FileText },
  POLICY_PRINTED: { label: "طباعة وثيقة", severity: "normal", icon: Printer },
  POLICY_CANCELLED: { label: "إلغاء وثيقة", severity: "critical", icon: ShieldX },
  POLICY_DELETED: { label: "حذف وثيقة", severity: "critical", icon: ShieldX },
  POLICY_RESTORED: { label: "استعادة وثيقة", severity: "warning", icon: FileText },
  POLICY_PERMANENTLY_DELETED: { label: "حذف وثيقة نهائيًا", severity: "critical", icon: ShieldX },
  CLAIM_CREATED: { label: "إنشاء مطالبة", severity: "warning", icon: CircleAlert },
  CLAIM_UPDATED: { label: "تحديث مطالبة", severity: "warning", icon: CircleAlert },
  ENDORSEMENT_CREATED: { label: "إنشاء ملحق", severity: "warning", icon: FileText },
  CANCELLATION_CREATED: { label: "إنشاء إلغاء", severity: "critical", icon: ShieldX },
  EXPORT_ACTION: { label: "تصدير بيانات", severity: "normal", icon: Printer }
};

const entityLabels: Record<string, string> = {
  User: "مستخدم",
  Policy: "وثيقة",
  Claim: "مطالبة",
  Endorsement: "ملحق",
  Cancellation: "إلغاء",
  Customer: "عميل",
  TravelPlan: "خطة سفر",
  Country: "دولة"
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "مدير عام",
  ADMIN: "مدير",
  UNDERWRITER: "مكتتب",
  FINANCE: "المالية",
  AGENT: "وكيل",
  VIEWER: "مشاهد"
};

const severityClasses = {
  normal: "border-blue-200 bg-blue-50 text-blue-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700"
};

export function AuditLogViewer({ logs }: { logs: AuditItem[] }) {
  const [items] = useLocalCollection("audit", logs);
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("ALL");
  const [entity, setEntity] = useState("ALL");
  const [selected, setSelected] = useState<AuditItem | null>(null);

  const actions = [...new Set(items.map((item) => item.action))];
  const entities = [...new Set(items.map((item) => item.entity))];
  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return items.filter((item) =>
      (action === "ALL" || item.action === action) &&
      (entity === "ALL" || item.entity === entity) &&
      (!text || [item.userName, item.action, item.entity, item.entityId ?? "", item.ipAddress ?? ""]
        .some((value) => value.toLowerCase().includes(text)))
    );
  }, [items, query, action, entity]);
  const pagination = usePagination(filtered, 12);

  return (
    <>
      <div className="mb-5 grid gap-3 rounded-xl border bg-card p-3 shadow-sm lg:grid-cols-[1fr_190px_170px]">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بالمستخدم، الإجراء، المعرّف أو IP..." className="h-11 pr-10" />
        </div>
        <select value={action} onChange={(event) => setAction(event.target.value)} className="h-11 rounded-md border bg-background px-3 text-sm">
          <option value="ALL">جميع الإجراءات</option>
          {actions.map((value) => <option key={value} value={value}>{actionDetails[value]?.label ?? value}</option>)}
        </select>
        <select value={entity} onChange={(event) => setEntity(event.target.value)} className="h-11 rounded-md border bg-background px-3 text-sm">
          <option value="ALL">جميع الكيانات</option>
          {entities.map((value) => <option key={value} value={value}>{entityLabels[value] ?? value}</option>)}
        </select>
      </div>

      {filtered.length ? (
        <Card className="overflow-hidden shadow-sm">
          <CardContent className="divide-y p-0">
            {pagination.visible.map((item) => {
              const detail = actionDetails[item.action] ?? { label: item.action, severity: "normal" as const, icon: Activity };
              const Icon = detail.icon;
              return (
                <article key={item.id} className="grid gap-4 p-5 transition-colors hover:bg-muted/25 lg:grid-cols-[minmax(200px,1fr)_minmax(180px,0.8fr)_minmax(180px,0.8fr)_auto] lg:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${severityClasses[detail.severity]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold">{detail.label}</p>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">{entityLabels[item.entity] ?? item.entity} {item.entityId ? `— ${item.entityId}` : ""}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-primary" />
                    <div><p className="text-sm font-semibold">{item.userName}</p><p className="text-xs text-muted-foreground">{item.role ? roleLabels[item.role] ?? item.role : "النظام"}</p></div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground"><Monitor className="h-3.5 w-3.5" /><span dir="ltr">{item.ipAddress ?? "—"}</span></div>
                    <p className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={severityClasses[detail.severity]}>{detail.severity === "critical" ? "حساس" : detail.severity === "warning" ? "مهم" : "اعتيادي"}</Badge>
                    <Button type="button" size="sm" variant="outline" onClick={() => setSelected(item)}><Eye className="h-4 w-4" />التفاصيل</Button>
                  </div>
                </article>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed"><CardContent className="flex min-h-64 flex-col items-center justify-center text-center"><Activity className="mb-4 h-9 w-9 text-muted-foreground" /><h3 className="font-semibold">لا توجد عمليات مطابقة</h3></CardContent></Card>
      )}
      <PaginationControls page={pagination.page} pages={pagination.pages} onChange={pagination.setPage} />

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader className="flex-row items-start justify-between space-y-0 border-b">
              <div><CardTitle>تفاصيل عملية التدقيق</CardTitle><p className="mt-1 text-sm text-muted-foreground">{actionDetails[selected.action]?.label ?? selected.action}</p></div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setSelected(null)}><X className="h-5 w-5" /></Button>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              <Detail label="المستخدم" value={selected.userName} />
              <Detail label="الدور" value={selected.role ? roleLabels[selected.role] ?? selected.role : "النظام"} />
              <Detail label="الكيان" value={entityLabels[selected.entity] ?? selected.entity} />
              <Detail label="معرّف السجل" value={selected.entityId ?? "—"} dir="ltr" />
              <Detail label="عنوان IP" value={selected.ipAddress ?? "—"} dir="ltr" />
              <Detail label="التاريخ" value={formatDate(selected.createdAt)} />
              <div className="rounded-xl border bg-slate-950 p-4 text-xs text-slate-100">
                <p className="mb-2 text-slate-400">بيانات العملية</p>
                <pre className="overflow-x-auto whitespace-pre-wrap text-left" dir="ltr">{JSON.stringify(selected.metadata ?? {}, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function Detail({ label, value, dir }: { label: string; value: string; dir?: "ltr" | "rtl" }) {
  return <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/25 px-4 py-3"><span className="text-sm text-muted-foreground">{label}</span><strong className="text-sm" dir={dir}>{value}</strong></div>;
}
