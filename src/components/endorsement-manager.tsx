"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, Clock3, Download, FilePenLine, LoaderCircle,
  Pencil, PlusCircle, Search, X, XCircle, FileDown, FileSpreadsheet
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocalCollection } from "@/lib/local-storage";
import { LookupSelect } from "@/components/lookup-select";

type Status = "DRAFT" | "APPROVED" | "REJECTED";
type EndorsementType = string;

export type EndorsementItem = {
  id: string;
  endorsementNumber: string;
  policyNumber: string;
  customerName: string;
  endorsementType: EndorsementType;
  details: string;
  additionalPremium: string;
  status: Status;
  createdAt: string;
};

const typeLabels: Record<string, string> = {
  EXTEND_TRAVEL_PERIOD: "تمديد فترة السفر",
  CHANGE_DESTINATION: "تغيير الوجهة",
  UPDATE_CUSTOMER_INFORMATION: "تحديث بيانات العميل",
  INCREASE_COVERAGE_AMOUNT: "زيادة مبلغ التغطية"
};

const statusDetails = {
  DRAFT: { label: "مسودة", className: "border-slate-200 bg-slate-100 text-slate-700", icon: Clock3 },
  APPROVED: { label: "معتمد", className: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  REJECTED: { label: "مرفوض", className: "border-red-200 bg-red-50 text-red-700", icon: XCircle }
} as const;

export function EndorsementManager({
  endorsements,
  policies,
  countries,
  canManage,
  endorsementTypes
}: {
  endorsements: EndorsementItem[];
  policies: { policyNumber: string; customerName: string }[];
  countries: { id: string; nameAr: string }[];
  canManage: boolean;
  endorsementTypes: { value: string; label: string }[];
}) {
  const router = useRouter();
  const [items, setItems] = useLocalCollection("endorsements", endorsements);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<EndorsementItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return items.filter((item) => !text || [item.endorsementNumber, item.policyNumber, item.customerName].some((value) => value.toLowerCase().includes(text)));
  }, [items, query]);

  async function createItem(formData: FormData) {
    setBusy(true);
    setError("");
    const response = await fetch("/api/endorsements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        policyNumber: formData.get("policyNumber"),
        endorsementType: formData.get("endorsementType"),
        newValue: { details: formData.get("details") },
        destinationCountryId: formData.get("destinationCountryId"),
        additionalPremium: formData.get("additionalPremium"),
        status: "DRAFT"
      })
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) return setError(result.error ?? "تعذر إنشاء الملحق");
    setItems((current) => [{
      id: result.id,
      endorsementNumber: result.endorsementNumber,
      policyNumber: result.policy.policyNumber,
      customerName: result.policy.customer.arabicName,
      endorsementType: result.endorsementType,
      details: String(result.newValue?.details ?? ""),
      additionalPremium: String(result.additionalPremium),
      status: result.status,
      createdAt: new Date(result.createdAt).toISOString()
    }, ...current]);
    router.refresh();
  }

  async function updateStatus(formData: FormData) {
    if (!editing) return;
    setBusy(true);
    setError("");
    const response = await fetch(`/api/endorsements/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: formData.get("status") })
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) return setError(result.error ?? "تعذر تحديث حالة الملحق");
    setItems((current) => current.map((item) =>
      item.id === editing.id ? { ...item, status: result.status } : item
    ));
    setEditing(null);
    router.refresh();
  }

  return (
    <>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث برقم الملحق، الوثيقة أو العميل..." className="h-11 bg-card pr-10 shadow-sm" />
            </div>
            <Button asChild variant="outline" size="sm"><Link href={`/api/export?resource=endorsements&format=xlsx&policyNumber=${encodeURIComponent(query)}`}><FileSpreadsheet className="h-4 w-4 text-emerald-600" />Excel</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href={`/api/export?resource=endorsements&format=pdf&policyNumber=${encodeURIComponent(query)}`}><FileDown className="h-4 w-4 text-red-600" />PDF</Link></Button>
          </div>
          <div className="space-y-4">
            {filtered.map((item) => {
              const status = statusDetails[item.status];
              const StatusIcon = status.icon;
              return (
                <Card key={item.id} className="overflow-hidden shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row">
                      <div className="flex gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><FilePenLine className="h-5 w-5" /></div>
                        <div>
                          <p className="font-mono text-sm font-black text-primary" dir="ltr">{item.endorsementNumber}</p>
                          <h3 className="mt-1 font-bold">{endorsementTypes.find((option) => option.value === item.endorsementType)?.label ?? typeLabels[item.endorsementType] ?? item.endorsementType}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{item.customerName} — <span dir="ltr">{item.policyNumber}</span></p>
                        </div>
                      </div>
                      <Badge className={status.className}><StatusIcon className="ml-1 h-3 w-3" />{status.label}</Badge>
                    </div>
                    <p className="mt-4 rounded-xl bg-muted/25 p-3 text-sm leading-6">{item.details}</p>
                    <div className="mt-4 flex flex-col justify-between gap-3 border-t pt-4 sm:flex-row sm:items-center">
                      <div className="flex gap-4 text-sm">
                        <span className="text-muted-foreground">{formatDate(item.createdAt)}</span>
                        <span>قسط إضافي: <strong className="text-primary" dir="ltr">{formatCurrency(item.additionalPremium)}</strong></span>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline"><Link href={`/api/endorsements/${item.id}/pdf`}><Download className="h-4 w-4" />PDF</Link></Button>
                        {canManage ? <Button type="button" size="sm" variant="outline" className="text-primary" onClick={() => { setError(""); setEditing(item); }}><Pencil className="h-4 w-4" />الحالة</Button> : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {!filtered.length && <Card className="border-dashed"><CardContent className="flex min-h-56 items-center justify-center text-muted-foreground">لا توجد ملاحق مطابقة.</CardContent></Card>}
          </div>
        </section>

        {canManage ? <Card className="xl:sticky xl:top-24">
          <CardHeader className="border-b bg-muted/15"><CardTitle className="flex items-center gap-2"><PlusCircle className="h-5 w-5 text-primary" />ملحق جديد</CardTitle></CardHeader>
          <CardContent className="p-5">
            <form action={createItem} className="space-y-4">
              <Select label="الوثيقة" name="policyNumber" options={policies.map((item) => ({ value: item.policyNumber, label: `${item.policyNumber} — ${item.customerName}` }))} />
              <LookupSelect label="نوع الملحق" name="endorsementType" category="ENDORSEMENT_TYPE" initialOptions={endorsementTypes} required />
              <div className="space-y-2"><Label htmlFor="endorsement-details">تفاصيل التعديل المطلوب</Label><textarea id="endorsement-details" name="details" required minLength={3} rows={4} className="w-full resize-none rounded-md border bg-background p-3 text-sm" placeholder="مثال: تمديد تاريخ العودة إلى 30 أغسطس 2026" /></div>
              <Select label="الوجهة الجديدة (اختياري)" name="destinationCountryId" options={[{ value: "", label: "بدون تغيير" }, ...countries.map((item) => ({ value: item.id, label: item.nameAr }))]} />
              <div className="space-y-2"><Label htmlFor="endorsement-premium">القسط الإضافي</Label><Input id="endorsement-premium" name="additionalPremium" type="number" min="0" step="0.01" defaultValue="0" required dir="ltr" /></div>
              {error && !editing && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <Button className="w-full" disabled={busy || !policies.length}>{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}{busy ? "جارٍ الحفظ..." : "إنشاء الملحق"}</Button>
            </form>
          </CardContent>
        </Card> : null}
      </div>

      {canManage && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex-row items-start justify-between space-y-0 border-b"><div><CardTitle>تحديث حالة الملحق</CardTitle><p className="mt-1 font-mono text-sm text-primary">{editing.endorsementNumber}</p></div><Button type="button" variant="ghost" size="icon" onClick={() => setEditing(null)}><X className="h-5 w-5" /></Button></CardHeader>
            <CardContent className="p-5"><form action={updateStatus} className="space-y-5"><Select label="الحالة" name="status" defaultValue={editing.status} options={Object.entries(statusDetails).map(([value, detail]) => ({ value, label: detail.label }))} />{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="flex gap-2 border-t pt-5"><Button type="button" variant="outline" className="flex-1" onClick={() => setEditing(null)}>إلغاء</Button><Button type="submit" className="flex-[2]" disabled={busy}>حفظ الحالة</Button></div></form></CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function Select({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: { value: string; label: string }[] }) {
  const id = props.id ?? props.name;
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><select id={id} required className="h-10 w-full rounded-md border bg-background px-3 text-sm" {...props}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>;
}
