"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness, CheckCircle2, Clock3, HeartPulse, Luggage, Pencil,
  Plane, ShieldCheck, Trash2, UserRoundCheck, X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { useLocalCollection } from "@/lib/local-storage";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast-provider";

export type PlanItem = {
  id: string;
  name: string;
  price: string;
  medicalCoverage: string;
  baggageCoverage: string;
  tripDelayCoverage: string;
  medicalEvacuation: string;
  repatriation: string;
  personalLiability: string;
  active: boolean;
};

const fields = [
  { key: "price", label: "سعر الخطة" },
  { key: "medicalCoverage", label: "التغطية الطبية" },
  { key: "baggageCoverage", label: "تغطية الأمتعة" },
  { key: "tripDelayCoverage", label: "تأخير الرحلة" },
  { key: "medicalEvacuation", label: "الإخلاء الطبي" },
  { key: "repatriation", label: "إعادة الجثمان" },
  { key: "personalLiability", label: "المسؤولية الشخصية" }
] as const;

const coverageItems = [
  { key: "medicalCoverage", label: "التغطية الطبية", icon: HeartPulse, tone: "text-rose-600 bg-rose-50" },
  { key: "baggageCoverage", label: "تغطية الأمتعة", icon: Luggage, tone: "text-amber-600 bg-amber-50" },
  { key: "tripDelayCoverage", label: "تأخير الرحلة", icon: Clock3, tone: "text-blue-600 bg-blue-50" },
  { key: "medicalEvacuation", label: "الإخلاء الطبي", icon: Plane, tone: "text-cyan-700 bg-cyan-50" },
  { key: "repatriation", label: "إعادة الجثمان", icon: BriefcaseBusiness, tone: "text-violet-600 bg-violet-50" },
  { key: "personalLiability", label: "المسؤولية الشخصية", icon: UserRoundCheck, tone: "text-emerald-600 bg-emerald-50" }
] as const;

