import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";
import { Button } from "@/components/ui/button";
import { isDirectAccessEnabled } from "@/lib/direct-access";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="text-3xl font-bold text-primary">TRINSU</div>
          <p className="mt-2 text-sm text-muted-foreground">تسجيل الدخول إلى منصة إدارة تأمين السفر</p>
        </div>
        {isDirectAccessEnabled() ? (
          <Button asChild className="mb-4 w-full" variant="secondary">
            <Link href="/">دخول مباشر</Link>
          </Button>
        ) : null}
        <LoginForm />
      </div>
    </main>
  );
}
