"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Download, Loader2, Save, Stamp, Trash2, UploadCloud } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Asset = { url?: string; name?: string; uploadedByName?: string } | null;

type Props = {
  request: {
    id: string;
    requestNumber: string;
    customerFullName: string;
    customerMobile: string;
    customerEmail: string | null;
    customerNationalId: string;
    customerAddress: string;
    customerCity: string;
    vehicleType: string;
    manufacturer: string;
    model: string;
    manufacturingYear: number;
    color: string;
    plateNumber: string;
    chassisNumber: string;
    engineNumber: string;
    estimatedVehicleValue: string;
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
    termsApprovedAt: string | null;
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

export function MotorRequestEnterpriseManager({ request, permissions }: Props) {
  const router = useRouter();
  const termsRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

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
    router.refresh();
  }

  async function savePricing(formData: FormData) {
    await submitJson(`/api/motor-requests/${request.id}/pricing`, {
      insurancePremium: formData.get("insurancePremium"),
      discount: formData.get("discount"),
      additionalFees: formData.get("additionalFees"),
      taxes: formData.get("taxes"),
      currency: formData.get("currency"),
      notes: formData.get("pricingNotes")
    }, "تم تحديث التسعير.");
  }

  async function saveTerms(approve = false) {
    await submitJson(`/api/motor-requests/${request.id}/terms`, {
      html: termsRef.current?.innerHTML ?? "",
      approve
    }, approve ? "تم اعتماد الشروط." : "تم حفظ الشروط.");
  }

  async function saveEdit(formData: FormData) {
    await submitJson(`/api/motor-requests/${request.id}`, {
      customer: {
        fullName: formData.get("customerFullName"),
        mobile: formData.get("customerMobile"),
        email: formData.get("customerEmail"),
        nationalId: formData.get("customerNationalId"),
        address: formData.get("customerAddress"),
        city: formData.get("customerCity")
      },
      vehicle: {
        vehicleType: formData.get("vehicleType"),
        manufacturer: formData.get("manufacturer"),
        model: formData.get("model"),
        manufacturingYear: formData.get("manufacturingYear"),
        color: formData.get("color"),
        plateNumber: formData.get("plateNumber"),
        chassisNumber: formData.get("chassisNumber"),
        engineNumber: formData.get("engineNumber"),
        estimatedVehicleValue: formData.get("estimatedVehicleValue")
      },
      coverageType: formData.get("coverageType"),
      coverageNotes: formData.get("coverageNotes")
    }, "تم حفظ التعديلات.", "PUT");
  }

  async function uploadAsset(kind: "underwriterSignature" | "managerSignature" | "companyStamp", file?: File) {
    if (!file) return;
    setBusy(kind);
    setError("");
    setMessage("");
    setUploadProgress((current) => ({ ...current, [kind]: 25 }));
    const formData = new FormData();
    formData.append("kind", kind);
    formData.append("file", file);
    setUploadProgress((current) => ({ ...current, [kind]: 65 }));
    const response = await fetch(`/api/motor-requests/${request.id}/assets`, { method: "POST", body: formData });
    const result = await response.json().catch(() => null);
    setBusy(null);
    setUploadProgress((current) => ({ ...current, [kind]: response.ok ? 100 : 0 }));
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
    const response = await fetch(`/api/motor-requests/${request.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => null);
    setBusy(null);
    if (!response.ok || result?.success !== true) {
      setError(result?.error ?? "تعذر حذف الطلب.");
      return;
    }
    router.push("/motor-requests");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">{error}</div> : null}

      <div className="flex flex-col gap-2">
        <Button asChild variant="outline">
          <Link href={`/api/motor-requests/${request.id}/pdf`} target="_blank"><Download className="h-4 w-4" />PDF</Link>
        </Button>
      </div>

      {permissions.canEditPricing ? (
        <form action={savePricing} className="space-y-3 rounded-lg border bg-muted/10 p-3">
          <h3 className="text-sm font-black">Pricing</h3>
          <MoneyField label="Insurance Premium" name="insurancePremium" defaultValue={request.insurancePremium} />
          <MoneyField label="Discount" name="discount" defaultValue={request.discount} />
          <MoneyField label="Additional Fees" name="additionalFees" defaultValue={request.additionalFees} />
          <MoneyField label="Taxes" name="taxes" defaultValue={request.taxes} />
          <Field label="Currency" name="currency" defaultValue={request.pricingCurrency} />
          <Textarea label="Notes" name="pricingNotes" defaultValue={request.pricingNotes ?? ""} />
          <Button className="w-full" disabled={Boolean(busy)}><Save className="h-4 w-4" />Save Pricing</Button>
        </form>
      ) : null}

      {permissions.canEditTerms ? (
        <div className="space-y-3 rounded-lg border bg-muted/10 p-3">
          <h3 className="text-sm font-black">Policy Terms & Special Conditions</h3>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => document.execCommand("bold")}>B</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => document.execCommand("insertUnorderedList")}>List</Button>
          </div>
          <div
            ref={termsRef}
            contentEditable
            suppressContentEditableWarning
            className="min-h-40 rounded-md border bg-background p-3 text-sm leading-7 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            dangerouslySetInnerHTML={{ __html: request.policyTermsHtml ?? "" }}
          />
          <Button type="button" className="w-full" disabled={Boolean(busy)} onClick={() => saveTerms(false)}><Save className="h-4 w-4" />Save Terms</Button>
          {permissions.canApproveTerms ? (
            <Button type="button" variant="outline" className="w-full" disabled={Boolean(busy)} onClick={() => saveTerms(true)}><CheckCircle2 className="h-4 w-4" />Approve Terms</Button>
          ) : null}
          {request.termsApprovedByName ? <p className="text-xs text-muted-foreground">Approved by {request.termsApprovedByName}</p> : null}
        </div>
      ) : null}

      {(permissions.canUploadUnderwriterSignature || permissions.canUploadManagerAssets) ? (
        <div className="space-y-3 rounded-lg border bg-muted/10 p-3">
          <h3 className="text-sm font-black">Digital Signatures & Stamp</h3>
          {permissions.canUploadUnderwriterSignature ? <AssetUpload label="Underwriter Signature" kind="underwriterSignature" asset={request.underwriterSignature} progress={uploadProgress.underwriterSignature} busy={busy} onUpload={uploadAsset} /> : null}
          {permissions.canUploadManagerAssets ? <AssetUpload label="General Manager Signature" kind="managerSignature" asset={request.managerSignature} progress={uploadProgress.managerSignature} busy={busy} onUpload={uploadAsset} /> : null}
          {permissions.canUploadManagerAssets ? <AssetUpload label="Company Stamp" kind="companyStamp" asset={request.companyStamp} progress={uploadProgress.companyStamp} busy={busy} onUpload={uploadAsset} icon={<Stamp className="h-4 w-4" />} /> : null}
        </div>
      ) : null}

      {permissions.canEdit ? (
        <form action={saveEdit} className="space-y-3 rounded-lg border bg-muted/10 p-3">
          <h3 className="text-sm font-black">Edit Request</h3>
          <Field label="Customer Name" name="customerFullName" defaultValue={request.customerFullName} />
          <Field label="Mobile" name="customerMobile" defaultValue={request.customerMobile} />
          <Field label="Email" name="customerEmail" defaultValue={request.customerEmail ?? ""} />
          <Field label="National ID" name="customerNationalId" defaultValue={request.customerNationalId} />
          <Field label="Address" name="customerAddress" defaultValue={request.customerAddress} />
          <Field label="City" name="customerCity" defaultValue={request.customerCity} />
          <Field label="Vehicle Type" name="vehicleType" defaultValue={request.vehicleType} />
          <Field label="Manufacturer" name="manufacturer" defaultValue={request.manufacturer} />
          <Field label="Model" name="model" defaultValue={request.model} />
          <Field label="Year" name="manufacturingYear" type="number" defaultValue={String(request.manufacturingYear)} />
          <Field label="Color" name="color" defaultValue={request.color} />
          <Field label="Plate Number" name="plateNumber" defaultValue={request.plateNumber} />
          <Field label="Chassis Number" name="chassisNumber" defaultValue={request.chassisNumber} />
          <Field label="Engine Number" name="engineNumber" defaultValue={request.engineNumber} />
          <MoneyField label="Estimated Value" name="estimatedVehicleValue" defaultValue={request.estimatedVehicleValue} />
          <Field label="Coverage Type" name="coverageType" defaultValue={request.coverageType ?? ""} />
          <Textarea label="Coverage Notes" name="coverageNotes" defaultValue={request.coverageNotes ?? ""} />
          <Button className="w-full" disabled={Boolean(busy)}><Save className="h-4 w-4" />Save Request</Button>
        </form>
      ) : null}

      {permissions.canDelete ? (
        <Button type="button" variant="destructive" className="w-full" disabled={busy === "delete"} onClick={deleteRequest}>
          {busy === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete Request
        </Button>
      ) : null}
    </div>
  );
}

function Field(props: React.ComponentProps<typeof Input> & { label: string }) {
  const { label, ...inputProps } = props;
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input {...inputProps} />
    </div>
  );
}

function MoneyField(props: React.ComponentProps<typeof Input> & { label: string }) {
  return <Field {...props} type="number" min="0" step="0.01" dir="ltr" />;
}

function Textarea({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <textarea name={name} defaultValue={defaultValue} rows={4} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
    </div>
  );
}

function AssetUpload({
  label,
  kind,
  asset,
  progress,
  busy,
  icon,
  onUpload
}: {
  label: string;
  kind: "underwriterSignature" | "managerSignature" | "companyStamp";
  asset: Asset;
  progress?: number;
  busy: string | null;
  icon?: React.ReactNode;
  onUpload: (kind: "underwriterSignature" | "managerSignature" | "companyStamp", file?: File) => void;
}) {
  return (
    <div className="rounded-md border bg-background p-3">
      <Label className="text-xs font-bold">{label}</Label>
      {asset?.url ? <p className="mt-1 truncate text-xs text-muted-foreground">{asset.name}</p> : null}
      {progress ? <div className="mt-2 h-1.5 overflow-hidden rounded bg-muted"><div className="h-full bg-primary" style={{ width: `${progress}%` }} /></div> : null}
      <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-3 text-xs font-bold hover:border-primary">
        {busy === kind ? <Loader2 className="h-4 w-4 animate-spin" /> : icon ?? <UploadCloud className="h-4 w-4" />}
        Upload
        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => onUpload(kind, event.target.files?.[0])} />
      </label>
    </div>
  );
}
