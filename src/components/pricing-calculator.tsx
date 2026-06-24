"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  Calculator,
  CircleDollarSign,
  Clock3,
  Globe2,
  LoaderCircle,
  Plane,
  RotateCcw,
  ShieldCheck,
  UserRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

type Result = {
  premium: number;
  age: number;
  base: number;
  countryCategory: "ALLOWED" | "RESTRICTED" | "HIGH_RISK";
  planName: string;
};

const categoryLabels = {
  ALLOWED: { label: "مسموحة", className: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  RESTRICTED: { label: "مقيّدة", className: "text-amber-700 bg-amber-50 border-amber-200" },
  HIGH_RISK: { label: "عالية الخطورة", className: "text-red-700 bg-red-50 border-red-200" }
};

export function PricingCalculator({
  countries,
  plans
}: {
  countries: { id: string; nameAr: string; category: "ALLOWED" | "RESTRICTED" | "HIGH_RISK" }[];
  plans: { id: string; name: string; price: string }[];
}) {
  const [result, setResult] = useState<Result | null>(null);
  const [days, setDays] = useState(7);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]?.id ?? "");
  const [selectedPlan, setSelectedPlan] = useState(plans[0]?.id ?? "");
  const [coverage, setCoverage] = useState("25000");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const country = useMemo(() => countries.find((item) => item.id === selectedCountry), [countries, selectedCountry]);
  const plan = useMemo(() => plans.find((item) => item.id === selectedPlan), [plans, selectedPlan]);

  async function submit(formData: FormData) {
    setBusy(true);
    setError("");
    const response = await fetch("/api/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setResult(null);
      setError(data.error ?? "تعذر حساب السعر");
      return;
    }
    setResult(data);
  }

  function reset() {
    setResult(null);
    setError("");
    setDays(7);
    setCoverage("25000");
    setSelectedCountry(countries[0]?.id ?? "");
    setSelectedPlan(plans[0]?.id ?? "");
  }

  return (
    <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(320px,0.36fr)_minmax(0,1fr)]">
      <Card className="shadow-sm xl:sticky xl:top-24">
        <CardHeader className="border-b bg-muted/15">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            بيانات التسعير
          </CardTitle>
          <p className="text-sm text-muted-foreground">أدخل تفاصيل المسافر والرحلة للحصول على تقدير فوري.</p>
        </CardHeader>
        <CardContent className="p-5">
          <form action={submit} className="space-y-4">
            <Field label="تاريخ ميلاد المسافر" name="dateOfBirth" type="date" required icon={UserRound} />
            <Field
              label="مدة الرحلة بالأيام"
              name="numberOfDays"
              type="number"
              min="1"
              max="365"
              required
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              icon={CalendarDays}
              dir="ltr"
            />
            <Select
              label="دولة الوجهة"
              name="destinationCountryId"
              value={selectedCountry}
              onChange={(event) => setSelectedCountry(event.target.value)}
              icon={Globe2}
              options={countries.map((item) => ({ label: item.nameAr, value: item.id }))}
            />
            <Select
              label="مبلغ التغطية"
              name="coverageAmount"
              value={coverage}
              onChange={(event) => setCoverage(event.target.value)}
              icon={ShieldCheck}
              options={[10000, 25000, 50000, 100000].map((value) => ({
                label: formatCurrency(value),
                value: String(value)
              }))}
            />
            <Select
              label="خطة السفر"
              name="travelPlanId"
              value={selectedPlan}
              onChange={(event) => setSelectedPlan(event.target.value)}
              icon={Plane}
              options={plans.map((item) => ({
                label: `${item.name} — ${formatCurrency(item.price)}`,
                value: item.id
              }))}
            />
            {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <Button className="h-11 w-full" disabled={busy || !countries.length || !plans.length}>
              {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
              {busy ? "جارٍ حساب القسط..." : "احسب السعر"}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={reset}>
              <RotateCcw className="h-4 w-4" />إعادة تعيين
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="min-h-[570px] overflow-hidden shadow-sm">
        <CardHeader className="border-b bg-muted/15">
          <CardTitle>نتيجة التسعير</CardTitle>
          <p className="text-sm text-muted-foreground">تقدير القسط وتفاصيل عوامل التسعير.</p>
        </CardHeader>
        <CardContent className="p-5 sm:p-7">
          {result ? (
            <div className="space-y-6">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary via-cyan-700 to-slate-900 p-6 text-white sm:p-8">
                <CircleDollarSign className="absolute -bottom-6 -left-4 h-36 w-36 text-white/5" />
                <p className="text-sm text-white/70">القسط التأميني المتوقع</p>
                <p className="mt-2 text-4xl font-black sm:text-5xl" dir="ltr">{formatCurrency(result.premium)}</p>
                <p className="mt-3 text-sm text-white/70">
                  نحو {formatCurrency(result.premium / Math.max(days, 1))} لكل يوم من الرحلة
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Detail icon={UserRound} label="عمر المسافر" value={`${result.age} سنة`} />
                <Detail icon={Clock3} label="مدة الرحلة" value={`${days} يوم`} />
                <Detail icon={CircleDollarSign} label="السعر الأساسي" value={formatCurrency(result.base)} dir="ltr" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-muted-foreground">الوجهة وتصنيف المخاطر</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="font-bold">{country?.nameAr}</span>
                    <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${categoryLabels[result.countryCategory].className}`}>
                      {categoryLabels[result.countryCategory].label}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-muted-foreground">الخطة ومبلغ التغطية</p>
                  <p className="mt-2 font-bold">{result.planName}</p>
                  <p className="mt-1 text-sm text-muted-foreground" dir="ltr">{formatCurrency(coverage)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                السعر تقديري ويُعاد احتسابه عند إصدار الوثيقة بناءً على البيانات النهائية للعميل والرحلة.
              </div>

              <Button asChild className="h-11 w-full sm:w-auto">
                <Link href="/policies/new"><Plane className="h-4 w-4" />الانتقال إلى إصدار وثيقة</Link>
              </Button>
            </div>
          ) : (
            <div className="flex min-h-[430px] flex-col items-center justify-center text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Calculator className="h-9 w-9" />
              </div>
              <h2 className="text-lg font-bold">احسب قسط تأمين الرحلة</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                أدخل البيانات في النموذج، وستظهر هنا النتيجة مع تفاصيل العمر والرسوم وتصنيف الوجهة.
              </p>
              {plan && (
                <div className="mt-6 rounded-xl border bg-muted/20 px-4 py-3 text-sm">
                  الخطة المحددة: <strong>{plan.name}</strong>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  ...props
}: React.ComponentProps<typeof Input> & { label: string; icon: typeof UserRound }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id ?? props.name}>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input id={props.id ?? props.name} className="pr-10" {...props} />
      </div>
    </div>
  );
}

function Select({
  label,
  icon: Icon,
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  icon: typeof Globe2;
  options: { label: string; value: string }[];
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id ?? props.name}>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <select id={props.id ?? props.name} required className="h-10 w-full rounded-md border bg-background pr-10 pl-3 text-sm" {...props}>
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
  dir
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="rounded-xl border bg-muted/15 p-4">
      <Icon className="mb-3 h-5 w-5 text-primary" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-bold" dir={dir}>{value}</p>
    </div>
  );
}
