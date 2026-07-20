import { createInsuranceRequestRouteHandlers } from "@/lib/insurance-request-api";
import { glassRequestService } from "@/lib/insurance-modules/glass-requests";

export const { GET, POST } = createInsuranceRequestRouteHandlers(glassRequestService, {
  requestNumber: "GLS-REQ-2026-MOCK",
  trackingNumber: "GLS-REQ-2026-MOCK",
  message: "Mock Glass request accepted."
}, "glassRequestsRead");
