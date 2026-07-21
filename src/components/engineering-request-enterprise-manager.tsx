"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileSignature, FileText, Loader2, PencilLine, ReceiptText, Save, Stamp, Trash2, UploadCloud, X } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Asset = { url?: string; name?: string; uploadedByName?: string } | null;

type Props = {
  request: {
    id: string;
    customerFullName: string;
    customerMobile: string;
    customerEmail: string | null;
    customerNationalId: string | null;
    customerAddress: string | null;
    customerCity: string | null;
    projectName: string;
    projectType: string;
    projectLocation: string;
    contractValue: string;
    currency: string;
    insuranceType: string;
    startDate: string | null;
    endDate: string | null;
    contractorName: string | null;
    ownerName: string | null;
    riskDetails: string | null;
    coverageType: string | null;
    coverageNotes: string | null;
    insurancePremium: string;
    discount: string;
    additionalFees: string;
    taxes: string;
    netPremium: string;
    pricingCurrency: string;
    pricingNotes: string | null;
    policyTermsHtml: string | null;
    termsApprovedByName: string | null;
    underwriterSignature: Asset;
    managerSignature: Asset;
    companyStamp: Asset;
  };
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canEditPricing: boolean;
    canEditTerms: boolean;
    canApproveTerms: boolean;
    canUploadUnderwriterSignature: boolean;
    canUploadManagerAssets: boolean;
  };
};

