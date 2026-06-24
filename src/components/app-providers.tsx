"use client";

import { ToastProvider } from "@/components/ui/toast-provider";
import { RouteLoadingOverlay } from "@/components/route-loading-overlay";
import { PageTransition } from "@/components/page-transition";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <PageTransition>{children}</PageTransition>
      <RouteLoadingOverlay />
    </ToastProvider>
  );
}
