"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Laptop, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";

type ThemePreference = "light" | "dark" | "system";

const options: Array<{ value: ThemePreference; icon: typeof Sun }> = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Laptop }
];

function applyTheme(theme: ThemePreference) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle({ locale = "ar" }: { locale?: Locale }) {
  const t = getDictionary(locale);
  const [theme, setTheme] = useState<ThemePreference>("system");
  const labels = useMemo(() => ({
    light: t.light,
    dark: t.dark,
    system: t.systemTheme
  }), [t]);

  useEffect(() => {
    const stored = localStorage.getItem("trinsu:theme") as ThemePreference | null;
    const initial = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    setTheme(initial);
    applyTheme(initial);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystem = () => {
      if ((localStorage.getItem("trinsu:theme") ?? "system") === "system") applyTheme("system");
    };
    media.addEventListener("change", syncSystem);
    return () => media.removeEventListener("change", syncSystem);
  }, []);

  async function choose(next: ThemePreference) {
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("trinsu:theme", next);
    await fetch("/api/preferences/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: next })
    }).catch(() => null);
  }

  return (
    <motion.div
      layout
      className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-border dark:bg-card"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      aria-label={t.theme}
    >
      {options.map(({ value, icon: Icon }) => (
        <Button
          key={value}
          type="button"
          variant={theme === value ? "default" : "ghost"}
          size="sm"
          className="h-8 rounded-lg px-2.5"
          onClick={() => choose(value)}
          title={labels[value]}
          aria-label={labels[value]}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden lg:inline">{labels[value]}</span>
        </Button>
      ))}
    </motion.div>
  );
}
