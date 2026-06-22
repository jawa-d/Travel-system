import Link from "next/link";
import { cookies } from "next/headers";
import { Languages, Moon, ShieldCheck, UserRound } from "lucide-react";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { directAccessUser, isDirectAccessEnabled } from "@/lib/direct-access";
import { roleLabels } from "@/lib/rbac";
import { ChangePasswordForm } from "@/components/change-password-form";
import { requirePagePermission } from "@/lib/page-guard";

export default async function ProfilePage() {
  await requirePagePermission("dashboard");
  const session = await auth();
  const user = session?.user ?? (isDirectAccessEnabled() ? directAccessUser : null);
  if (!user) return null;
  const locale = (await cookies()).get("locale")?.value === "en" ? "en" : "ar";

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-black sm:text-3xl">الملف الشخصي</h1>
        <p className="mt-1 text-sm text-muted-foreground">بيانات الحساب وتفضيلات اللغة والمظهر.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-primary" />بيانات الحساب</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-2xl font-black text-primary">{user.name?.slice(0, 1) ?? "T"}</div>
            <div><p className="text-xs text-muted-foreground">الاسم</p><p className="mt-1 font-bold">{user.name}</p></div>
            <div><p className="text-xs text-muted-foreground">البريد الإلكتروني</p><p className="mt-1 font-medium" dir="ltr">{user.email}</p></div>
            <div className="flex items-center gap-2 rounded-xl border bg-muted/20 p-3 text-sm"><ShieldCheck className="h-4 w-4 text-primary" />{roleLabels[user.role]}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>تفضيلات الواجهة</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div className="flex items-center gap-3"><Moon className="h-5 w-5 text-primary" /><div><p className="font-bold">المظهر</p><p className="text-xs text-muted-foreground">التبديل بين الوضع الفاتح والداكن</p></div></div>
              <ThemeToggle />
            </div>
            <div className="rounded-xl border p-4">
              <div className="mb-3 flex items-center gap-3"><Languages className="h-5 w-5 text-primary" /><div><p className="font-bold">لغة الواجهة</p><p className="text-xs text-muted-foreground">اللغة الحالية: {locale === "ar" ? "العربية" : "English"}</p></div></div>
              <div className="flex gap-2">
                <Button asChild variant={locale === "ar" ? "default" : "outline"} className="flex-1"><Link href="/api/language?locale=ar&redirectTo=/profile">العربية</Link></Button>
                <Button asChild variant={locale === "en" ? "default" : "outline"} className="flex-1"><Link href="/api/language?locale=en&redirectTo=/profile">English</Link></Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />أمان الحساب</CardTitle></CardHeader>
          <CardContent>
            <ChangePasswordForm disabled={user.id === directAccessUser.id} />
            {user.id === directAccessUser.id ? <p className="mt-3 text-xs text-muted-foreground">تغيير كلمة المرور غير متاح في وضع العرض.</p> : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
