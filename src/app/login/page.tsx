import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Sparkles } from "lucide-react";
import iraqTakafulLogo from "../../Screenshot 2026-06-22 194918.png";
import { LoginForm } from "@/components/login-form";
import { Button } from "@/components/ui/button";
import { isDirectAccessEnabled } from "@/lib/direct-access";

export default function LoginPage() {
  return (
    <main className="login-scene relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#f4f1e9] p-4 sm:p-8">
      <div className="login-orb login-orb-one" />
      <div className="login-orb login-orb-two" />
      <div className="login-grid absolute inset-0 -z-10 opacity-60" />

      <section className="login-shell grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_35px_100px_-30px_rgba(35,54,75,0.4)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="login-brand relative hidden min-h-[650px] overflow-hidden bg-[#22354a] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="login-brand-pattern absolute inset-0 opacity-30" />
          <div className="relative flex items-center gap-3 text-sm text-white/75">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/10">
              <ShieldCheck className="h-5 w-5 text-[#d2ab5b]" />
            </span>
            منصة إدارة تأمين السفر
          </div>

          <div className="relative">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d2ab5b]/30 bg-[#d2ab5b]/10 px-4 py-2 text-xs font-bold text-[#f1d99e]">
              <Sparkles className="h-4 w-4" />
              حماية تثق بها، أينما كانت وجهتك
            </span>
            <h1 className="max-w-xl text-4xl font-black leading-[1.35] xl:text-5xl">
              شركة تكافل العراق
              <span className="mt-2 block text-[#d2ab5b]">للتأمين التكافلي</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-slate-300">
              نظام متكامل وآمن لإدارة وثائق تأمين السفر وخدمة العملاء بكل سلاسة.
            </p>
          </div>

          <p className="relative text-xs text-white/45">Iraq Takaful Insurance Company</p>
        </div>

        <div className="login-card flex min-h-[650px] items-center justify-center p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-md">
            <div className="login-logo mb-8 text-center">
              <div className="login-logo-stage mx-auto">
                <span className="login-logo-halo" />
                <div className="login-logo-float">
                  <Image
                    src={iraqTakafulLogo}
                    alt="شعار شركة تكافل العراق للتأمين التكافلي"
                    priority
                    className="login-logo-image"
                  />
                </div>
              </div>
              <h2 className="mt-5 text-2xl font-black text-[#22354a]">مرحباً بعودتك</h2>
              <p className="mt-2 text-sm text-slate-500">سجّل الدخول للوصول إلى لوحة إدارة التأمين</p>
            </div>

            {isDirectAccessEnabled() ? (
              <Button asChild className="mb-4 h-12 w-full rounded-xl" variant="secondary">
                <Link href="/">دخول مباشر</Link>
              </Button>
            ) : null}
            <LoginForm />

            <div className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4 text-[#bd913e]" />
              اتصال آمن ومشفّر
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
