"use client";

import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrandedLoadingScreen } from "@/components/branded-loading-screen";

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function isRoutableUrl(href: string, currentUrl: string) {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;

  const nextUrl = new URL(href, currentUrl);
  const current = new URL(currentUrl);
  return nextUrl.origin === current.origin && `${nextUrl.pathname}${nextUrl.search}` !== `${current.pathname}${current.search}`;
}

export function RouteLoadingOverlay() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
  }, []);

  const startLoading = useCallback(() => {
    clearTimers();
    setLoading(true);
    fallbackTimeoutRef.current = setTimeout(() => setLoading(false), 5000);
  }, [clearTimers]);

  const scheduleStartLoading = useCallback(() => {
    window.setTimeout(startLoading, 0);
  }, [startLoading]);

  const finishLoading = useCallback(() => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setLoading(false);
      if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
    }, 140);
  }, []);

  useEffect(() => {
    if (document.readyState === "complete") {
      finishLoading();
      return;
    }

    window.addEventListener("load", finishLoading, { once: true });
    return () => window.removeEventListener("load", finishLoading);
  }, [finishLoading]);

  useEffect(() => {
    finishLoading();
  }, [finishLoading, pathname]);

  useEffect(() => {
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    function handleDocumentClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || isModifiedClick(event)) return;

      const link = (event.target as HTMLElement | null)?.closest("a[href]");
      if (!link) return;

      const target = link.getAttribute("target");
      const download = link.getAttribute("download");
      const href = link.getAttribute("href");
      if (target === "_blank" || download !== null || !href || !isRoutableUrl(href, window.location.href)) return;

      startLoading();
    }

    function handleSubmit(event: SubmitEvent) {
      if (event.defaultPrevented) return;

      const form = event.target as HTMLFormElement | null;
      const target = form?.getAttribute("target");
      if (target === "_blank") return;

      startLoading();
    }

    function handlePopState() {
      startLoading();
    }

    function handleBeforeUnload() {
      startLoading();
    }

    window.history.pushState = function pushState(...args) {
      const url = args[2];
      if (typeof url === "string" && isRoutableUrl(url, window.location.href)) scheduleStartLoading();
      return originalPushState.apply(this, args);
    };

    window.history.replaceState = function replaceState(...args) {
      const url = args[2];
      if (typeof url === "string" && isRoutableUrl(url, window.location.href)) scheduleStartLoading();
      return originalReplaceState.apply(this, args);
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("submit", handleSubmit);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("submit", handleSubmit);
      clearTimers();
    };
  }, [clearTimers, scheduleStartLoading, startLoading]);

  return (
    <AnimatePresence mode="wait">
      {loading ? <BrandedLoadingScreen key="global-route-loader" fixed /> : null}
    </AnimatePresence>
  );
}