export function PlanManager({ plans }: { plans: PlanItem[] }) {
  const router = useRouter();
  const [items, setItems] = useLocalCollection("plans", plans);
  const [editing, setEditing] = useState<PlanItem | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<PlanItem | null>(null);
  const { toast } = useToast();

  async function updatePlan(formData: FormData) {
    if (!editing) return;
    setBusy(editing.id);
    setError("");
    const body = Object.fromEntries(formData.entries());
    const response = await fetch(`/api/plans/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, active: formData.get("active") === "on" })
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setError(result?.error ?? "تعذر تعديل الخطة");
      setBusy(null);
      return;
    }
    const result = await response.json();
    setItems((current) => current.map((plan) => plan.id === editing.id ? {
      ...result,
      price: String(result.price),
      medicalCoverage: String(result.medicalCoverage),
      baggageCoverage: String(result.baggageCoverage),
      tripDelayCoverage: String(result.tripDelayCoverage),
      medicalEvacuation: String(result.medicalEvacuation),
      repatriation: String(result.repatriation),
      personalLiability: String(result.personalLiability)
    } : plan));
    setEditing(null);
    setBusy(null);
    router.refresh();
  }

  async function deletePlan(plan: PlanItem) {
    setBusy(plan.id);
    setError("");
    const response = await fetch(`/api/plans/${plan.id}`, { method: "DELETE" });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setError(result?.error ?? "تعذر حذف الخطة. قد تكون مرتبطة بوثائق تأمين، ويمكنك تعطيلها بدلًا من حذفها.");
      setBusy(null);
      return;
    }
    setItems((current) => current.filter((item) => item.id !== plan.id));
    setDeleting(null);
    setBusy(null);
    toast({ title: "تم حذف الخطة", tone: "success" });
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
          <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground"><ShieldCheck className="h-7 w-7" /></div>
          <h3 className="font-semibold">لا توجد خطط سفر بعد</h3>
          <p className="mt-1 text-sm text-muted-foreground">استخدم النموذج لإضافة أول خطة تأمين.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {error && !editing && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{error}</p>
          <button type="button" onClick={() => setError("")} aria-label="إغلاق الرسالة"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="grid gap-5 2xl:grid-cols-2">
        {items.map((plan, index) => (
          <Card key={plan.id} className="group relative overflow-hidden border-border/80 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-primary via-cyan-500 to-secondary" />
            <CardHeader className="border-b bg-muted/15 px-5 pb-5 pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="h-6 w-6" /></div>
                  <div className="min-w-0">
                    <CardTitle className="truncate text-xl">{plan.name}</CardTitle>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge className={plan.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}>
                        <CheckCircle2 className="ml-1 h-3 w-3" />{plan.active ? "فعالة" : "غير فعالة"}
                      </Badge>
                      {index === 0 && <Badge className="border-amber-200 bg-amber-50 text-amber-700">الأحدث</Badge>}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-left">
                  <p className="text-xs text-muted-foreground">سعر الخطة</p>
                  <p className="mt-1 text-2xl font-black text-primary" dir="ltr">{formatCurrency(plan.price)}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5">
              <p className="mb-3 text-xs font-semibold text-muted-foreground">حدود التغطية</p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {coverageItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.key} className="flex items-center gap-3 rounded-xl border border-border/70 bg-background p-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.tone}`}><Icon className="h-4 w-4" /></div>
                      <div className="min-w-0">
                        <p className="truncate text-xs text-muted-foreground">{item.label}</p>
                        <p className="mt-0.5 font-bold" dir="ltr">{formatCurrency(plan[item.key])}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 flex gap-2 border-t pt-4">
                <Button type="button" variant="outline" className="flex-1 border-primary/20 text-primary hover:bg-primary hover:text-white" onClick={() => { setError(""); setEditing(plan); }} disabled={busy === plan.id}>
                  <Pencil className="h-4 w-4" />تعديل
                </Button>
                <Button type="button" variant="outline" className="border-red-200 text-red-600 hover:bg-red-600 hover:text-white" onClick={() => setDeleting(plan)} disabled={busy === plan.id}>
                  <Trash2 className="h-4 w-4" />{busy === plan.id ? "جارٍ التنفيذ..." : "حذف"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setEditing(null); }}>
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto shadow-2xl">
            <CardHeader className="sticky top-0 z-10 flex-row items-center justify-between space-y-0 border-b bg-card px-5 py-4">
              <div><CardTitle>تعديل خطة السفر</CardTitle><p className="mt-1 text-sm text-muted-foreground">حدّث السعر والتغطيات وحالة الخطة.</p></div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setEditing(null)} disabled={Boolean(busy)}><X className="h-5 w-5" /></Button>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              <form action={updatePlan} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="edit-plan-name">اسم الخطة</Label>
                  <Input id="edit-plan-name" name="name" defaultValue={editing.name} required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {fields.map((field) => (
                    <div className="space-y-2" key={field.key}>
                      <Label htmlFor={`edit-${field.key}`}>{field.label}</Label>
                      <Input id={`edit-${field.key}`} name={field.key} type="number" min="0" step="0.01" defaultValue={editing[field.key]} required dir="ltr" />
                    </div>
                  ))}
                </div>
                <label className="flex cursor-pointer items-center justify-between rounded-xl border bg-muted/25 p-4">
                  <div><p className="font-medium">الخطة فعالة</p><p className="mt-0.5 text-xs text-muted-foreground">تظهر ضمن خيارات إصدار وثيقة جديدة.</p></div>
                  <input name="active" type="checkbox" defaultChecked={editing.active} className="h-5 w-5 accent-[hsl(var(--primary))]" />
                </label>
                {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row">
                  <Button type="button" variant="outline" className="sm:flex-1" onClick={() => setEditing(null)} disabled={Boolean(busy)}>إلغاء</Button>
                  <Button type="submit" className="sm:flex-[2]" disabled={Boolean(busy)}>{busy ? "جارٍ حفظ التعديلات..." : "حفظ التعديلات"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
      <ConfirmDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)} title="حذف خطة السفر؟" description={`سيتم حذف “${deleting?.name ?? ""}” نهائيًا إذا لم تكن مستخدمة في وثائق.`} confirmLabel="حذف" destructive busy={Boolean(busy)} onConfirm={() => { if (deleting) return deletePlan(deleting); }} />
    </>
  );
}
