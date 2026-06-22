"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const params = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const requestedPath = params.get("callbackUrl");
  const callbackPath = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/";

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await signIn("credentials", {
            email: formData.get("email"),
            password: formData.get("password"),
            redirect: false
          });
          if (result?.error) {
            setError("بيانات الدخول غير صحيحة");
            return;
          }
          router.push(callbackPath);
          router.refresh();
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required dir="ltr" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">كلمة المرور</Label>
        <div className="relative">
          <Input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required dir="ltr" className="pl-11" />
          <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:bg-muted" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button className="w-full" disabled={pending}>
        <LogIn className="h-4 w-4" />
        {pending ? "جارٍ تسجيل الدخول..." : "دخول"}
      </Button>
    </form>
  );
}
