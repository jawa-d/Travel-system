"use client";

import { useState } from "react";
import { Plus, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";

type Lookup = {
  id: string;
  category: string;
  value: string;
  labelAr: string;
  labelEn: string | null;
  active: boolean;
  system: boolean;
  sortOrder: number;
};

const categories = {
  CLAIM_TYPE: "أنواع المطالبات",
  POLICY_TYPE: "أنواع الوثائق",
  COVERAGE_TYPE: "أنواع التغطية",
  ENDORSEMENT_TYPE: "أنواع الملاحق",
  CANCELLATION_REASON: "أسباب الإلغاء",
  DESTINATION: "الوجهات",
  TRAVEL_PLAN: "خطط السفر"
} as const;

export function LookupManager({ initialValues }: { initialValues: Lookup[] }) {
  const [items, setItems] = useState(initialValues);
  const [category, setCategory] = useState<keyof typeof categories>("CLAIM_TYPE");
  const { toast } = useToast();
  const visible = items.filter((item) => item.category === category);

  async function create(formData: FormData) {
    const labelAr = String(formData.get("labelAr") ?? "");
    const response = await fetch("/api/lookups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        value: formData.get("value"),
        labelAr,
        labelEn: labelAr,
        sortOrder: formData.get("sortOrder")
      })
    });
    const result = await response.json();
    if (!response.ok) return toast({ title: result.error ?? "تعذر إضافة القيمة", tone: "error" });
    setItems((current) => [...current, result]);
    toast({ title: "تمت إضافة القيمة", tone: "success" });
  }

  async function toggle(item: Lookup) {
    const response = await fetch(`/api/lookups/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !item.active })
    });
    if (response.ok) setItems((current) => current.map((value) => value.id === item.id ? { ...value, active: !value.active } : value));
  }

  async function remove(item: Lookup) {
    const response = await fetch(`/api/lookups/${item.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) return toast({ title: result.error ?? "تعذر الحذف", tone: "error" });
    setItems((current) => current.filter((value) => value.id !== item.id));
  }

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(240px,0.22fr)_minmax(0,1fr)]">
      <Card>
        <CardContent className="space-y-2 p-3">
          {Object.entries(categories).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value as keyof typeof categories)}
              className={`w-full rounded-xl px-4 py-3 text-right text-sm font-semibold transition ${category === value ? "bg-primary text-white" : "hover:bg-muted"}`}
            >
              {label}
            </button>
          ))}
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <form action={create} className="grid gap-3 md:grid-cols-[1fr_1fr_90px_auto]">
              <Input name="value" placeholder="كود القيمة" required dir="ltr" />
              <Input name="labelAr" placeholder="الاسم بالعربية" required />
              <Input name="sortOrder" type="number" defaultValue="0" min="0" dir="ltr" />
              <Button>
                <Plus className="h-4 w-4" />
                إضافة
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="divide-y p-0">
            {visible.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-bold">{item.labelAr}</p>
                  <p className="text-sm text-muted-foreground" dir="ltr">{item.value}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-xs ${item.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{item.active ? "فعالة" : "معطلة"}</span>
                  <Button type="button" size="icon" variant="outline" onClick={() => toggle(item)}>
                    <Power className="h-4 w-4" />
                  </Button>
                  {!item.system ? (
                    <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => remove(item)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
