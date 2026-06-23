"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe2, Pencil, ShieldAlert, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalCollection } from "@/lib/local-storage";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast-provider";

export type CountryItem = {
  id: string;
  nameAr: string;
  nameEn: string;
  isoCode: string;
  category: "ALLOWED" | "RESTRICTED" | "HIGH_RISK";
  status: "ACTIVE" | "INACTIVE";
};

const categoryDetails = {
  ALLOWED: {
    label: "مسموحة",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    accent: "from-emerald-500 to-teal-500"
  },
  RESTRICTED: {
    label: "مقيّدة",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    accent: "from-amber-500 to-orange-500"
  },
  HIGH_RISK: {
    label: "عالية الخطورة",
    className: "border-red-200 bg-red-50 text-red-700",
    accent: "from-red-500 to-rose-500"
  }
} as const;

export function CountryManager({ countries }: { countries: CountryItem[] }) {
  const router = useRouter();
  const [items, setItems] = useLocalCollection("countries", countries);
  const [editing, setEditing] = useState<CountryItem | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<CountryItem | null>(null);
  const { toast } = useToast();

  async function updateCountry(formData: FormData) {
    if (!editing) return;
    setBusy(editing.id);
    setError("");
    const response = await fetch(`/api/countries/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setError(result?.error ?? "تعذر تعديل الدولة");
      setBusy(null);
      return;
    }
    const result = await response.json();
    setItems((current) => current.map((country) => country.id === editing.id ? result : country));
    setEditing(null);
    setBusy(null);
    router.refresh();
  }

  async function deleteCountry(country: CountryItem) {
    setBusy(country.id);
    setError("");
    const response = await fetch(`/api/countries/${country.id}`, { method: "DELETE" });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setError(result?.error ?? "تعذر حذف الدولة. قد تكون مرتبطة بوثائق تأمين، ويمكنك تعطيلها بدلًا من حذفها.");
      setBusy(null);
      return;
    }
    setItems((current) => current.filter((item) => item.id !== country.id));
    setDeleting(null);
    setBusy(null);
    toast({ title: "تم حذف الدولة", tone: "success" });
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
          <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground"><Globe2 className="h-7 w-7" /></div>
          <h3 className="font-semibold">لا توجد دول بعد</h3>
          <p className="mt-1 text-sm text-muted-foreground">استخدم النموذج لإضافة أول دولة.</p>
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

      <div className="grid gap-4 2xl:grid-cols-2">
        {items.map((country) => {
          const category = categoryDetails[country.category];
          return (
            <Card key={country.id} className="group relative overflow-hidden border-border/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className={`absolute inset-y-0 right-0 w-1 bg-gradient-to-b ${category.accent}`} />
              <CardContent className="p-5 pr-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-mono text-lg font-black uppercase text-primary">
                      {country.isoCode}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold">{country.nameAr}</h3>
                      <p className="truncate text-sm text-muted-foreground" dir="ltr">{country.nameEn}</p>
                    </div>
                  </div>
                  <Badge className={country.status === "ACTIVE"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-100 text-slate-600"
                  }>
                    {country.status === "ACTIVE" ? "فعالة" : "غير فعالة"}
                  </Badge>
                </div>

                <div className="mt-5">
                  <div className="rounded-xl border bg-muted/20 p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldAlert className="h-4 w-4" />التصنيف
                    </div>
                    <Badge className={category.className}>{category.label}</Badge>
                  </div>
                </div>

                <div className="mt-4 flex gap-2 border-t pt-4">
                  <Button type="button" variant="outline" className="flex-1 border-primary/20 text-primary hover:bg-primary hover:text-white" onClick={() => { setError(""); setEditing(country); }} disabled={busy === country.id}>
                    <Pencil className="h-4 w-4" />تعديل
                  </Button>
                  <Button type="button" variant="outline" className="border-red-200 text-red-600 hover:bg-red-600 hover:text-white" onClick={() => setDeleting(country)} disabled={busy === country.id}>
                    <Trash2 className="h-4 w-4" />{busy === country.id ? "جارٍ التنفيذ..." : "حذف"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setEditing(null); }}>
          <Card className="w-full max-w-xl shadow-2xl">
            <CardHeader className="flex-row items-center justify-between space-y-0 border-b px-5 py-4">
              <div><CardTitle>تعديل الدولة</CardTitle><p className="mt-1 text-sm text-muted-foreground">تحديث الاسم والتصنيف والحالة.</p></div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setEditing(null)} disabled={Boolean(busy)}><X className="h-5 w-5" /></Button>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              <form action={updateCountry} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="country-name-ar" name="nameAr" label="اسم الدولة بالعربية" defaultValue={editing.nameAr} />
                  <Field id="country-name-en" name="nameEn" label="اسم الدولة بالإنجليزية" defaultValue={editing.nameEn} dir="ltr" />
                  <Field id="country-iso" name="isoCode" label="رمز ISO" defaultValue={editing.isoCode} dir="ltr" maxLength={3} />
                  <div className="space-y-2">
                    <Label htmlFor="country-category">التصنيف</Label>
                    <select id="country-category" name="category" defaultValue={editing.category} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                      <option value="ALLOWED">مسموحة</option>
                      <option value="RESTRICTED">مقيّدة</option>
                      <option value="HIGH_RISK">عالية الخطورة</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country-status">الحالة</Label>
                    <select id="country-status" name="status" defaultValue={editing.status} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                      <option value="ACTIVE">فعالة</option>
                      <option value="INACTIVE">غير فعالة</option>
                    </select>
                  </div>
                </div>
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
      <ConfirmDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)} title="حذف الدولة؟" description={`سيتم حذف “${deleting?.nameAr ?? ""}” نهائيًا إذا لم تكن مرتبطة بوثائق.`} confirmLabel="حذف" destructive busy={Boolean(busy)} onConfirm={() => { if (deleting) return deleteCountry(deleting); }} />
    </>
  );
}

function Field({ id, label, ...props }: React.ComponentProps<typeof Input> & { id: string; label: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} required {...props} />
    </div>
  );
}
