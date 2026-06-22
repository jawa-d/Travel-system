"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Pencil, Save, Trash2, UserRound, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ImageUpload } from "@/components/image-upload";
import { StoredImage } from "@/components/stored-image";
import { useToast } from "@/components/ui/toast-provider";

type Customer = {
  id: string;
  arabicName: string;
  englishName: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE";
  mobile: string;
  email: string | null;
  address: string | null;
  passportImage: string | null;
};

type Policy = {
  id: string;
  policyNumber: string;
  customerName: string;
  destinationName: string;
  planName: string;
  premium: string;
  status: string;
};

export function CustomerProfile({
  canDelete,
  initialCustomer,
  initialPolicies
}: {
  canDelete: boolean;
  initialCustomer: Customer | null;
  initialPolicies: Policy[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [customer, setCustomer] = useState(initialCustomer);
  const policies = initialPolicies;
  const [preview, setPreview] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editImage, setEditImage] = useState("");
  const customerPolicies = useMemo(() => policies.filter((policy) =>
    policy.customerName === customer?.arabicName ||
    initialPolicies.some((item) => item.id === policy.id)
  ), [policies, customer, initialPolicies]);

  if (!customer) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
          <UserRound className="mb-3 h-10 w-10 text-muted-foreground" />
          <h2 className="font-bold">لم يتم العثور على العميل</h2>
          <p className="mt-1 text-sm text-muted-foreground">قد تكون بياناته حُذفت من التخزين المحلي.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        {customer.passportImage ? (
          <button type="button" onClick={() => setPreview(true)} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <StoredImage source={customer.passportImage} alt={`صورة جواز ${customer.arabicName}`} className="h-20 w-20 object-cover" />
          </button>
        ) : (
          <div className="grid h-20 w-20 place-items-center rounded-2xl bg-primary/10 text-primary">
            <UserRound className="h-8 w-8" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{customer.arabicName}</h1>
          <p className="text-muted-foreground">{customer.englishName} - {customer.passportNumber}</p>
        </div>
        <div className="mr-auto flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => {
            setEditImage(customer.passportImage ?? "");
            setEditing(true);
          }}><Pencil className="h-4 w-4" />تعديل العميل</Button>
          {canDelete ? (
            <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />حذف العميل
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader><CardTitle>بيانات العميل</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="mb-4 overflow-hidden rounded-xl border bg-muted/20">
              {customer.passportImage ? (
                <>
                  <button type="button" onClick={() => setPreview(true)} className="block w-full bg-white">
                    <StoredImage source={customer.passportImage} alt="صورة الجواز" className="h-52 w-full object-contain" />
                  </button>
                  <div className="flex items-center justify-between border-t px-3 py-2">
                    <span className="text-xs text-muted-foreground">صورة الجواز</span>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setPreview(true)}>
                      <ImageIcon className="h-4 w-4" />تكبير
                    </Button>
                  </div>
                </>
              ) : (
                <div className="grid h-32 place-items-center text-center text-muted-foreground">
                  <div><ImageIcon className="mx-auto mb-2 h-7 w-7" /><p className="text-xs">لا توجد صورة جواز محفوظة</p></div>
                </div>
              )}
            </div>
            <Info label="الجنسية" value={customer.nationality} />
            <Info label="تاريخ الميلاد" value={formatDate(customer.dateOfBirth)} />
            <Info label="الجنس" value={customer.gender === "MALE" ? "ذكر" : "أنثى"} />
            <Info label="الهاتف" value={customer.mobile} />
            <Info label="البريد" value={customer.email ?? "-"} />
            <Info label="العنوان" value={customer.address ?? "-"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>سجل الوثائق</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الوثيقة</TableHead>
                  <TableHead>الدولة</TableHead>
                  <TableHead>الخطة</TableHead>
                  <TableHead>القسط</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerPolicies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell>{policy.policyNumber}</TableCell>
                    <TableCell>{policy.destinationName}</TableCell>
                    <TableCell>{policy.planName}</TableCell>
                    <TableCell>{formatCurrency(policy.premium)}</TableCell>
                    <TableCell><Badge>{policy.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!customerPolicies.length ? <p className="py-10 text-center text-sm text-muted-foreground">لا توجد وثائق لهذا العميل.</p> : null}
          </CardContent>
        </Card>
      </div>

      {preview && customer.passportImage ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm" onClick={() => setPreview(false)}>
          <Button type="button" variant="outline" size="icon" className="absolute left-5 top-5" onClick={() => setPreview(false)}>
            <X className="h-5 w-5" />
          </Button>
          <StoredImage source={customer.passportImage} alt="صورة الجواز" className="max-h-[90vh] max-w-[95vw] rounded-xl bg-white object-contain shadow-2xl" />
        </div>
      ) : null}

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <Card className="max-h-[92vh] w-full max-w-2xl overflow-y-auto">
            <CardHeader className="flex-row items-center justify-between space-y-0 border-b">
              <CardTitle>تعديل بيانات العميل</CardTitle>
              <Button type="button" variant="ghost" size="icon" onClick={() => setEditing(false)}><X className="h-5 w-5" /></Button>
            </CardHeader>
            <CardContent className="p-5">
              <form className="space-y-4" onSubmit={async (event) => {
                event.preventDefault();
                setBusy(true);
                const form = new FormData(event.currentTarget);
                const body = Object.fromEntries(form.entries());
                const response = await fetch(`/api/customers/${customer.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(body)
                });
                const result = await response.json().catch(() => null);
                setBusy(false);
                if (!response.ok) {
                  toast({ title: "تعذر تعديل العميل", description: result?.error, tone: "error" });
                  return;
                }
                const updated: Customer = {
                  ...result,
                  dateOfBirth: new Date(result.dateOfBirth).toISOString()
                };
                setCustomer(updated);
                setEditing(false);
                toast({ title: "تم تحديث بيانات العميل", tone: "success" });
              }}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <EditField label="الاسم العربي" name="arabicName" defaultValue={customer.arabicName} />
                  <EditField label="الاسم الإنجليزي" name="englishName" defaultValue={customer.englishName} dir="ltr" />
                  <EditField label="رقم الجواز" name="passportNumber" defaultValue={customer.passportNumber} dir="ltr" />
                  <EditField label="الجنسية" name="nationality" defaultValue={customer.nationality} />
                  <EditField label="تاريخ الميلاد" name="dateOfBirth" type="date" defaultValue={customer.dateOfBirth.slice(0, 10)} />
                  <div className="space-y-2"><label className="text-sm font-medium">الجنس</label><select name="gender" defaultValue={customer.gender} className="h-10 w-full rounded-md border bg-background px-3"><option value="MALE">ذكر</option><option value="FEMALE">أنثى</option></select></div>
                  <EditField label="الهاتف" name="mobile" defaultValue={customer.mobile} dir="ltr" />
                  <EditField label="البريد" name="email" type="email" defaultValue={customer.email ?? ""} dir="ltr" />
                  <EditField label="العنوان" name="address" defaultValue={customer.address ?? ""} />
                </div>
                <ImageUpload name="passportImage" value={editImage} onChange={setEditImage} />
                <Button className="w-full" disabled={busy}><Save className="h-4 w-4" />{busy ? "جارٍ الحفظ..." : "حفظ التعديلات"}</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {canDelete ? <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="حذف العميل"
        description={`هل تريد حذف العميل «${customer.arabicName}» نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف العميل"
        destructive
        busy={deleting}
        onConfirm={async () => {
          setDeleting(true);
          const response = await fetch(`/api/customers/${customer.id}`, { method: "DELETE" });
          const result = await response.json().catch(() => null);
          if (!response.ok) {
            setDeleting(false);
            setDeleteOpen(false);
            toast({
              title: "تعذر حذف العميل",
              description: result?.error ?? "حدث خطأ أثناء حذف العميل.",
              tone: "error"
            });
            return;
          }
          toast({ title: "تم حذف العميل", tone: "success" });
          router.push("/customers");
          router.refresh();
        }}
      /> : null}
    </>
  );
}

function EditField({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <div className="space-y-2"><label className="text-sm font-medium">{label}</label><input required className="h-10 w-full rounded-md border bg-background px-3 text-sm" {...props} /></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b pb-2"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}
