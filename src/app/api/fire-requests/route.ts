import { createInsuranceRequestRouteHandlers } from "@/lib/insurance-request-api";
import { fireRequestService } from "@/lib/insurance-modules/fire-requests";

export const { GET, POST } = createInsuranceRequestRouteHandlers(fireRequestService, {
  requestNumber: "FIR-REQ-2026-MOCK",
  trackingNumber: "FIR-REQ-2026-MOCK",
  message: "Mock Fire & Burglary request accepted."
}, "fireRequestsRead");
