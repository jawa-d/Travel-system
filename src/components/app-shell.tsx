import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, ChevronDown, LogOut, Plus, UserRound } from "lucide-react";
import { signOut, auth } from "@/auth";
import { AppNavigation } from "@/components/app-navigation";
import { ExportActions } from "@/components/export-actions";
import { GlobalSearch } from "@/components/global-search";
import { LocalNotificationSync } from "@/components/local-notification-sync";
import { PageContext } from "@/components/page-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { directAccessUser, isDirectAccessEnabled } from "@/lib/direct-access";
import { getDemoNotifications } from "@/lib/demo-notification-store";
import { getDictionary, type Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { roleLabels } from "@/lib/rbac";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user && !isDirectAccessEnabled()) redirect("/login");
  if (session?.user && !session.user.active) redirect("/login");

  const user = session?.user ?? directAccessUser;
  const locale = "ar" satisfies Locale;
  const t = getDictionary(locale);
  const unreadNotifications = user.role === "AGENT" ? 0 : isDirectAccessEnabled()
    ? getDemoNotifications().filter((item) => item.status !== "READ").length
    : await prisma.notification.count({
        where: { OR: [{ userId: user.id }, { userId: null }], status: { not: "READ" } }
      }).catch(() => 0);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F1ECE2] transition-colors duration-300 dark:bg-background">
      {isDirectAccessEnabled() ? <LocalNotificationSync /> : null}
      <AppNavigation role={user.role} />
      <main className="min-w-0 w-full lg:pr-64 xl:pr-72">
        <header className="sticky top-0 z-30 flex h-[73px] min-w-0 items-center justify-between gap-3 border-b border-slate-200/70 bg-white/90 px-3 shadow-[0_1px_8px_rgba(15,23,42,0.03)] backdrop-blur-xl transition-colors duration-300 dark:border-border dark:bg-card/90 sm:px-4 lg:px-5 xl:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <AppNavigation role={user.role} mobileOnly />
            <div className="hidden h-7 w-px bg-slate-200 sm:block lg:hidden" />
            <PageContext locale={locale} />
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {user.role !== "AGENT" ? <GlobalSearch /> : null}
            {user.role !== "AGENT" ? <ExportActions locale={locale} /> : null}
            <ThemeToggle locale={locale} />
            <Button asChild className="hidden rounded-xl px-3 shadow-sm md:inline-flex">
              <Link href={user.role === "AGENT" ? "/motor-requests/new" : "/policies/new"}>
                <Plus className="h-4 w-4" />
                {user.role === "AGENT" ? "طلب تأمين مركبة" : t.issuePolicy}
              </Link>
            </Button>
            {user.role !== "AGENT" ? (
              <Button asChild variant="ghost" size="icon" className="relative rounded-xl text-slate-600">
                <Link href="/notifications" aria-label={t.notifications}>
                  <Bell className="h-5 w-5" />
                  {unreadNotifications ? (
                    <span className="absolute -left-1 -top-1 min-w-5 rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-5 text-white ring-2 ring-white dark:ring-card">
                      {unreadNotifications > 99 ? "99+" : unreadNotifications}
                    </span>
                  ) : null}
                </Link>
              </Button>
            ) : null}
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm transition-all hover:shadow-md dark:border-border dark:bg-card sm:pr-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary/15 to-cyan-500/10 text-sm font-black text-primary">{user.name?.slice(0, 1) ?? "T"}</span>
                <span className="hidden text-right md:block">
                  <span className="block max-w-28 truncate text-xs font-bold text-slate-800 dark:text-foreground">{user.name}</span>
                  <span className="block text-[10px] text-slate-500 dark:text-muted-foreground">{roleLabels[user.role]}</span>
                </span>
                <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 md:block" />
              </summary>
              <div className="absolute left-0 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-border dark:bg-card">
                <div className="border-b px-2 pb-2 pt-1 md:hidden">
                  <p className="text-xs font-bold">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground">{roleLabels[user.role]}</p>
                </div>
                {user.role !== "AGENT" ? (
                  <Button asChild variant="ghost" size="sm" className="mb-1 w-full justify-start">
                    <Link href="/profile">
                      <UserRound className="h-4 w-4" />
                      الملف الشخصي
                    </Link>
                  </Button>
                ) : null}
                <form action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <LogOut className="h-4 w-4" />
                    {t.logout}
                  </Button>
                </form>
              </div>
            </details>
          </div>
        </header>
        <div className="w-full max-w-none p-3 sm:p-4 lg:p-5 xl:p-6 2xl:p-7">{children}</div>
      </main>
    </div>
  );
}
