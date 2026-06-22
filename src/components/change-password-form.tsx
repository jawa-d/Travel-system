"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast-provider";

export function ChangePasswordForm({ disabled = false }: { disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        const form = event.currentTarget;
        const values = new FormData(form);
        const newPassword = String(values.get("newPassword") ?? "");
        const confirmation = String(values.get("confirmation") ?? "");
        if (newPassword !== confirmation) {
          setError("تأكيد كلمة المرور غير مطابق");
          setBusy(false);
          return;
        }

        const response = await fetch("/api/profile/password", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword: values.get("currentPassword"),
            newPassword
          })
        });
        const result = await response.json();
        if (!response.ok) {
          setError(result.error ?? "تعذر تغيير كلمة المرور");
          setBusy(false);
          return;
        }

        form.reset();
        setBusy(false);
        toast({ title: "تم تغيير كلمة المرور", tone: "success" });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="current-password">كلمة المرور الحالية</Label>
        <Input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required disabled={disabled} dir="ltr" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
        <Input id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={10} required disabled={disabled} dir="ltr" />
        <p className="text-xs text-muted-foreground">10 أحرف على الأقل، وتتضمن حرفًا كبيرًا وصغيرًا ورقمًا.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password-confirmation">تأكيد كلمة المرور</Label>
        <Input id="password-confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={10} required disabled={disabled} dir="ltr" />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={busy || disabled}>
        <KeyRound className="h-4 w-4" />
        {busy ? "جارٍ التغيير..." : "تغيير كلمة المرور"}
      </Button>
    </form>
  );
}
