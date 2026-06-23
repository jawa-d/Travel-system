"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CircleDollarSign, Download, FileX2, LoaderCircle,
  ReceiptText, Search, ShieldAlert, FileDown, FileSpreadsheet
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import { readLocalCollection, useLocalCollection, writeLocalCollection } from "@/lib/local-storage";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast-provider";
import { LookupSelect } from "@/components/lookup-select";

type Reason = string;

export type CancellationItem = {
  id: string;
  cancellationNumber: string;
  policyNumber: string;
  customerName: string;
  reason: Reason;
  notes: string | null;
  premium: string;
  refundAmount: string;
  administrativeFees: string;
  createdAt: string;
};

const reasonLabels: Record<string, string> = {
  VISA_REJECTION: "رفض التأشيرة",
  TRIP_CANCELLATION: "إلغاء الرحلة",
  CUSTOMER_REQUEST: "طلب العميل",
  ISSUANCE_ERROR: "خطأ في الإصدار"
};

export function CancellationManager({
  cancellations,
  policies,
  canCreate,
  cancellationReasons
}: {
  cancellations: CancellationItem[];
  policies: { policyNumber: string; customerName: string; premium: string }[];
  canCreate: boolean;
  cancellationReasons: { value: string; label: string }[];
}) {
  const [items, setItems] = useLocalCollection("cancellations", cancellations);
  const [query, setQuery] = useState("");
  const [selectedPolicy, setSelectedPolicy] = useState(policies[0]?.policyNumber ?? "");
  const [fees, setFees] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pendingCancellation, setPendingCancellation] = useState<Record<string, FormDataEntryValue> | null>(null);
  const { toast } = useToast();

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return items.filter((item) =>
      !text || [item.cancellationNumber, item.policyNumber, item.customerName].some((value) => value.toLowerCase().includes(text))
    );
  }, [items, query]);

  const availablePolicyOptions = policies.filter(
    (item) => !items.some((cancellation) => cancellation.policyNumber === item.policyNumber)
  );
  const policy = availablePolicyOptions.find((item) => item.policyNumber === selectedPolicy);
  const estimatedRefund = Math.max(Number(policy?.premium ?? 0) * 0.8 - fees, 0);

  async function createCancellation(formData: FormData) {
    setPendingCancellation(Object.fromEntries(formData.entries()));
  }

  async function confirmCancellation() {
    if (!pendingCancellation) return;
    const requestedPolicyNumber = String(pendingCancellation.policyNumber ?? "");
    const requestedPolicy = policies.find((item) => item.policyNumber === requestedPolicyNumber);
    setBusy(true);
    setError("");
    const response = await fetch("/api/cancellations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pendingCancellation)
    });
    const result = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok || !result) {
      setError(result?.error ?? "تعذر إلغاء الوثيقة");
      return;
    }
    const resultPolicy = result.policy ?? (requestedPolicy ? {
      id: null,
      policyNumber: requestedPolicy.policyNumber,
      premium: requestedPolicy.premium,
      customer: { arabicName: requestedPolicy.customerName }
    } : null);
    if (!resultPolicy) {
      setPendingCancellation(null);
      setError("تم إلغاء الوثيقة، لكن تعذر تحميل بياناتها. حدّث الصفحة لعرض شهادة الإلغاء.");
      return;
    }
    setPendingCancellation(null);
    setItems((current) => [{
      id: result.id,
      cancellationNumber: result.cancellationNumber,
      policyNumber: resultPolicy.policyNumber,
      customerName: resultPolicy.customer.arabicName,
      reason: result.reason,
      notes: result.notes,
      premium: String(resultPolicy.premium),
      refundAmount: String(result.refundAmount),
      administrativeFees: String(result.administrativeFees),
      createdAt: new Date(result.createdAt).toISOString()
    }, ...current]);
    const localPolicies = readLocalCollection<Array<{ id: string; status: string }> extends Array<infer T> ? T : never>("policies");
    if (localPolicies) {
      writeLocalCollection("policies", localPolicies.map((item) =>
        item.id === resultPolicy.id ? { ...item, status: "CANCELLED" } : item
      ));
    }
    toast({ title: "تم إلغاء الوثيقة", description: `تم إنشاء شهادة الإلغاء ${result.cancellationNumber}`, tone: "success" });
    setSelectedPolicy((current) => {
      const remaining = availablePolicyOptions.filter((item) => item.policyNumber !== resultPolicy.policyNumber);
      return current === resultPolicy.policyNumber ? (remaining[0]?.policyNumber ?? "") : current;
    });
  }

  return (
    <>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
      <section>
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث برقم الإلغاء، الوثيقة أو العميل..." className="h-11 bg-card pr-10 shadow-sm" />
          </div>
          <Button asChild variant="outline" size="sm"><Link href={`/api/export?resource=cancellations&format=xlsx&policyNumber=${encodeURIComponent(query)}`}><FileSpreadsheet className="h-4 w-4 text-emerald-600" />Excel</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href={`/api/export?resource=cancellations&format=pdf&policyNumber=${encodeURIComponent(query)}`}><FileDown className="h-4 w-4 text-red-600" />PDF</Link></Button>
        </div>

        <div className="space-y-4">
          {filtered.map((item) => (
            <Card key={item.id} className="overflow-hidden border-red-100 shadow-sm">
              <CardContent className="p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="flex gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                      <FileX2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-black text-red-600" dir="ltr">{item.cancellationNumber}</p>
                      <h3 className="mt-1 font-bold">{item.customerName}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">الوثيقة: <span dir="ltr">{item.policyNumber}</span></p>
                    </div>
                  </div>
                  <Badge className="border-red-200 bg-red-50 text-red-700">{cancellationReasons.find((option) => option.value === item.reason)?.label ?? reasonLabels[item.reason] ?? item.reason}</Badge>
                </div>

                {item.notes && <p className="mt-4 rounded-xl bg-muted/25 p-3 text-sm leading-6">{item.notes}</p>}

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Amount label="قسط الوثيقة" value={item.premium} />
                  <Amount label="الرسوم الإدارية" value={item.administrativeFees} />
                  <Amount label="مبلغ الاسترداد" value={item.refundAmount} highlight />
                </div>

                <div className="mt-4 flex flex-col justify-between gap-3 border-t pt-4 sm:flex-row sm:items-center">
                  <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/api/cancellations/${item.id}/pdf`}><Download className="h-4 w-4" />شهادة الإلغاء</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {!filtered.length && (
            <Card className="border-dashed">
              <CardContent className="flex min-h-56 flex-col items-center justify-center text-center">
                <FileX2 className="mb-4 h-9 w-9 text-muted-foreground" />
                <h3 className="font-semibold">لا توجد إلغاءات مطابقة</h3>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {canCreate ? <Card className="border-red-100 xl:sticky xl:top-24">
        <CardHeader className="border-b bg-red-50/50">
          <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-red-600" />إلغاء وثيقة</CardTitle>
          <p className="text-sm text-muted-foreground">الإلغاء نهائي ويغيّر حالة الوثيقة إلى ملغاة.</p>
        </CardHeader>
        <CardContent className="p-5">
          <form action={createCancellation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancellation-policy">الوثيقة</Label>
              <select id="cancellation-policy" name="policyNumber" required value={selectedPolicy} onChange={(event) => setSelectedPolicy(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                {availablePolicyOptions.map((item) => <option key={item.policyNumber} value={item.policyNumber}>{item.policyNumber} — {item.customerName}</option>)}
              </select>
            </div>
            <LookupSelect label="سبب الإلغاء" name="reason" category="CANCELLATION_REASON" initialOptions={cancellationReasons} required />
            <div className="space-y-2">
              <Label htmlFor="cancellation-fees">الرسوم الإدارية</Label>
              <Input id="cancellation-fees" name="administrativeFees" type="number" min="0" step="0.01" value={fees} onChange={(event) => setFees(Number(event.target.value))} required dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cancellation-notes">ملاحظات</Label>
              <textarea id="cancellation-notes" name="notes" rows={4} className="w-full resize-none rounded-md border bg-background p-3 text-sm" placeholder="تفاصيل أو مرجع طلب الإلغاء..." />
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-sm text-emerald-800">
                <CircleDollarSign className="h-4 w-4" />الاسترداد المتوقع
              </div>
              <p className="mt-2 text-2xl font-black text-emerald-700" dir="ltr">{formatCurrency(estimatedRefund)}</p>
              <p className="mt-1 text-xs text-emerald-700/75">80% من القسط ناقص الرسوم الإدارية</p>
            </div>

            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <Button variant="destructive" className="w-full" disabled={busy || !availablePolicyOptions.length}>
              {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ReceiptText className="h-4 w-4" />}
              {busy ? "جارٍ تنفيذ الإلغاء..." : "إلغاء الوثيقة"}
            </Button>
            {!availablePolicyOptions.length && <p className="text-center text-xs text-muted-foreground">لا توجد وثائق متاحة للإلغاء.</p>}
          </form>
        </CardContent>
      </Card> : null}
    </div>
    <ConfirmDialog open={Boolean(pendingCancellation)} onOpenChange={(open) => !open && setPendingCancellation(null)} title="تأكيد إلغاء الوثيقة" description="الإلغاء نهائي، وسيُسجل في سجل التدقيق وتتغير حالة الوثيقة إلى ملغاة." confirmLabel="تنفيذ الإلغاء" destructive busy={busy} onConfirm={confirmCancellation} />
    </>
  );
}

function Amount({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? "bg-emerald-50 text-emerald-700" : "bg-muted/25"}`}>
      <p className="text-xs opacity-75">{label}</p>
      <p className="mt-1 font-black" dir="ltr">{formatCurrency(value)}</p>
    </div>
  );
}
