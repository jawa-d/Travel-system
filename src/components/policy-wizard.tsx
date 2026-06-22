"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, FileText,
  Plane, ShieldCheck, UserPlus, UserRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { ImageUpload } from "@/components/image-upload";
import { upsertLocalItem, useLocalCollection } from "@/lib/local-storage";
import { LookupSelect } from "@/components/lookup-select";

type Customer = { id: string; arabicName: string; passportNumber: string; dateOfBirth: string };
type Country = { id: string; nameAr: string };
type Plan = { id: string; name: string; price: string };

const steps = [
  { number: 1, title: "العميل", icon: UserRound },
  { number: 2, title: "الرحلة", icon: Plane },
  { number: 3, title: "التغطية", icon: ShieldCheck },
  { number: 4, title: "المراجعة", icon: FileText }
];

export function PolicyWizard({
  customers,
  countries,
  plans,
  policyTypes,
  coverageTypes,
  agentMode = false
}: {
  customers: Customer[];
  countries: Country[];
  plans: Plan[];
  policyTypes: { value: string; label: string }[];
  coverageTypes: { value: string; label: string }[];
  agentMode?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [localCustomers] = useLocalCollection("customers", customers);
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id ?? "");
  const [premium, setPremium] = useState<number | null>(null);
  const [review, setReview] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<{ policyNumber: string; qrCodeData?: string; id: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [passportImage, setPassportImage] = useState("");

  const selectedCustomer = useMemo(
    () => localCustomers.find((customer) => customer.id === selectedCustomerId),
    [localCustomers, selectedCustomerId]
  );

  function validateCurrentStep() {
    const form = formRef.current;
    if (!form) return false;
    const section = form.querySelector<HTMLElement>(`[data-step="${step}"]`);
    const controls = section?.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select");
    for (const control of controls ?? []) {
      if (!control.checkValidity()) {
        control.reportValidity();
        return false;
      }
    }
    return true;
  }

  function syncDuration() {
    const form = formRef.current;
    if (!form) return;
    const departure = new Date(String(new FormData(form).get("departureDate")));
    const returned = new Date(String(new FormData(form).get("returnDate")));
    if (!Number.isNaN(departure.getTime()) && !Number.isNaN(returned.getTime())) {
      const days = Math.max(1, Math.ceil((returned.getTime() - departure.getTime()) / 86400000) + 1);
      const input = form.elements.namedItem("numberOfDays") as HTMLInputElement | null;
      if (input) input.value = String(days);
    }
  }

  async function calculate() {
    const form = formRef.current;
    if (!form) return false;
    const formData = new FormData(form);
    const dateOfBirth = mode === "existing" ? selectedCustomer?.dateOfBirth : formData.get("dateOfBirth");
    setBusy(true);
    setError("");
    const response = await fetch("/api/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateOfBirth,
        numberOfDays: formData.get("numberOfDays"),
        destinationCountryId: formData.get("destinationCountryId"),
        coverageAmount: formData.get("coverageAmount"),
        coverageType: formData.get("coverageType"),
        travelPlanId: formData.get("travelPlanId")
      })
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(result.error ?? "تعذر حساب القسط");
      return false;
    }
    setPremium(result.premium);
    setReview(Object.fromEntries([...formData.entries()].map(([key, value]) => [key, String(value)])));
    return true;
  }

  async function next() {
    if (step === 2) syncDuration();
    if (!validateCurrentStep()) return;
    if (step === 3 && !(await calculate())) return;
    setStep((current) => Math.min(4, current + 1));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const body: Record<string, unknown> = Object.fromEntries(formData.entries());
    body.destinations = String(formData.get("destinations") ?? "")
      .split(",").map((item) => item.trim()).filter(Boolean);
    if (mode === "existing") {
      body.customerId = selectedCustomerId;
    } else {
      body.customer = {
        arabicName: formData.get("arabicName"),
        englishName: formData.get("englishName"),
        passportNumber: formData.get("passportNumber"),
        nationality: formData.get("nationality"),
        dateOfBirth: formData.get("dateOfBirth"),
        gender: formData.get("gender"),
        mobile: formData.get("mobile"),
        email: formData.get("email"),
        address: formData.get("address"),
        passportImage: formData.get("passportImage")
      };
    }
    setBusy(true);
    setError("");
    const response = await fetch("/api/policies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const policy = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(policy.error ?? "تعذر إصدار الوثيقة");
      return;
    }
    upsertLocalItem("policies", {
      id: policy.id,
      policyNumber: policy.policyNumber,
      customerName: policy.customer.arabicName,
      customerEmail: policy.customer.email ?? null,
      destinationName: policy.destinationCountry.nameAr,
      planName: policy.travelPlan.name,
      departureDate: new Date(policy.departureDate).toISOString(),
      returnDate: new Date(policy.returnDate).toISOString(),
      premium: String(policy.premium),
      coverageAmount: String(policy.coverageAmount),
      status: policy.status
    });
    upsertLocalItem("agency-policies", {
      id: policy.id,
      policyNumber: policy.policyNumber,
      customerName: policy.customer.arabicName,
      destinationName: policy.destinationCountry.nameAr,
      planName: policy.travelPlan.name,
      departureDate: new Date(policy.departureDate).toISOString(),
      returnDate: new Date(policy.returnDate).toISOString(),
      premium: String(policy.premium),
      status: policy.status
    });
    setCreated(policy);
    setStep(5);
  }

  if (created) {
    return (
      <Card className="mx-auto max-w-2xl overflow-hidden border-emerald-200 shadow-md">
        <div className="h-1.5 bg-gradient-to-l from-emerald-500 to-primary" />
        <CardContent className="p-8 text-center sm:p-12">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h2 className="text-2xl font-bold">تم إصدار الوثيقة بنجاح</h2>
          <p className="mt-2 text-sm text-muted-foreground">تم إنشاء الوثيقة وإضافتها إلى سجل الوثائق.</p>
          <div className="mx-auto mt-6 max-w-sm rounded-2xl border bg-muted/20 p-5">
            <p className="text-xs text-muted-foreground">رقم الوثيقة</p>
            <p className="mt-1 font-mono text-lg font-black text-primary" dir="ltr">{created.policyNumber}</p>
            {created.qrCodeData && <img alt="رمز التحقق QR" src={created.qrCodeData} className="mx-auto mt-4 h-36 w-36 rounded-lg bg-white p-2" />}
          </div>
          <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
            <Button asChild><Link href={agentMode ? "/customers" : "/policies"}>{agentMode ? <UserRound className="h-4 w-4" /> : <FileText className="h-4 w-4" />}{agentMode ? "العودة إلى العملاء" : "عرض الوثائق"}</Link></Button>
            <Button type="button" variant="outline" onClick={() => location.reload()}>إصدار وثيقة أخرى</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form ref={formRef} onSubmit={submit}>
      <Card className="mb-6 overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-4 gap-2">
            {steps.map((item) => {
              const Icon = item.icon;
              const active = step === item.number;
              const complete = step > item.number;
              return (
                <div key={item.number} className="relative text-center">
                  <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                    active ? "bg-primary text-white shadow-md" : complete ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                  }`}>
                    {complete ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <p className={`mt-2 text-xs font-medium sm:text-sm ${active ? "text-primary" : "text-muted-foreground"}`}>{item.title}</p>
                  {item.number < 4 && <div className={`absolute right-[calc(50%+24px)] top-5 hidden h-0.5 w-[calc(100%-48px)] sm:block ${complete ? "bg-emerald-300" : "bg-border"}`} />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-h-[460px] shadow-sm">
          <CardHeader className="border-b bg-muted/15">
            <CardTitle>{steps[step - 1]?.title ?? "مراجعة وإصدار الوثيقة"}</CardTitle>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <section data-step="1" hidden={step !== 1} className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setMode("existing")} className={`rounded-xl border p-4 text-right transition-colors ${mode === "existing" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/40"}`}>
                  <UserRound className="mb-2 h-5 w-5 text-primary" /><p className="font-semibold">عميل مسجل</p><p className="mt-1 text-xs text-muted-foreground">اختيار من قاعدة العملاء</p>
                </button>
                <button type="button" onClick={() => setMode("new")} className={`rounded-xl border p-4 text-right transition-colors ${mode === "new" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/40"}`}>
                  <UserPlus className="mb-2 h-5 w-5 text-primary" /><p className="font-semibold">عميل جديد</p><p className="mt-1 text-xs text-muted-foreground">إدخال بيانات عميل جديد</p>
                </button>
              </div>
              {mode === "existing" ? (
                <Select label="اختر العميل" name="customerId" value={selectedCustomerId} onChange={setSelectedCustomerId} required options={localCustomers.map((customer) => ({ label: `${customer.arabicName} — ${customer.passportNumber}`, value: customer.id }))} />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="الاسم العربي" name="arabicName" required />
                  <Field label="الاسم الإنجليزي" name="englishName" required dir="ltr" />
                  <Field label="رقم الجواز" name="passportNumber" required dir="ltr" />
                  <Field label="الجنسية" name="nationality" required />
                  <Field label="تاريخ الميلاد" name="dateOfBirth" type="date" required />
                  <Select label="الجنس" name="gender" required options={[{ label: "ذكر", value: "MALE" }, { label: "أنثى", value: "FEMALE" }]} />
                  <Field label="رقم الهاتف" name="mobile" required dir="ltr" />
                  <Field label="البريد الإلكتروني" name="email" type="email" dir="ltr" />
                  <Field label="العنوان" name="address" />
                  <div className="md:col-span-2">
                    <ImageUpload
                      name="passportImage"
                      label="صورة الجواز"
                      value={passportImage}
                      onChange={setPassportImage}
                    />
                  </div>
                </div>
              )}
            </section>

            <section data-step="2" hidden={step !== 2} className="grid gap-4 md:grid-cols-2">
              <div>
                <Select label="الدولة الرئيسية" name="destinationCountryId" required options={countries.map((country) => ({ label: country.nameAr, value: country.id }))} />
                {!agentMode ? <Link href="/countries" className="mt-1 inline-block text-xs font-semibold text-primary">+ إضافة وجهة جديدة</Link> : null}
              </div>
              <Field label="وجهات إضافية" name="destinations" placeholder="تركيا، الإمارات" />
              <Select label="غرض السفر" name="travelPurpose" required options={[
                { label: "سياحة", value: "TOURISM" }, { label: "عمل", value: "BUSINESS" },
                { label: "دراسة", value: "STUDY" }, { label: "علاج", value: "MEDICAL" },
                { label: "أخرى", value: "OTHER" }
              ]} />
              <div />
              <Field label="تاريخ المغادرة" name="departureDate" type="date" required onChange={syncDuration} />
              <Field label="تاريخ العودة" name="returnDate" type="date" required onChange={syncDuration} />
              <Field label="عدد أيام الرحلة" name="numberOfDays" type="number" min="1" required dir="ltr" />
            </section>

            <section data-step="3" hidden={step !== 3} className="grid gap-4 md:grid-cols-2">
              <Select label="مبلغ التغطية" name="coverageAmount" required options={[10000, 25000, 50000, 100000].map((value) => ({ label: formatCurrency(value), value: String(value) }))} />
              <LookupSelect label="نوع الوثيقة" name="policyType" category="POLICY_TYPE" initialOptions={policyTypes} required canAdd={!agentMode} />
              <LookupSelect label="نوع التغطية" name="coverageType" category="COVERAGE_TYPE" initialOptions={coverageTypes} required canAdd={!agentMode} />
              <div>
                <Select label="خطة السفر" name="travelPlanId" required options={plans.map((plan) => ({ label: `${plan.name} — ${formatCurrency(plan.price)}`, value: plan.id }))} />
                {!agentMode ? <Link href="/plans" className="mt-1 inline-block text-xs font-semibold text-primary">+ إضافة خطة سفر جديدة</Link> : null}
              </div>
              <Select label="حالة الوثيقة" name="status" required options={[
                { label: "فعالة", value: "ACTIVE" }, { label: "مسودة", value: "DRAFT" }
              ]} />
            </section>

            <section data-step="4" hidden={step !== 4} className="space-y-5">
              <div className="rounded-2xl bg-gradient-to-l from-primary to-cyan-700 p-6 text-white">
                <p className="text-sm text-white/75">قسط التأمين المستحق</p>
                <p className="mt-2 text-4xl font-black" dir="ltr">{premium !== null ? formatCurrency(premium) : "—"}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Summary label="العميل" value={mode === "existing" ? selectedCustomer?.arabicName : review.arabicName} />
                <Summary label="رقم الجواز" value={mode === "existing" ? selectedCustomer?.passportNumber : review.passportNumber} dir="ltr" />
                <Summary label="الوجهة" value={countries.find((item) => item.id === review.destinationCountryId)?.nameAr} />
                <Summary label="خطة السفر" value={plans.find((item) => item.id === review.travelPlanId)?.name} />
                <Summary label="فترة الرحلة" value={`${review.departureDate ?? ""} — ${review.returnDate ?? ""}`} dir="ltr" />
                <Summary label="مبلغ التغطية" value={review.coverageAmount ? formatCurrency(review.coverageAmount) : ""} dir="ltr" />
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                راجع البيانات أعلاه، ثم اضغط «إصدار الوثيقة» لإنشاء الرقم ورمز التحقق QR.
              </div>
            </section>

            {error && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
          </CardContent>
        </Card>

        <Card className="xl:sticky xl:top-24">
          <CardHeader><CardTitle className="text-base">إجراءات الإصدار</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {step < 4 && <Button type="button" className="w-full" onClick={next} disabled={busy || (mode === "existing" && !selectedCustomerId)}>{busy ? "جارٍ الحساب..." : "التالي"}<ArrowLeft className="h-4 w-4" /></Button>}
            {step === 4 && <Button type="submit" className="w-full" disabled={busy}>{busy ? "جارٍ إصدار الوثيقة..." : "إصدار الوثيقة"}<CheckCircle2 className="h-4 w-4" /></Button>}
            {step > 1 && <Button type="button" variant="outline" className="w-full" onClick={() => { setError(""); setStep((current) => current - 1); }} disabled={busy}><ArrowRight className="h-4 w-4" />السابق</Button>}
            <Button asChild type="button" variant="ghost" className="w-full"><Link href={agentMode ? "/customers" : "/policies"}>{agentMode ? "العودة إلى العملاء" : "العودة إلى الوثائق"}</Link></Button>
            <div className="border-t pt-4 text-xs leading-5 text-muted-foreground">
              يتم حساب القسط وفق عمر العميل، مدة الرحلة، الوجهة، مبلغ التغطية وخطة السفر.
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

function Field({ label, ...props }: React.ComponentProps<typeof Input> & { label: string }) {
  const id = props.id ?? props.name;
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input {...props} id={id} /></div>;
}

function Select({ label, options, onChange, ...props }: {
  label: string;
  options: { label: string; value: string }[];
  onChange?: (value: string) => void;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange">) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id ?? props.name}>{label}</Label>
      <select {...props} id={props.id ?? props.name} onChange={(event) => onChange?.(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </div>
  );
}

function Summary({ label, value, dir }: { label: string; value?: string; dir?: "ltr" | "rtl" }) {
  return <div className="rounded-xl border bg-muted/20 p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold" dir={dir}>{value || "—"}</p></div>;
}