export function EngineeringRequestEnterpriseManager({ request, permissions }: Props) {
  const router = useRouter();
  const termsRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activePanel, setActivePanel] = useState<"pricing" | "terms" | "assets" | "edit" | null>(null);

  async function submitJson(endpoint: string, body: unknown, successMessage: string, method = "PATCH") {
    setBusy(endpoint);
    setError("");
    setMessage("");
    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const result = await response.json().catch(() => null);
    setBusy(null);
    if (!response.ok || result?.success === false) {
      setError(result?.error ?? "تعذر حفظ البيانات.");
      return;
    }
    setMessage(successMessage);
    setActivePanel(null);
    router.refresh();
  }

  async function savePricing(formData: FormData) {
    await submitJson(`/api/engineering-requests/${request.id}/pricing`, {
      insurancePremium: formData.get("insurancePremium"),
      discount: formData.get("discount"),
      additionalFees: formData.get("additionalFees"),
      taxes: formData.get("taxes"),
      currency: formData.get("currency"),
      notes: formData.get("pricingNotes")
    }, "تم تحديث التسعير.");
  }

  async function saveTerms(approve = false) {
    await submitJson(`/api/engineering-requests/${request.id}/terms`, {
      html: termsRef.current?.innerHTML ?? "",
      approve
    }, approve ? "تم اعتماد الشروط." : "تم حفظ الشروط.");
  }

  async function saveEdit(formData: FormData) {
    await submitJson(`/api/engineering-requests/${request.id}`, {
      customer: {
        fullName: formData.get("customerFullName"),
        mobile: formData.get("customerMobile"),
        email: formData.get("customerEmail"),
        nationalId: formData.get("customerNationalId"),
        address: formData.get("customerAddress"),
        city: formData.get("customerCity")
      },
      project: {
        name: formData.get("projectName"),
        type: formData.get("projectType"),
        location: formData.get("projectLocation"),
        contractValue: formData.get("contractValue"),
        currency: formData.get("currency"),
        insuranceType: formData.get("insuranceType"),
        startDate: dateValue(formData.get("startDate")),
        endDate: dateValue(formData.get("endDate")),
        contractorName: formData.get("contractorName"),
        ownerName: formData.get("ownerName"),
        riskDetails: formData.get("riskDetails")
      },
      coverageType: formData.get("coverageType"),
      coverageNotes: formData.get("coverageNotes"),
      notes: formData.get("notes")
    }, "تم حفظ التعديلات.", "PUT");
  }

  async function uploadAsset(kind: "underwriterSignature" | "managerSignature" | "companyStamp", file?: File) {
    if (!file) return;
    setBusy(kind);
    setError("");
    setMessage("");
    const formData = new FormData();
    formData.append("kind", kind);
    formData.append("file", file);
    const response = await fetch(`/api/engineering-requests/${request.id}/assets`, { method: "POST", body: formData });
    const result = await response.json().catch(() => null);
    setBusy(null);
    if (!response.ok || result?.success !== true) {
      setError(result?.error ?? "تعذر رفع الملف.");
      return;
    }
    setMessage("تم رفع الملف.");
    router.refresh();
  }

  async function deleteRequest() {
    if (!confirm("هل تريد حذف الطلب نهائياً؟")) return;
    setBusy("delete");
    const response = await fetch(`/api/engineering-requests/${request.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => null);
    setBusy(null);
    if (!response.ok || result?.success !== true) {
      setError(result?.error ?? "تعذر حذف الطلب.");
      return;
    }
    router.push("/engineering-requests");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">{error}</div> : null}

      <div className="grid gap-3">
        {permissions.canEditPricing ? <ActionCard icon={ReceiptText} title="التسعير" description={`صافي القسط: ${request.netPremium} ${request.pricingCurrency}`} onOpen={() => setActivePanel("pricing")} /> : null}
        {permissions.canEditTerms ? <ActionCard icon={FileText} title="الشروط الخاصة" description={request.termsApprovedByName ? `معتمدة من ${request.termsApprovedByName}` : "إنشاء وتعديل واعتماد شروط الوثيقة."} onOpen={() => setActivePanel("terms")} /> : null}
        {(permissions.canUploadUnderwriterSignature || permissions.canUploadManagerAssets) ? <ActionCard icon={FileSignature} title="التواقيع والختم" description="رفع توقيع المكتتب، توقيع المدير، وختم الشركة." onOpen={() => setActivePanel("assets")} /> : null}
        {permissions.canEdit ? <ActionCard icon={PencilLine} title="تعديل الطلب" description="تحديث بيانات العميل والمشروع والتغطية." onOpen={() => setActivePanel("edit")} /> : null}
      </div>

      {permissions.canDelete ? (
        <Button type="button" variant="destructive" className="w-full" disabled={busy === "delete"} onClick={deleteRequest}>
          {busy === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          حذف الطلب
        </Button>
      ) : null}

      <PanelDialog open={activePanel === "pricing"} onOpenChange={(open) => setActivePanel(open ? "pricing" : null)} title="التسعير" description="تحديث القسط والخصومات والرسوم والضرائب.">
        <form action={savePricing} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <MoneyField label="قسط التأمين" name="insurancePremium" defaultValue={request.insurancePremium} />
            <MoneyField label="الخصم" name="discount" defaultValue={request.discount} />
            <MoneyField label="رسوم إضافية" name="additionalFees" defaultValue={request.additionalFees} />
            <MoneyField label="الضرائب" name="taxes" defaultValue={request.taxes} />
            <Field label="العملة" name="currency" defaultValue={request.pricingCurrency} />
          </div>
          <Textarea label="ملاحظات التسعير" name="pricingNotes" defaultValue={request.pricingNotes ?? ""} />
          <Button className="w-full" disabled={Boolean(busy)}><Save className="h-4 w-4" />حفظ التسعير</Button>
        </form>
      </PanelDialog>

      <PanelDialog open={activePanel === "terms"} onOpenChange={(open) => setActivePanel(open ? "terms" : null)} title="الشروط الخاصة" description="تحرير النص الذي يظهر ضمن وثيقة التأمين.">
        <div className="space-y-4">
          <div ref={termsRef} contentEditable suppressContentEditableWarning className="min-h-56 rounded-md border bg-background p-3 text-sm leading-7 outline-none focus-visible:ring-2 focus-visible:ring-ring" dangerouslySetInnerHTML={{ __html: request.policyTermsHtml ?? "" }} />
          <Button type="button" className="w-full" disabled={Boolean(busy)} onClick={() => saveTerms(false)}><Save className="h-4 w-4" />حفظ الشروط</Button>
          {permissions.canApproveTerms ? <Button type="button" variant="outline" className="w-full" disabled={Boolean(busy)} onClick={() => saveTerms(true)}><CheckCircle2 className="h-4 w-4" />اعتماد الشروط</Button> : null}
        </div>
      </PanelDialog>

      <PanelDialog open={activePanel === "assets"} onOpenChange={(open) => setActivePanel(open ? "assets" : null)} title="التواقيع والختم" description="رفع الأصول الرقمية الخاصة بالموافقات.">
        <div className="grid gap-3">
          {permissions.canUploadUnderwriterSignature ? <AssetUpload label="توقيع المكتتب" kind="underwriterSignature" asset={request.underwriterSignature} busy={busy} onUpload={uploadAsset} /> : null}
          {permissions.canUploadManagerAssets ? <AssetUpload label="توقيع المدير العام" kind="managerSignature" asset={request.managerSignature} busy={busy} onUpload={uploadAsset} /> : null}
          {permissions.canUploadManagerAssets ? <AssetUpload label="ختم الشركة" kind="companyStamp" asset={request.companyStamp} busy={busy} onUpload={uploadAsset} icon={<Stamp className="h-4 w-4" />} /> : null}
        </div>
      </PanelDialog>

      <PanelDialog open={activePanel === "edit"} onOpenChange={(open) => setActivePanel(open ? "edit" : null)} title="تعديل الطلب" description="تعديل بيانات الطلب مع حفظ سجل التغييرات.">
        <form action={saveEdit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="اسم العميل" name="customerFullName" defaultValue={request.customerFullName} />
            <Field label="الهاتف" name="customerMobile" defaultValue={request.customerMobile} />
            <Field label="البريد الإلكتروني" name="customerEmail" defaultValue={request.customerEmail ?? ""} />
            <Field label="الرقم الوطني" name="customerNationalId" defaultValue={request.customerNationalId ?? ""} />
            <Field label="العنوان" name="customerAddress" defaultValue={request.customerAddress ?? ""} />
            <Field label="المدينة" name="customerCity" defaultValue={request.customerCity ?? ""} />
            <Field label="اسم المشروع" name="projectName" defaultValue={request.projectName} />
            <Field label="نوع المشروع" name="projectType" defaultValue={request.projectType} />
            <Field label="موقع المشروع" name="projectLocation" defaultValue={request.projectLocation} />
            <MoneyField label="قيمة العقد" name="contractValue" defaultValue={request.contractValue} />
            <Field label="عملة العقد" name="currency" defaultValue={request.currency} />
            <Field label="نوع التأمين" name="insuranceType" defaultValue={request.insuranceType} />
            <Field label="تاريخ البداية" name="startDate" type="date" defaultValue={request.startDate?.slice(0, 10) ?? ""} />
            <Field label="تاريخ النهاية" name="endDate" type="date" defaultValue={request.endDate?.slice(0, 10) ?? ""} />
            <Field label="اسم المقاول" name="contractorName" defaultValue={request.contractorName ?? ""} />
            <Field label="اسم المالك" name="ownerName" defaultValue={request.ownerName ?? ""} />
            <Field label="نوع التغطية" name="coverageType" defaultValue={request.coverageType ?? ""} />
          </div>
          <Textarea label="تفاصيل المخاطر" name="riskDetails" defaultValue={request.riskDetails ?? ""} />
          <Textarea label="ملاحظات التغطية" name="coverageNotes" defaultValue={request.coverageNotes ?? ""} />
          <Textarea label="ملاحظات إضافية" name="notes" defaultValue="" />
          <Button className="w-full" disabled={Boolean(busy)}><Save className="h-4 w-4" />حفظ الطلب</Button>
        </form>
      </PanelDialog>
    </div>
  );
}

function dateValue(value: FormDataEntryValue | null) {
  return typeof value === "string" && value ? new Date(value).toISOString() : "";
}

function ActionCard({ icon: Icon, title, description, onOpen }: { icon: typeof ReceiptText; title: string; description: string; onOpen: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black">{title}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <Button type="button" size="sm" variant="outline" onClick={onOpen}>فتح</Button>
    </div>
  );
}

function PanelDialog({ open, onOpenChange, title, description, children }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; children: React.ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-slate-950/55 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[81] max-h-[88vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl focus:outline-none">
          <div className="flex items-start justify-between gap-4 border-b bg-muted/20 p-5">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-black">{title}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm leading-6 text-muted-foreground">{description}</Dialog.Description>
            </div>
            <Dialog.Close asChild><button className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="إغلاق"><X className="h-4 w-4" /></button></Dialog.Close>
          </div>
          <div className="max-h-[calc(88vh-104px)] overflow-y-auto p-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field(props: React.ComponentProps<typeof Input> & { label: string }) {
  const { label, ...inputProps } = props;
  return <div className="space-y-1.5"><Label>{label}</Label><Input {...inputProps} /></div>;
}

function MoneyField(props: React.ComponentProps<typeof Input> & { label: string }) {
  return <Field {...props} type="number" min="0" step="0.01" dir="ltr" />;
}

function Textarea({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return <div className="space-y-1.5"><Label>{label}</Label><textarea name={name} defaultValue={defaultValue} rows={4} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>;
}

function AssetUpload({ label, kind, asset, busy, icon, onUpload }: { label: string; kind: "underwriterSignature" | "managerSignature" | "companyStamp"; asset: Asset; busy: string | null; icon?: React.ReactNode; onUpload: (kind: "underwriterSignature" | "managerSignature" | "companyStamp", file?: File) => void }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <Label className="text-xs font-bold">{label}</Label>
      {asset?.url ? <p className="mt-1 truncate text-xs text-muted-foreground">{asset.name}</p> : null}
      <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-3 text-xs font-bold hover:border-primary">
        {busy === kind ? <Loader2 className="h-4 w-4 animate-spin" /> : icon ?? <UploadCloud className="h-4 w-4" />}
        رفع
        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => onUpload(kind, event.target.files?.[0])} />
      </label>
    </div>
  );
}
