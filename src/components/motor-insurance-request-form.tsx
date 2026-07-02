"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Send,
  Trash2,
  UploadCloud
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { StoredImage } from "@/components/stored-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteStoredFile, storeFile } from "@/lib/file-storage";
import { cn } from "@/lib/utils";

type Locale = "ar" | "en";
type VehicleImage = { id: string; category: string; name: string; size: number; type: string };
type CustomerDocument = { key: string; label: string; id: string; name: string; size: number; type: string };
type ReviewValues = {
  fullName: string;
  manufacturer: string;
  model: string;
  manufacturingYear: string;
};

const maxFileSize = 5 * 1024 * 1024;
const imageTypes = ["image/jpeg", "image/png", "image/webp"];
const documentTypes = [...imageTypes, "application/pdf"];

const vehicleCategories = ["Front", "Rear", "Left Side", "Right Side", "Interior / Additional"];
const documentSlots = [
  { key: "nationalIdFront", ar: "البطاقة الوطنية - الوجه الأمامي", en: "National ID Front" },
  { key: "nationalIdBack", ar: "البطاقة الوطنية - الوجه الخلفي", en: "National ID Back" },
  { key: "drivingLicense", ar: "إجازة السوق", en: "Driving License" },
  { key: "vehicleRegistration", ar: "سنوية المركبة", en: "Vehicle Registration" },
  { key: "residenceCardFront", ar: "بطاقة السكن - الوجه الأمامي", en: "Residence Card Front" },
  { key: "residenceCardBack", ar: "بطاقة السكن - الوجه الخلفي", en: "Residence Card Back" }
];

const copy = {
  ar: {
    title: "طلب تأمين مركبة",
    subtitle: "نموذج إرسال طلب تأمين مركبة للوكلاء. هذا الطلب لا يصدر وثيقة تأمين.",
    language: "English",
    customer: "معلومات العميل",
    vehicle: "معلومات المركبة",
    images: "صور المركبة",
    documents: "مستندات العميل",
    notes: "ملاحظات إضافية",
    submit: "إرسال الطلب",
    draft: "حفظ مسودة",
    success: "تم إرسال الطلب بنجاح",
    requestNumber: "رقم الطلب",
    status: "الحالة الحالية",
    viewRequest: "عرض الطلب",
    newRequest: "طلب جديد",
    addImages: "اسحب الصور هنا أو اضغط للاختيار",
    imageHelp: "JPG أو PNG أو WEBP بحد أقصى 5 MB لكل ملف. الحد الأدنى 5 صور.",
    replace: "استبدال",
    remove: "حذف",
    validation: "يرجى إكمال الحقول المطلوبة، رفع 5 صور للمركبة، وإرفاق جميع المستندات.",
    duplicate: "جاري معالجة الطلب بالفعل.",
    submitted: "Submitted",
    draftStatus: "Draft",
    agentLocked: "يتم ربط الطلب بالوكيل المسجل دخولياً ولا يمكن تعديل رقم الوكيل من النموذج.",
    reviewSummary: "Review Summary",
    summaryCustomer: "Customer",
    summaryVehicle: "Vehicle",
    summaryImages: "Vehicle images",
    summaryDocuments: "Customer documents",
    fields: {
      fullName: "الاسم الكامل",
      mobile: "رقم الهاتف",
      email: "البريد الإلكتروني (اختياري)",
      nationalId: "رقم البطاقة الوطنية",
      address: "العنوان",
      city: "المدينة",
      vehicleType: "نوع المركبة",
      manufacturer: "الشركة المصنعة",
      model: "الطراز",
      manufacturingYear: "سنة الصنع",
      color: "اللون",
      plateNumber: "رقم اللوحة",
      chassisNumber: "رقم الشاصي",
      engineNumber: "رقم المحرك",
      estimatedVehicleValue: "القيمة التقديرية للمركبة",
      notes: "اكتب أي ملاحظات مهمة للمعاينة أو الاكتتاب"
    }
  },
  en: {
    title: "Motor Insurance Request",
    subtitle: "Agent request submission for vehicle insurance. This page does not issue a policy.",
    language: "العربية",
    customer: "Customer Information",
    vehicle: "Vehicle Information",
    images: "Vehicle Images",
    documents: "Customer Documents",
    notes: "Additional Notes",
    submit: "Submit Request",
    draft: "Save Draft",
    success: "Submitted Successfully",
    requestNumber: "Request Number",
    status: "Current Status",
    viewRequest: "View Request",
    newRequest: "Create New Request",
    addImages: "Drop photos here or click to choose",
    imageHelp: "JPG, PNG, or WEBP up to 5 MB each. Minimum 5 photos.",
    replace: "Replace",
    remove: "Delete",
    validation: "Complete required fields, upload 5 vehicle images, and attach all required documents.",
    duplicate: "This request is already being processed.",
    submitted: "Submitted",
    draftStatus: "Draft",
    agentLocked: "The request is assigned automatically to the logged-in agent and cannot be changed from this form.",
    reviewSummary: "Review Summary",
    summaryCustomer: "Customer",
    summaryVehicle: "Vehicle",
    summaryImages: "Vehicle images",
    summaryDocuments: "Customer documents",
    fields: {
      fullName: "Full Name",
      mobile: "Mobile Number",
      email: "Email (Optional)",
      nationalId: "National ID Number",
      address: "Address",
      city: "City",
      vehicleType: "Vehicle Type",
      manufacturer: "Manufacturer",
      model: "Model",
      manufacturingYear: "Manufacturing Year",
      color: "Color",
      plateNumber: "Plate Number",
      chassisNumber: "Chassis Number",
      engineNumber: "Engine Number",
      estimatedVehicleValue: "Estimated Vehicle Value",
      notes: "Add inspection or underwriting notes"
    }
  }
} as const;

