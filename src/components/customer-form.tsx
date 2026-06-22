"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import type { UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { customerSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/image-upload";
import { useToast } from "@/components/ui/toast-provider";

type FormValues = z.infer<typeof customerSchema>;

export function CustomerForm() {
  const router = useRouter();
  const form = useForm<FormValues>({ resolver: zodResolver(customerSchema) });
  const passportImage = useWatch({ control: form.control, name: "passportImage" });
  const { toast } = useToast();

  async function submit(values: FormValues) {
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const contentType = response.headers.get("content-type") ?? "";
      const result = contentType.includes("application/json")
        ? await response.json()
        : { error: await response.text() };
      if (!response.ok) {
        toast({ title: "تعذر حفظ العميل", description: result.error, tone: "error" });
        return;
      }
      form.reset();
      toast({ title: "تم حفظ العميل", tone: "success" });
      router.refresh();
    } catch {
      toast({ title: "تعذر الاتصال بالخادم", description: "حاول مرة أخرى بعد التحقق من الاتصال.", tone: "error" });
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>عميل جديد</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(submit)} className="space-y-3">
          <Field label="الاسم العربي" registration={form.register("arabicName")} />
          <Field label="الاسم الإنجليزي" registration={form.register("englishName")} />
          <Field label="رقم الجواز" registration={form.register("passportNumber")} />
          <Field label="الجنسية" registration={form.register("nationality")} />
          <Field label="تاريخ الميلاد" type="date" registration={form.register("dateOfBirth")} />
          <div className="space-y-2">
            <Label htmlFor="customer-gender">الجنس</Label>
            <select id="customer-gender" className="h-10 w-full rounded-md border bg-background px-3" {...form.register("gender")}>
              <option value="MALE">ذكر</option>
              <option value="FEMALE">أنثى</option>
            </select>
          </div>
          <Field label="الهاتف" registration={form.register("mobile")} />
          <Field label="البريد" type="email" registration={form.register("email")} />
          <Field label="العنوان" registration={form.register("address")} />
          <ImageUpload
            name="passportImage"
            label="صورة الجواز"
            value={passportImage ?? ""}
            onChange={(value) => form.setValue("passportImage", value, { shouldDirty: true, shouldValidate: true })}
          />
          {form.formState.errors.passportImage ? (
            <p className="text-xs text-destructive">{form.formState.errors.passportImage.message}</p>
          ) : null}
          <Button className="w-full">حفظ العميل</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  type = "text",
  registration
}: {
  label: string;
  type?: string;
  registration: UseFormRegisterReturn;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={registration.name}>{label}</Label>
      <Input id={registration.name} type={type} {...registration} />
    </div>
  );
}
