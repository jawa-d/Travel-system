import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BellRing, Home, LockKeyhole, ShieldAlert } from "lucide-react";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { directAccessUser, isDirectAccessEnabled } from "@/lib/direct-access";
import { createAccessDeniedNotification } from "@/lib/notifications";
import { roleLabels } from "@/lib/rbac";

export default async function AccessDeniedPage({
  searchParams
}: {
  searchParams: Promise<{ from?: string; permission?: string; reason?: string }>;
}) {
  const session = await auth();
  const user = session?.user ?? (isDirectAccessEnabled() ? directAccessUser : null);
  if (!user) redirect("/login");
  if (session?.user && !session.user.active) redirect("/login");

  const { from = "unknown", permission, reason } = await searchParams;

  if (!isDirectAccessEnabled()) {
    await createAccessDeniedNotification({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      path: from,
      permission,
      reason
    }).catch(() => null);
  }

  return (
    <AppShell>
      <div className="mx-auto flex min-h-[calc(100vh-128px)] max-w-4xl items-center justify-center">
        <Card className="w-full overflow-hidden border-red-200 bg-white shadow-xl shadow-red-950/5">
          <div className="h-2 bg-gradient-to-l from-red-700 via-amber-500 to-[#293545]" />
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-700 ring-1 ring-red-100">
                  <ShieldAlert className="h-7 w-7" />
                </span>
                <div>
                  <p className="text-sm font-black text-red-700">تم منع الوصول</p>
                  <h1 className="mt-2 text-2xl font-black tracking-normal text-[#293545] sm:text-3xl">
                    لا تملك صلاحية الدخول إلى هذه الصفحة
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-600">
                    تم تسجيل محاولة الدخول وإرسال تنبيه أمني إلى المدير العام لمراجعة الصلاحيات.
                  </p>
                </div>
              </div>

              <div className="grid min-w-52 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <div className="flex items-center gap-2 font-bold text-[#293545]">
                  <LockKeyhole className="h-4 w-4 text-red-700" />
                  {roleLabels[user.role]}
                </div>
                <div className="flex items-center gap-2 font-bold text-amber-700">
                  <BellRing className="h-4 w-4" />
                  تم إرسال التنبيه
                </div>
              </div>
            </div>

            <div className="mt-7 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
              <p className="text-xs font-bold text-slate-500">الصفحة المطلوبة</p>
              <p className="mt-2 break-all font-mono text-sm font-black text-[#293545]" dir="ltr">{from}</p>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="bg-[#293545] hover:bg-[#1f2937]">
                <Link href="/">
                  <Home className="h-4 w-4" />
                  العودة للوحة التحكم
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/profile">
                  <ArrowRight className="h-4 w-4" />
                  مراجعة الحساب
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
