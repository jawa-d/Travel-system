"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export function RouteLoadingOverlay() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLoading = useCallback(() => {
    setLoading(true);
    if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
    fallbackTimeoutRef.current = setTimeout(() => setLoading(false), 8000);
  }, []);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setLoading(false), 220);
    if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pathname]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const link = (event.target as HTMLElement | null)?.closest("a[href]");
      if (!link) return;

      const href = link.getAttribute("href");
      const target = link.getAttribute("target");
      if (!href || target === "_blank" || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      const nextUrl = new URL(href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;

      const currentPath = `${window.location.pathname}${window.location.search}`;
      const nextPath = `${nextUrl.pathname}${nextUrl.search}`;
      if (nextPath === currentPath) return;

      startLoading();
    }

    function handlePopState() {
      startLoading();
    }

    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleDocumentClick);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleDocumentClick);
      if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
    };
  }, [startLoading]);

  if (!loading) return null;

  return (
    <div className="route-loader fixed inset-0 z-[100] grid place-items-center bg-white/82 backdrop-blur-md dark:bg-slate-950/78">
      <div className="route-loader-card grid place-items-center gap-4 rounded-2xl border border-primary/10 bg-white/90 px-8 py-7 shadow-2xl shadow-primary/15 dark:border-white/10 dark:bg-card/90">
        <div className="route-loader-logo relative grid h-24 w-24 place-items-center rounded-2xl bg-white p-3 shadow-lg shadow-slate-900/10">
          <Image
            src="/iraq-takaful-logo.svg"
            alt="Iraq Takaful Insurance Company logo"
            width={88}
            height={88}
            priority
            className="h-full w-full object-contain"
          />
        </div>
        <div className="flex items-center gap-1.5" aria-label="Loading page">
          <span className="route-loader-dot" />
          <span className="route-loader-dot" />
          <span className="route-loader-dot" />
        </div>
      </div>
    </div>
  );
}
