"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertLocalItem } from "@/lib/local-storage";
import { useToast } from "@/components/ui/toast-provider";

type Field = {
  name: string;
  label: string;
  type?: string;
  maxLength?: number;
  placeholder?: string;
  options?: { label: string; value: string }[];
};

export function ResourceForm({ title, endpoint, fields }: { title: string; endpoint: string; fields: Field[] }) {
  const router = useRouter();
  const { toast } = useToast();

  async function submit(formData: FormData) {
    const body = Object.fromEntries(formData.entries());
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      toast({ title: "تعذر الحفظ", description: result?.error, tone: "error" });
      return;
    }
    const resource = endpoint === "/api/plans" ? "plans" : endpoint === "/api/countries" ? "countries" : null;
    if (resource && result?.id) upsertLocalItem(resource, normalizeResource(resource, result));
    toast({ title: "تم الحفظ بنجاح", tone: "success" });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <form action={submit} className="space-y-3">
          {fields.map((field) => (
            <div className="space-y-2" key={field.name}>
              <Label htmlFor={`resource-${field.name}`}>{field.label}</Label>
              {field.options ? (
                <select id={`resource-${field.name}`} className="h-10 w-full rounded-md border bg-background px-3" name={field.name}>
                  {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              ) : (
                <Input
                  id={`resource-${field.name}`}
                  name={field.name}
                  type={field.type ?? "text"}
                  maxLength={field.maxLength}
                  placeholder={field.placeholder}
                  dir={field.name === "isoCode" ? "ltr" : undefined}
                  onInput={field.name === "isoCode"
                    ? (event) => {
                        event.currentTarget.value = event.currentTarget.value
                          .replace(/[^a-zA-Z]/g, "")
                          .toUpperCase()
                          .slice(0, 3);
                      }
                    : undefined}
                />
              )}
            </div>
          ))}
          <Button className="w-full">حفظ</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function normalizeResource(resource: string, item: Record<string, unknown> & { id: string }) {
  if (resource === "plans") {
    return {
      ...item,
      price: String(item.price),
      medicalCoverage: String(item.medicalCoverage),
      baggageCoverage: String(item.baggageCoverage),
      tripDelayCoverage: String(item.tripDelayCoverage),
      medicalEvacuation: String(item.medicalEvacuation),
      repatriation: String(item.repatriation),
      personalLiability: String(item.personalLiability)
    };
  }
  return item;
}
