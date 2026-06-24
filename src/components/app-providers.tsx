"use client";

import { ToastProvider } from "@/components/ui/toast-provider";
import { RouteLoadingOverlay } from "@/components/route-loading-overlay";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <RouteLoadingOverlay />
    </ToastProvider>
  );
}
