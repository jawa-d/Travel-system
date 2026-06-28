"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  FileClock,
  FileText,
  FileDown,
  FileSpreadsheet,
  Filter,
  MapPin,
  Pencil,
  Plane,
  Printer,
  Search,
  ShieldX,
  RotateCcw,
  Trash2,
  UserRound,
  X
} from "lucide-react";
import { EmailPolicyForm } from "@/components/email-policy-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocalCollection } from "@/lib/local-storage";
import { usePagination } from "@/lib/pagination";
import { PaginationControls } from "@/components/pagination-controls";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast-provider";

type PolicyStatus = "DRAFT" | "ACTIVE" | "EXPIRED" | "CANCELLED";

export type PolicyItem = {
  id: string;
  policyNumber: string;
  customerName: string;
  customerEmail: string | null;
  destinationName: string;
  planName: string;
  departureDate: string;
  returnDate: string;
  premium: string;
  coverageAmount: string;
  status: PolicyStatus;
  deletedAt: string | null;
  issuedByName: string | null;
  issuedByRole: string | null;
  issuedByAgency: string | null;
  issuedAt: string | null;
};

const statusDetails = {
  DRAFT: { label: "مسودة", className: "border-slate-200 bg-slate-100 text-slate-700", icon: FileClock },
  ACTIVE: { label: "فعالة", className: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  EXPIRED: { label: "منتهية", className: "border-amber-200 bg-amber-50 text-amber-700", icon: FileClock },
  CANCELLED: { label: "ملغاة", className: "border-red-200 bg-red-50 text-red-700", icon: ShieldX }
} as const;

export function PolicyManager({ policies, canManageStatus, canDelete }: { policies: PolicyItem[]; canManageStatus: boolean; canDelete: boolean }) {
  const router = useRouter();
  const [items, setItems] = useLocalCollection("policies", policies);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | PolicyStatus>("ALL");
  const [sort, setSort] = useState<"NEWEST" | "DEPARTURE" | "PREMIUM">("NEWEST");
  const [editing, setEditing] = useState<PolicyItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmCancellation, setConfirmCancellation] = useState(false);
  const [deleting, setDeleting] = useState<{ policy: PolicyItem; permanent: boolean } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("trinsu:policy-filters") ?? "{}") as { status?: typeof statusFilter; sort?: typeof sort };
      if (saved.status) setStatusFilter(saved.status);
      if (saved.sort) setSort(saved.sort);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("trinsu:policy-filters", JSON.stringify({ status: statusFilter, sort }));
  }, [statusFilter, sort]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((policy) => {
      const matchesStatus = statusFilter === "ALL" || policy.status === statusFilter;
      const matchesQuery = !normalized || [
        policy.policyNumber,
        policy.customerName,
        policy.destinationName,
        policy.planName
      ].some((value) => value.toLowerCase().includes(normalized));
      return matchesStatus && matchesQuery;
    }).sort((a, b) => {
      if (sort === "DEPARTURE") return new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime();
      if (sort === "PREMIUM") return Number(b.premium) - Number(a.premium);
      return b.id.localeCompare(a.id);
    });
  }, [items, query, statusFilter, sort]);
  const pagination = usePagination(filtered, 8);

  async function updateStatus(formData: FormData) {
    if (!editing) return;
    const nextStatus = String(formData.get("status")) as PolicyStatus;
    if (nextStatus === "CANCELLED") {
      setConfirmCancellation(true);
      return;
    }
    await saveStatus(nextStatus);
  }

  async function saveStatus(nextStatus: PolicyStatus) {
    if (!editing) return;
    setBusy(true);
    setError("");
    const response = await fetch(`/api/policies/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setError(result?.error ?? "تعذر تحديث حالة الوثيقة");
      setBusy(false);
      return;
    }
    setItems((current) => current.map((policy) =>
      policy.id === editing.id ? { ...policy, status: nextStatus } : policy
    ));
    setEditing(null);
    setConfirmCancellation(false);
    setBusy(false);
    toast({ title: "تم تحديث الوثيقة", description: `أصبحت حالة ${editing.policyNumber}: ${statusDetails[nextStatus].label}`, tone: "success" });
    router.refresh();
  }

  async function deletePolicy() {
    if (!deleting) return;
    setBusy(true);
    const response = await fetch(`/api/policies/${deleting.policy.id}${deleting.permanent ? "?permanent=true" : ""}`, { method: "DELETE" });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setError(result?.error ?? "تعذر حذف الوثيقة");
      setBusy(false);
      return;
    }
    setItems((current) => deleting.permanent
      ? current.filter((item) => item.id !== deleting.policy.id)
      : current.map((item) => item.id === deleting.policy.id ? { ...item, deletedAt: new Date().toISOString() } : item));
    toast({ title: deleting.permanent ? "تم حذف الوثيقة نهائيًا" : "تم نقل الوثيقة إلى المحذوفات", tone: "success" });
    setDeleting(null);
    setBusy(false);
    router.refresh();
  }

  async function restorePolicy(policy: PolicyItem) {
    setBusy(true);
    const response = await fetch(`/api/policies/${policy.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore" })
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setError(result?.error ?? "تعذر استعادة الوثيقة");
    } else {
      setItems((current) => current.map((item) => item.id === policy.id ? { ...item, deletedAt: null } : item));
      toast({ title: "تمت استعادة الوثيقة", tone: "success" });
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث برقم الوثيقة، العميل، الوجهة أو الخطة..."
            className="h-11 pr-10"
          />
        </div>
        <div className="relative sm:w-48">
          <Filter className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="h-11 w-full rounded-md border bg-background pr-10 pl-3 text-sm"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="ACTIVE">فعالة</option>
            <option value="DRAFT">مسودة</option>
            <option value="EXPIRED">منتهية</option>
            <option value="CANCELLED">ملغاة</option>
          </select>
        </div>
        <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="h-11 rounded-md border bg-background px-3 text-sm sm:w-44" aria-label="ترتيب الوثائق">
          <option value="NEWEST">الأحدث أولًا</option>
          <option value="DEPARTURE">تاريخ المغادرة</option>
          <option value="PREMIUM">الأعلى قسطًا</option>
        </select>
        <Button asChild variant="outline" size="sm"><Link href={`/api/export?resource=policies&format=xlsx&status=${statusFilter === "ALL" ? "" : statusFilter}&policyNumber=${encodeURIComponent(query)}`}><FileSpreadsheet className="h-4 w-4 text-emerald-600" />Excel</Link></Button>
        <Button asChild variant="outline" size="sm"><Link href={`/api/export?resource=policies&format=pdf&status=${statusFilter === "ALL" ? "" : statusFilter}&policyNumber=${encodeURIComponent(query)}`}><FileDown className="h-4 w-4 text-red-600" />PDF</Link></Button>
      </div>

      {error && !editing && (
        <div className="mb-4 flex justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}><X className="h-4 w-4" /></button>
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground"><FileText className="h-7 w-7" /></div>
            <h3 className="font-semibold">لا توجد وثائق مطابقة</h3>
            <p className="mt-1 text-sm text-muted-foreground">غيّر عبارة البحث أو مرشح الحالة.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pagination.visible.map((policy) => {
            const status = statusDetails[policy.status];
            const StatusIcon = status.icon;
            return (
              <Card key={policy.id} className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="p-0">
                  <div className="grid gap-5 p-5 lg:grid-cols-[minmax(220px,1.2fr)_minmax(180px,0.9fr)_minmax(230px,1fr)_auto] lg:items-center">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm font-black text-primary" dir="ltr">{policy.policyNumber}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="truncate font-semibold">{policy.customerName}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-medium">{policy.destinationName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Plane className="h-4 w-4" />
                        <span>{policy.planName}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        <span>{formatDate(new Date(policy.departureDate))} — {formatDate(new Date(policy.returnDate))}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={status.className}><StatusIcon className="ml-1 h-3 w-3" />{status.label}</Badge>
                        <span className="text-sm font-bold" dir="ltr">{formatCurrency(policy.premium)}</span>
                        <span className="text-xs text-muted-foreground">قسط التأمين</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Issued by <span className="font-semibold text-foreground">{policy.issuedByName ?? "System"}</span>
                        {policy.issuedByRole ? ` (${policy.issuedByRole})` : ""} - {policy.issuedAt ? formatDate(policy.issuedAt) : "-"}
                      </p>
                    </div>

                    {policy.deletedAt ? (
                      <Badge className="justify-self-start border-red-200 bg-red-50 text-red-700">محذوفة</Badge>
                    ) : canManageStatus ? (
                      <Button type="button" variant="outline" className="border-primary/20 text-primary" onClick={() => { setError(""); setEditing(policy); }}>
                        <Pencil className="h-4 w-4" />إدارة الحالة
                      </Button>
                    ) : (
                      <Badge className="justify-self-start border-primary/20 bg-primary/5 text-primary">وثيقتك</Badge>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 border-t bg-muted/20 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm">
                        <Link href={`/policies/${policy.id}`}><Eye className="h-4 w-4" />التفاصيل</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/api/policies/${policy.id}/pdf`}><Download className="h-4 w-4" />PDF</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link target="_blank" href={`/api/policies/${policy.id}/pdf`}><Printer className="h-4 w-4" />طباعة</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/verify/${policy.policyNumber}`}><Eye className="h-4 w-4" />تحقق</Link>
                      </Button>
                      {canDelete && !policy.deletedAt ? (
                        <Button type="button" size="sm" variant="outline" className="text-destructive" onClick={() => setDeleting({ policy, permanent: false })}>
                          <Trash2 className="h-4 w-4" />حذف
                        </Button>
                      ) : null}
                      {canDelete && policy.deletedAt ? (
                        <>
                          <Button type="button" size="sm" variant="outline" onClick={() => restorePolicy(policy)} disabled={busy}>
                            <RotateCcw className="h-4 w-4" />استعادة
                          </Button>
                          <Button type="button" size="sm" variant="destructive" onClick={() => setDeleting({ policy, permanent: true })}>
                            <Trash2 className="h-4 w-4" />حذف نهائي
                          </Button>
                        </>
                      ) : null}
                    </div>
                    <EmailPolicyForm policyId={policy.id} defaultEmail={policy.customerEmail} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <PaginationControls page={pagination.page} pages={pagination.pages} onChange={pagination.setPage} />

      {canManageStatus && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setEditing(null); }}>
          <Card className="w-full max-w-md shadow-2xl">
            <CardContent className="p-0">
              <div className="flex items-start justify-between border-b p-5">
                <div>
                  <h2 className="text-lg font-bold">إدارة حالة الوثيقة</h2>
                  <p className="mt-1 font-mono text-sm text-primary" dir="ltr">{editing.policyNumber}</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setEditing(null)} disabled={busy}><X className="h-5 w-5" /></Button>
              </div>
              <form action={updateStatus} className="space-y-5 p-5">
                <div className="space-y-2">
                  <Label htmlFor="policy-status">الحالة</Label>
                  <select id="policy-status" name="status" defaultValue={editing.status} className="h-11 w-full rounded-md border bg-background px-3">
                    <option value="DRAFT">مسودة</option>
                    <option value="ACTIVE">فعالة</option>
                    <option value="EXPIRED">منتهية</option>
                    <option value="CANCELLED">ملغاة</option>
                  </select>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  لا يتم حذف الوثائق الصادرة حفاظًا على سجل التدقيق. استخدم حالة «ملغاة» عند الحاجة.
                </div>
                {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                <div className="flex gap-2 border-t pt-5">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setEditing(null)} disabled={busy}>إلغاء</Button>
                  <Button type="submit" className="flex-[2]" disabled={busy}>{busy ? "جارٍ الحفظ..." : "حفظ الحالة"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
      <ConfirmDialog
        open={confirmCancellation}
        onOpenChange={setConfirmCancellation}
        title="إلغاء الوثيقة؟"
        description="ستبقى الوثيقة محفوظة لأغراض التدقيق، لكن لن تُعامل كوثيقة فعالة بعد التأكيد."
        confirmLabel="إلغاء الوثيقة"
        destructive
        busy={busy}
        onConfirm={() => saveStatus("CANCELLED")}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting?.permanent ? "حذف الوثيقة نهائيًا؟" : "حذف الوثيقة؟"}
        description={deleting?.permanent
          ? "سيتم حذف الوثيقة وجميع المطالبات والملاحق والإلغاء المرتبط بها نهائيًا، ولا يمكن التراجع."
          : "ستُنقل الوثيقة إلى المحذوفات ويمكن للمدير العام استعادتها لاحقًا."}
        confirmLabel={deleting?.permanent ? "حذف نهائي" : "حذف الوثيقة"}
        destructive
        busy={busy}
        onConfirm={deletePolicy}
      />
    </>
  );
}
