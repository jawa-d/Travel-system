import { Moon, ShieldCheck, UserRound } from "lucide-react";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { ChangePasswordForm } from "@/components/change-password-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { directAccessUser, isDirectAccessEnabled } from "@/lib/direct-access";
import { requirePagePermission } from "@/lib/page-guard";
import { roleLabels } from "@/lib/rbac";

export default async function ProfilePage() {
  await requirePagePermission("dashboard");
  const session = await auth();
  const user = session?.user ?? (isDirectAccessEnabled() ? directAccessUser : null);
  if (!user) return null;

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-black sm:text-3xl">الملف الشخصي</h1>
        <p className="mt-1 text-sm text-muted-foreground">بيانات الحساب وتفضيلات المظهر.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-primary" />
              بيانات الحساب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-2xl font-black text-primary">{user.name?.slice(0, 1) ?? "T"}</div>
            <div>
              <p className="text-xs text-muted-foreground">الاسم</p>
              <p className="mt-1 font-bold">{user.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
              <p className="mt-1 font-medium" dir="ltr">{user.email}</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border bg-muted/20 p-3 text-sm">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {roleLabels[user.role]}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تفضيلات الواجهة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-bold">المظهر</p>
                  <p className="text-xs text-muted-foreground">التبديل بين الوضع الفاتح والداكن ووضع النظام</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              أمان الحساب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm disabled={user.id === directAccessUser.id} />
            {user.id === directAccessUser.id ? <p className="mt-3 text-xs text-muted-foreground">تغيير كلمة المرور غير متاح في وضع العرض.</p> : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
