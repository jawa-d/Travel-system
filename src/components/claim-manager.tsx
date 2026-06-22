"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, CircleX, Clock3, FileSearch, FileText, LoaderCircle,
  Paperclip, Pencil, PlusCircle, Search, ShieldAlert, Stethoscope, X
  ,FileDown, FileSpreadsheet
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import { useLocalCollection } from "@/lib/local-storage";
import { AttachmentUpload } from "@/components/attachment-upload";
import { usePagination } from "@/lib/pagination";
import { PaginationControls } from "@/components/pagination-controls";
import { StoredAttachmentLink } from "@/components/stored-attachment-link";
import { LookupSelect } from "@/components/lookup-select";

type ClaimStatus = "NEW" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "CLOSED";
type ClaimType = string;

export type ClaimItem = {
  id: string;
  claimNumber: string;
  policyNumber: string;
  customerName: string;
  claimType: ClaimType;
  description: string;
  attachments: string[];
  status: ClaimStatus;
  createdAt: string;
};

const statusDetails = {
  NEW: { label: "جديدة", className: "border-blue-200 bg-blue-50 text-blue-700", icon: PlusCircle },
  UNDER_REVIEW: { label: "قيد المراجعة", className: "border-amber-200 bg-amber-50 text-amber-700", icon: Clock3 },
  APPROVED: { label: "مقبولة", className: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  REJECTED: { label: "مرفوضة", className: "border-red-200 bg-red-50 text-red-700", icon: CircleX },
  CLOSED: { label: "مغلقة", className: "border-slate-200 bg-slate-100 text-slate-700", icon: FileText }
} as const;

const typeLabels: Record<string, string> = {
  MEDICAL: "طبية",
  BAGGAGE: "أمتعة",
  TRIP_DELAY: "تأخير رحلة",
  CANCELLATION: "إلغاء رحلة",
  OTHER: "أخرى"
};

export function ClaimManager({
  claims,
  policies,
  canManage,
  claimTypes,
  agents
}: {
  claims: ClaimItem[];
  policies: { policyNumber: string; customerName: string }[];
  canManage: boolean;
  claimTypes: { value: string; label: string }[];
  agents: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [items, setItems] = useLocalCollection("claims", claims);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ClaimStatus>("ALL");
  const [editing, setEditing] = useState<ClaimItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [attachments, setAttachments] = useState<Array<{ id: string; name: string; type: string; size: number }>>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [agent, setAgent] = useState("");

  const filtered = useMemo(() => items.filter((claim) => {
    const text = query.trim().toLowerCase();
    return (statusFilter === "ALL" || claim.status === statusFilter) &&
      (!text || [claim.claimNumber, claim.policyNumber, claim.customerName].some((value) => value.toLowerCase().includes(text)));
  }), [items, query, statusFilter]);
  const pagination = usePagination(filtered, 8);

  async function createClaim(formData: FormData) {
    setBusy(true);
    setError("");
    const body = Object.fromEntries(formData.entries()) as Record<string, unknown>;
    body.attachments = attachments.map((item) => item.id);
    const response = await fetch("/api/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(result.error ?? "تعذر إنشاء المطالبة");
      return;
    }
    setItems((current) => [{
      id: result.id,
      claimNumber: result.claimNumber,
      policyNumber: result.policy.policyNumber,
      customerName: result.customer.arabicName,
      claimType: result.claimType,
      description: result.description,
      attachments: result.attachments,
      status: result.status,
      createdAt: new Date(result.createdAt).toISOString()
    }, ...current]);
    setAttachments([]);
    router.refresh();
  }

  async function updateStatus(formData: FormData) {
    if (!editing) return;
    setBusy(true);
    setError("");
    const response = await fetch(`/api/claims/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: formData.get("status") })
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(result.error ?? "تعذر تحديث المطالبة");
      return;
    }
    setItems((current) => current.map((claim) =>
      claim.id === editing.id ? { ...claim, status: result.status } : claim
    ));
    setEditing(null);
    router.refresh();
  }

  return (
    <>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <div className="mb-4 flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث برقم المطالبة، الوثيقة أو العميل..." className="h-11 pr-10" />
            </div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="h-11 rounded-md border bg-background px-3 text-sm sm:w-44">
              <option value="ALL">جميع الحالات</option>
              {Object.entries(statusDetails).map(([value, detail]) => <option key={value} value={value}>{detail.label}</option>)}
            </select>
            <Button asChild variant="outline" size="sm"><Link href={`/api/export?resource=claims&format=xlsx&status=${statusFilter === "ALL" ? "" : statusFilter}&policyNumber=${encodeURIComponent(query)}&from=${from}&to=${to}&agent=${agent}`}><FileSpreadsheet className="h-4 w-4 text-emerald-600" />Excel</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href={`/api/export?resource=claims&format=pdf&status=${statusFilter === "ALL" ? "" : statusFilter}&policyNumber=${encodeURIComponent(query)}&from=${from}&to=${to}&agent=${agent}`}><FileDown className="h-4 w-4 text-red-600" />PDF</Link></Button>
          </div>
          <div className="mb-4 grid gap-2 rounded-xl border bg-card p-3 sm:grid-cols-3">
            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="من تاريخ" />
            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="إلى تاريخ" />
            <select value={agent} onChange={(event) => setAgent(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="">جميع الوكلاء</option>
              {agents.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>

          {filtered.length ? (
            <div className="space-y-4">
              {pagination.visible.map((claim) => {
                const status = statusDetails[claim.status];
                const StatusIcon = status.icon;
                return (
                  <Card key={claim.id} className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md">
                    <CardContent className="p-5">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="flex min-w-0 gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            {claim.claimType === "MEDICAL" ? <Stethoscope className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-mono text-sm font-black text-primary" dir="ltr">{claim.claimNumber}</p>
                            <h3 className="mt-1 font-bold">{claim.customerName}</h3>
                            <p className="mt-0.5 text-sm text-muted-foreground">الوثيقة: <span dir="ltr">{claim.policyNumber}</span></p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="bg-muted text-foreground">{claimTypes.find((item) => item.value === claim.claimType)?.label ?? typeLabels[claim.claimType] ?? claim.claimType}</Badge>
                          <Badge className={status.className}><StatusIcon className="ml-1 h-3 w-3" />{status.label}</Badge>
                        </div>
                      </div>
                      <p className="mt-4 rounded-xl bg-muted/25 p-3 text-sm leading-6">{claim.description}</p>
                      {claim.attachments.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {claim.attachments.map((attachment, index) => <StoredAttachmentLink key={attachment} id={attachment} index={index} />)}
                        </div>
                      ) : null}
                      <div className="mt-4 flex flex-col justify-between gap-3 border-t pt-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{formatDate(claim.createdAt)}</span>
                          <span className="flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" />{claim.attachments.length} مرفقات</span>
                        </div>
                        {canManage ? <Button type="button" size="sm" variant="outline" className="border-primary/20 text-primary" onClick={() => { setError(""); setEditing(claim); }}>
                          <Pencil className="h-4 w-4" />تحديث الحالة
                        </Button> : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed"><CardContent className="flex min-h-64 flex-col items-center justify-center text-center"><FileSearch className="mb-4 h-9 w-9 text-muted-foreground" /><h3 className="font-semibold">لا توجد مطالبات مطابقة</h3></CardContent></Card>
          )}
          <PaginationControls page={pagination.page} pages={pagination.pages} onChange={pagination.setPage} />
        </section>

        {canManage ? <Card className="xl:sticky xl:top-24">
          <CardHeader className="border-b bg-muted/15">
            <CardTitle className="flex items-center gap-2"><PlusCircle className="h-5 w-5 text-primary" />مطالبة جديدة</CardTitle>
            <p className="text-sm text-muted-foreground">سجّل مطالبة مرتبطة بوثيقة موجودة.</p>
          </CardHeader>
          <CardContent className="p-5">
            <form action={createClaim} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="claim-policy">الوثيقة</Label>
                <select id="claim-policy" name="policyNumber" required className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  {policies.map((policy) => <option key={policy.policyNumber} value={policy.policyNumber}>{policy.policyNumber} — {policy.customerName}</option>)}
                </select>
              </div>
              <LookupSelect label="نوع المطالبة" name="claimType" category="CLAIM_TYPE" initialOptions={claimTypes} required />
              <div className="space-y-2">
                <Label htmlFor="claim-description">وصف المطالبة</Label>
                <textarea id="claim-description" name="description" required minLength={10} rows={5} placeholder="اكتب تفاصيل الحادث أو سبب المطالبة..." className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <AttachmentUpload value={attachments} onChange={setAttachments} />
              {error && !editing && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <Button className="w-full" disabled={busy || !policies.length}>
                {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                {busy ? "جارٍ الحفظ..." : "حفظ المطالبة"}
              </Button>
            </form>
          </CardContent>
        </Card> : null}
      </div>

      {canManage && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setEditing(null); }}>
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex-row items-start justify-between space-y-0 border-b">
              <div><CardTitle>تحديث حالة المطالبة</CardTitle><p className="mt-1 font-mono text-sm text-primary" dir="ltr">{editing.claimNumber}</p></div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setEditing(null)}><X className="h-5 w-5" /></Button>
            </CardHeader>
            <CardContent className="p-5">
              <form action={updateStatus} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="claim-status">الحالة الجديدة</Label>
                  <select id="claim-status" name="status" defaultValue={editing.status} className="h-11 w-full rounded-md border bg-background px-3">
                    {Object.entries(statusDetails).map(([value, detail]) => <option key={value} value={value}>{detail.label}</option>)}
                  </select>
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
    </>
  );
}