export function MotorInsuranceRequestForm() {
  const [locale, setLocale] = useState<Locale>("ar");
  const [vehicleImages, setVehicleImages] = useState<VehicleImage[]>([]);
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ id: string; requestNumber: string; status: string } | null>(null);
  const [submissionToken, setSubmissionToken] = useState(() => crypto.randomUUID());
  const [reviewValues, setReviewValues] = useState<ReviewValues>({
    fullName: "",
    manufacturer: "",
    model: "",
    manufacturingYear: ""
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intentRef = useRef<"draft" | "submit">("submit");
  const t = copy[locale];
  const dir = locale === "ar" ? "rtl" : "ltr";
  const uploadedDocumentCount = documentSlots.filter((slot) => documents.some((document) => document.key === slot.key)).length;
  const vehicleSummary = [reviewValues.manufacturer, reviewValues.model, reviewValues.manufacturingYear].filter(Boolean).join(" ");

  const completedSections = useMemo(() => {
    let completed = 0;
    if (vehicleImages.length >= 5) completed += 1;
    if (documentSlots.every((slot) => documents.some((document) => document.key === slot.key))) completed += 1;
    return completed;
  }, [documents, vehicleImages.length]);

  async function addVehicleFiles(files: FileList | File[]) {
    setError("");
    const accepted = Array.from(files).filter((file) => {
      if (!imageTypes.includes(file.type)) return false;
      return file.size <= maxFileSize;
    });
    if (accepted.length !== Array.from(files).length) setError(t.imageHelp);

    const stored = await Promise.all(accepted.map(async (file, index) => {
      const record = await storeFile(file);
      return {
        id: record.id,
        category: vehicleCategories[(vehicleImages.length + index) % vehicleCategories.length],
        name: record.name,
        size: record.size,
        type: record.type
      };
    }));
    setVehicleImages((current) => [...current, ...stored]);
  }

  async function removeVehicleImage(image: VehicleImage) {
    if (image.id.startsWith("idb://")) await deleteStoredFile(image.id);
    setVehicleImages((current) => current.filter((item) => item.id !== image.id));
  }

  async function replaceVehicleImage(image: VehicleImage, file?: File) {
    if (!file) return;
    if (!imageTypes.includes(file.type) || file.size > maxFileSize) {
      setError(t.imageHelp);
      return;
    }
    if (image.id.startsWith("idb://")) await deleteStoredFile(image.id);
    const record = await storeFile(file);
    setVehicleImages((current) => current.map((item) => item.id === image.id ? {
      ...item,
      id: record.id,
      name: record.name,
      size: record.size,
      type: record.type
    } : item));
  }

  async function upsertDocument(slot: (typeof documentSlots)[number], file?: File) {
    if (!file) return;
    setError("");
    if (!documentTypes.includes(file.type) || file.size > maxFileSize) {
      setError("Invalid file type or size. Use JPG, PNG, WEBP, or PDF up to 5 MB.");
      return;
    }
    const existing = documents.find((document) => document.key === slot.key);
    if (existing?.id.startsWith("idb://")) await deleteStoredFile(existing.id);
    const record = await storeFile(file);
    setDocuments((current) => [
      ...current.filter((document) => document.key !== slot.key),
      { key: slot.key, label: locale === "ar" ? slot.ar : slot.en, id: record.id, name: record.name, size: record.size, type: record.type }
    ]);
  }

  async function removeDocument(document: CustomerDocument) {
    if (document.id.startsWith("idb://")) await deleteStoredFile(document.id);
    setDocuments((current) => current.filter((item) => item.key !== document.key));
  }

  function validate(form: HTMLFormElement) {
    if (!form.checkValidity()) {
      form.reportValidity();
      return false;
    }
    if (vehicleImages.length < 5) return false;
    if (!documentSlots.every((slot) => documents.some((document) => document.key === slot.key))) return false;
    return true;
  }

  function updateReviewValues(form: HTMLFormElement) {
    const data = new FormData(form);
    setReviewValues({
      fullName: formString(data, "fullName"),
      manufacturer: formString(data, "manufacturer"),
      model: formString(data, "model"),
      manufacturingYear: formString(data, "manufacturingYear")
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>, intent: "draft" | "submit") {
    event.preventDefault();
    if (busy) {
      setError(t.duplicate);
      return;
    }
    const form = event.currentTarget;
    if (!validate(form)) {
      setError(t.validation);
      return;
    }
    const data = new FormData(form);
    setBusy(true);
    setError("");
    const response = await fetch("/api/motor-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionToken,
        intent,
        customer: {
          fullName: data.get("fullName"),
          mobile: data.get("mobile"),
          email: data.get("email"),
          nationalId: data.get("nationalId"),
          address: data.get("address"),
          city: data.get("city")
        },
        vehicle: {
          vehicleType: data.get("vehicleType"),
          manufacturer: data.get("manufacturer"),
          model: data.get("model"),
          manufacturingYear: data.get("manufacturingYear"),
          color: data.get("color"),
          plateNumber: data.get("plateNumber"),
          chassisNumber: data.get("chassisNumber"),
          engineNumber: data.get("engineNumber"),
          estimatedVehicleValue: data.get("estimatedVehicleValue")
        },
        vehicleImages,
        documents,
        notes: data.get("notes")
      })
    });
    const result = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok || result?.success !== true) {
      setError(result?.error ?? result?.message ?? t.validation);
      return;
    }
    setSuccess({ id: result.requestId, requestNumber: result.requestNumber, status: result.status });
  }

  function reset() {
    setSuccess(null);
    setVehicleImages([]);
    setDocuments([]);
    setError("");
    setReviewValues({ fullName: "", manufacturer: "", model: "", manufacturingYear: "" });
    setSubmissionToken(crypto.randomUUID());
  }

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl" dir={dir}>
        <Card className="overflow-hidden border-emerald-200 shadow-md dark:border-emerald-900/60">
          <div className="h-1.5 bg-gradient-to-l from-emerald-500 to-primary" />
          <CardContent className="p-8 text-center sm:p-12">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h2 className="text-2xl font-black">{t.success}</h2>
            <div className="mx-auto mt-6 max-w-sm rounded-lg border bg-muted/20 p-5">
              <p className="text-xs text-muted-foreground">{t.requestNumber}</p>
              <p className="mt-1 font-mono text-xl font-black text-primary" dir="ltr">{success.requestNumber}</p>
              <p className="mt-4 text-xs text-muted-foreground">{t.status}</p>
              <p className="mt-1 font-bold">{success.status === "DRAFT" ? t.draftStatus : t.submitted}</p>
            </div>
            <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
              <Button asChild><Link href={`/motor-requests/${success.id}`}><FileText className="h-4 w-4" />{t.viewRequest}</Link></Button>
              <Button type="button" variant="outline" onClick={reset}><Plus className="h-4 w-4" />{t.newRequest}</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <form dir={dir} onInput={(event) => updateReviewValues(event.currentTarget)} onSubmit={(event) => submit(event, intentRef.current)} className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 text-sm font-semibold text-primary">TRINSU</div>
          <h1 className="text-2xl font-black tracking-normal text-slate-950 dark:text-foreground sm:text-3xl">{t.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button type="button" variant="outline" onClick={() => setLocale(locale === "ar" ? "en" : "ar")} className="w-fit">
          {t.language}
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-6">
            {[t.customer, t.vehicle, t.images, t.documents, t.notes, t.submit].map((label, index) => {
              const active = index < 2 || (index === 2 && vehicleImages.length >= 5) || (index === 3 && completedSections >= 2);
              return (
                <div key={label} className="flex items-center gap-2 rounded-lg border bg-muted/10 p-3">
                  <span className={cn("grid h-8 w-8 place-items-center rounded-full text-xs font-black", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    {active ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  <span className="min-w-0 truncate text-xs font-bold sm:text-sm">{label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Section title={t.customer}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t.fields.fullName} name="fullName" required />
              <Field label={t.fields.mobile} name="mobile" required dir="ltr" />
              <Field label={t.fields.email} name="email" type="email" dir="ltr" />
              <Field label={t.fields.nationalId} name="nationalId" required dir="ltr" />
              <Field label={t.fields.address} name="address" required />
              <Field label={t.fields.city} name="city" required />
            </div>
          </Section>

          <Section title={t.vehicle}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t.fields.vehicleType} name="vehicleType" required />
              <Field label={t.fields.manufacturer} name="manufacturer" required />
              <Field label={t.fields.model} name="model" required />
              <Field label={t.fields.manufacturingYear} name="manufacturingYear" type="number" min="1950" max={new Date().getFullYear() + 1} required dir="ltr" />
              <Field label={t.fields.color} name="color" required />
              <Field label={t.fields.plateNumber} name="plateNumber" required dir="ltr" />
              <Field label={t.fields.chassisNumber} name="chassisNumber" required dir="ltr" />
              <Field label={t.fields.engineNumber} name="engineNumber" required dir="ltr" />
              <Field label={t.fields.estimatedVehicleValue} name="estimatedVehicleValue" type="number" min="1" required dir="ltr" />
            </div>
          </Section>

          <Section title={t.images}>
            <input ref={fileInputRef} type="file" accept={imageTypes.join(",")} multiple className="sr-only" onChange={(event) => event.target.files && addVehicleFiles(event.target.files)} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDrop={(event) => {
                event.preventDefault();
                addVehicleFiles(event.dataTransfer.files);
              }}
              onDragOver={(event) => event.preventDefault()}
              className="flex min-h-36 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/10 p-6 text-center transition-colors hover:border-primary/60 hover:bg-primary/5"
            >
              <UploadCloud className="mb-3 h-8 w-8 text-primary" />
              <span className="text-sm font-bold">{t.addImages}</span>
              <span className="mt-1 text-xs text-muted-foreground">{t.imageHelp}</span>
            </button>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {vehicleImages.map((image) => (
                <VehicleImageCard
                  key={image.id}
                  image={image}
                  replace={t.replace}
                  remove={t.remove}
                  onCategoryChange={(category) => setVehicleImages((current) => current.map((item) => item.id === image.id ? { ...item, category } : item))}
                  onReplace={(file) => replaceVehicleImage(image, file)}
                  onRemove={() => removeVehicleImage(image)}
                />
              ))}
            </div>
          </Section>

          <Section title={t.documents}>
            <div className="grid gap-4 md:grid-cols-2">
              {documentSlots.map((slot) => {
                const document = documents.find((item) => item.key === slot.key);
                const label = locale === "ar" ? slot.ar : slot.en;
                return (
                  <DocumentUpload
                    key={slot.key}
                    label={label}
                    document={document}
                    replace={t.replace}
                    remove={t.remove}
                    onUpload={(file) => upsertDocument(slot, file)}
                    onRemove={() => document && removeDocument(document)}
                  />
                );
              })}
            </div>
          </Section>

          <Section title={t.notes}>
            <Label htmlFor="notes" className="sr-only">{t.notes}</Label>
            <textarea
              id="notes"
              name="notes"
              rows={7}
              placeholder={t.fields.notes}
              className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring dark:border-border dark:bg-slate-900/40"
            />
          </Section>
        </div>

        <Card className="h-fit xl:sticky xl:top-24">
          <CardHeader><CardTitle className="text-base">{t.submit}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border bg-muted/15 p-3 text-xs leading-5 text-muted-foreground">{t.agentLocked}</div>
            <div className="rounded-lg border bg-muted/10 p-3">
              <p className="mb-3 text-xs font-black uppercase tracking-normal text-muted-foreground">{t.reviewSummary}</p>
              <div className="space-y-2">
                <SummaryRow label={t.summaryCustomer} value={reviewValues.fullName || "-"} />
                <SummaryRow label={t.summaryVehicle} value={vehicleSummary || "-"} dir="ltr" />
                <SummaryRow label={t.summaryImages} value={`${vehicleImages.length} / 5`} dir="ltr" />
                <SummaryRow label={t.summaryDocuments} value={`${uploadedDocumentCount} / ${documentSlots.length}`} dir="ltr" />
              </div>
            </div>
            {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">{error}</div> : null}
            <Button type="submit" variant="outline" className="w-full" disabled={busy} onClick={() => { intentRef.current = "draft"; }}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t.draft}
            </Button>
            <Button type="submit" className="w-full" disabled={busy} onClick={() => { intentRef.current = "submit"; }}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {t.submit}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </form>
  );
}

function SummaryRow({ label, value, dir }: Readonly<{ label: string; value: string; dir?: "ltr" | "rtl" }>) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[55%] truncate text-right font-bold" dir={dir}>{value}</span>
    </div>
  );
}

function formString(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="border-b bg-muted/10">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">{children}</CardContent>
    </Card>
  );
}

function Field({ label, ...props }: React.ComponentProps<typeof Input> & { label: string }) {
  const id = props.id ?? props.name;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input {...props} id={id} />
    </div>
  );
}

function VehicleImageCard({
  image,
  replace,
  remove,
  onCategoryChange,
  onReplace,
  onRemove
}: {
  image: VehicleImage;
  replace: string;
  remove: string;
  onCategoryChange: (category: string) => void;
  onReplace: (file?: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <input ref={inputRef} type="file" accept={imageTypes.join(",")} className="sr-only" onChange={(event) => onReplace(event.target.files?.[0])} />
      <StoredImage source={image.id} alt={image.category} className="h-36 w-full bg-white object-contain dark:bg-slate-950" />
      <div className="space-y-2 border-t p-3">
        <select
          value={image.category}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="h-9 w-full rounded-md border bg-background px-2 text-xs"
        >
          {vehicleCategories.map((category) => <option key={category}>{category}</option>)}
        </select>
        <span className="block truncate text-xs text-muted-foreground">{image.name}</span>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
            <RotateCcw className="h-4 w-4" />
            {replace}
          </Button>
          <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
            {remove}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DocumentUpload({
  label,
  document,
  replace,
  remove,
  onUpload,
  onRemove
}: {
  label: string;
  document?: CustomerDocument;
  replace: string;
  remove: string;
  onUpload: (file?: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="rounded-lg border bg-muted/10 p-3">
      <input ref={inputRef} type="file" accept={documentTypes.join(",")} className="sr-only" onChange={(event) => onUpload(event.target.files?.[0])} />
      <div className="mb-3 flex items-center justify-between gap-3">
        <Label className="text-sm font-bold">{label}</Label>
        {document ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
      </div>
      {document ? (
        <div className="space-y-3">
          {document.type.startsWith("image/") ? (
            <StoredImage source={document.id} alt={document.label} className="h-32 w-full rounded-md bg-white object-contain dark:bg-slate-950" />
          ) : (
            <div className="flex items-center gap-3 rounded-md bg-background p-3">
              <FileText className="h-5 w-5 text-primary" />
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{document.name}</span>
            </div>
          )}
          {document.type.startsWith("image/") ? <p className="truncate text-xs text-muted-foreground">{document.name}</p> : null}
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
              <RotateCcw className="h-4 w-4" />
              {replace}
            </Button>
            <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onRemove}>
              <Trash2 className="h-4 w-4" />
              {remove}
            </Button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} className="grid min-h-28 w-full place-items-center rounded-md border border-dashed bg-background/60 text-sm font-semibold text-muted-foreground hover:border-primary/60 hover:text-primary">
          <span className="flex items-center gap-2"><UploadCloud className="h-4 w-4" />Upload</span>
        </button>
      )}
    </div>
  );
}
