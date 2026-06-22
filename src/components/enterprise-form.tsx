"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast-provider";

export type EnterpriseField = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  options?: { label: string; value: string }[];
};

export function EnterpriseForm({ title, endpoint, fields }: { title: string; endpoint: string; fields: EnterpriseField[] }) {
  const router = useRouter();
  const { toast } = useToast();
  async function submit(formData: FormData) {
    const body: Record<string, unknown> = Object.fromEntries(formData.entries());
    if (typeof body.attachments === "string") body.attachments = body.attachments.split(",").map((x) => x.trim()).filter(Boolean);
    if (typeof body.newValue === "string") {
      try {
        body.newValue = JSON.parse(body.newValue);
      } catch {
        body.newValue = { value: body.newValue };
      }
    }
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) {
      toast({ title: "تعذر تنفيذ العملية", description: (await response.json()).error, tone: "error" });
      return;
    }
    toast({ title: "تم تنفيذ العملية", tone: "success" });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <form action={submit} className="space-y-3">
          {fields.map((field) => (
            <div className="space-y-2" key={field.name}>
              <Label htmlFor={`enterprise-${field.name}`}>{field.label}</Label>
              {field.options ? (
                <select id={`enterprise-${field.name}`} name={field.name} className="h-10 w-full rounded-md border bg-background px-3">
                  {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              ) : (
                <Input id={`enterprise-${field.name}`} name={field.name} type={field.type ?? "text"} placeholder={field.placeholder} />
              )}
            </div>
          ))}
          <Button className="w-full">حفظ</Button>
        </form>
      </CardContent>
    </Card>
  );
}
