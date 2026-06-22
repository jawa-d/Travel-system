"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";

export function EmailPolicyForm({ policyId, defaultEmail }: { policyId: string; defaultEmail?: string | null }) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  return (
    <form
      className="flex gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setBusy(true);
        const response = await fetch(`/api/policies/${policyId}/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.get("email") })
        });
        setBusy(false);
        setSent(response.ok);
        toast(response.ok
          ? { title: "تم إرسال الوثيقة", tone: "success" }
          : { title: "تعذر إرسال الوثيقة", description: "تحقق من إعدادات البريد والعنوان المدخل.", tone: "error" });
      }}
    >
      <Input name="email" type="email" defaultValue={defaultEmail ?? ""} placeholder="email@example.com" className="h-9" />
      <Button size="sm" variant="outline" disabled={busy}><Mail className="h-4 w-4" />{busy ? "جارٍ..." : sent ? "تم" : "إرسال"}</Button>
    </form>
  );
}
