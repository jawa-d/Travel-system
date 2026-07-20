"use client";

import { InsuranceRequestErrorState } from "@/components/insurance-request-error-state";

export default function Error({ reset }: { reset: () => void }) {
  return <InsuranceRequestErrorState reset={reset} />;
}
