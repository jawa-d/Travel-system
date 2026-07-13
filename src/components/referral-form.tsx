"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { ReferralType, TransportMode } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { coverTypes, extraRiskOptions, referralTypeLabels, transportModeLabels } from "@/lib/referrals";

type Installment = { label: string; amount: string; dueDate: string };

export function ReferralForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [installments, setInstallments] = useState<Installment[]>([{ label: "الدفعة الاولى", amount: "", dueDate: "" }]);
  const totalPremium = useMemo(() => installments.reduce((sum, item) => sum + Number(item.amount || 0), 0), [installments]);

  function updateInstallment(index: number, field: keyof Installment, value: string) {
    setInstallments((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      type: form.get("type"),
      applicantName: form.get("applicantName"),
      beneficiaryName: form.get("beneficiaryName"),
      insuredAmount: form.get("insuredAmount"),
      insuranceFrom: form.get("insuranceFrom"),
      insuranceTo: form.get("insuranceTo"),
      totalInsuredAfterIncrease: form.get("totalInsuredAfterIncrease"),
      increaseRate: form.get("increaseRate"),
      coverType: form.get("coverType"),
      cargoDescription: form.get("cargoDescription"),
      routeFrom: form.get("routeFrom"),
      routeTo: form.get("routeTo"),
      transportMode: form.get("transportMode"),
      packagingType: form.get("packagingType"),
      lcNumber: form.get("lcNumber"),
      carrierName: form.get("carrierName"),
      invoiceNumber: form.get("invoiceNumber"),
      currency: form.get("currency"),
      extraRisks: form.getAll("extraRisks"),
      hasPreviousCompensation: form.get("hasPreviousCompensation") === "true",
      totalPremium,
      installments: installments.map((item) => ({ label: item.label, amount: item.amount, dueDate: item.dueDate || null })),
      notes: form.get("notes")
    };

    const response = await fetch("/api/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) {
      toast({ title: "تعذر حفظ الإحالة", description: result?.error, tone: "error" });
      return;
    }
    toast({ title: "تم رفع الإحالة", description: `رقم الإحالة ${result.referralNumber}`, tone: "success" });
    router.push("/referrals");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>نوع وحالة الإحالة</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1.5 text-sm font-bold">
            <span>نوع الإحالة</span>
            <select name="type" defaultValue={ReferralType.MARINE} className="h-11 w-full rounded-lg border bg-background px-3">
              {Object.entries(referralTypeLabels).map(([value, label]) => <option key={value} value={value} disabled={value !== ReferralType.MARINE}>{label}{value !== ReferralType.MARINE ? " - غير مفعل" : ""}</option>)}
            </select>
          </label>
          <Field name="applicantName" label="اسم طالب التأمين (المشترك)" required />
          <Field name="beneficiaryName" label="المستفيد" required />
          <Field name="currency" label="العملة" defaultValue="IQD" required />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>تفاصيل التأمين والغطاء</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field name="insuredAmount" label="مبلغ التأمين" type="number" required />
          <Field name="insuranceFrom" label="مدة التأمين من" type="date" required />
          <Field name="insuranceTo" label="مدة التأمين الى" type="date" required />
          <Field name="totalInsuredAfterIncrease" label="مبلغ التأمين الكلي بعد الزيادة" type="number" required />
          <Field name="increaseRate" label="نسبة الزيادة" type="number" defaultValue="0" required />
          <label className="space-y-1.5 text-sm font-bold">
            <span>نوع الغطاء</span>
            <select name="coverType" className="h-11 w-full rounded-lg border bg-background px-3">
              {coverTypes.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <Field name="cargoDescription" label="البضاعة المنقولة" required className="xl:col-span-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>الرحلة والنقل</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field name="routeFrom" label="مسار الرحلة من" required />
          <Field name="routeTo" label="مسار الرحلة الى" required />
          <label className="space-y-1.5 text-sm font-bold">
            <span>نوع النقل</span>
            <select name="transportMode" className="h-11 w-full rounded-lg border bg-background px-3">
              {Object.entries(transportModeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <Field name="packagingType" label="نوع التغليف" required />
          <Field name="lcNumber" label="رقم الاعتماد LC NO" />
          <Field name="carrierName" label="واسطة النقل" />
          <Field name="invoiceNumber" label="رقم الطلب (Invoice)" required />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>الأخطار والتعويضات</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-bold">هل ترغب بإضافة اخطار إضافية؟</p>
            <div className="flex flex-wrap gap-2">
              {extraRiskOptions.map((risk) => (
                <label key={risk} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                  <input name="extraRisks" type="checkbox" value={risk} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                  {risk}
                </label>
              ))}
            </div>
          </div>
          <label className="space-y-1.5 text-sm font-bold">
            <span>هل يوجد تعويض سابق؟</span>
            <select name="hasPreviousCompensation" className="h-11 w-full rounded-lg border bg-background px-3">
              <option value="false">لا</option>
              <option value="true">نعم</option>
            </select>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>دفعات القسط الكلي</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {installments.map((item, index) => (
            <div key={index} className="grid gap-3 rounded-lg border bg-muted/10 p-3 md:grid-cols-[1fr_180px_180px_auto]">
              <Input value={item.label} onChange={(event) => updateInstallment(index, "label", event.target.value)} placeholder="اسم الدفعة" required />
              <Input value={item.amount} onChange={(event) => updateInstallment(index, "amount", event.target.value)} placeholder="المبلغ" type="number" min="0" step="0.01" required dir="ltr" />
              <Input value={item.dueDate} onChange={(event) => updateInstallment(index, "dueDate", event.target.value)} type="date" />
              <Button type="button" variant="ghost" size="icon" disabled={installments.length === 1} onClick={() => setInstallments((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <Button type="button" variant="outline" onClick={() => setInstallments((current) => [...current, { label: `دفعة ${current.length + 1}`, amount: "", dueDate: "" }])}><Plus className="h-4 w-4" />إضافة دفعة</Button>
            <div className="rounded-lg bg-primary/10 px-4 py-2 text-sm font-black text-primary">القسط الكلي: {totalPremium.toLocaleString("en-US")} </div>
          </div>
          <textarea name="notes" placeholder="ملاحظات" className="min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button disabled={busy || totalPremium <= 0} className="h-11 px-6"><Save className="h-4 w-4" />{busy ? "جار الحفظ..." : "رفع الإحالة"}</Button>
      </div>
    </form>
  );
}

function Field({ label, className = "", ...props }: React.ComponentProps<typeof Input> & { label: string }) {
  return (
    <label className={`space-y-1.5 text-sm font-bold ${className}`}>
      <span>{label}</span>
      <Input {...props} />
    </label>
  );
}
