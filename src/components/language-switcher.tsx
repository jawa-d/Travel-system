"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const redirectTo = encodeURIComponent(pathname || "/");

  return (
    <motion.div
      layout
      className="hidden items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-border dark:bg-card sm:flex"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      <span className="grid h-8 w-8 place-items-center text-slate-500 dark:text-slate-300">
        <Languages className="h-4 w-4" />
      </span>
      <Button asChild size="sm" variant={locale === "ar" ? "default" : "ghost"} className="h-8 rounded-lg px-3">
        <Link href={`/api/language?locale=ar&redirectTo=${redirectTo}`}>العربية</Link>
      </Button>
      <Button asChild size="sm" variant={locale === "en" ? "default" : "ghost"} className="h-8 rounded-lg px-3">
        <Link href={`/api/language?locale=en&redirectTo=${redirectTo}`}>English</Link>
      </Button>
    </motion.div>
  );
}
