"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("trinsu:theme", next ? "dark" : "light");
  }

  return (
    <Button type="button" variant="ghost" size="icon" className="rounded-xl" onClick={toggle} aria-label={dark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}>
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
