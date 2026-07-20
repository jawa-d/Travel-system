import { createInsuranceRequestRouteHandlers } from "@/lib/insurance-request-api";
import { healthRequestService } from "@/lib/insurance-modules/health-requests";

export const { GET, POST } = createInsuranceRequestRouteHandlers(healthRequestService, {
  requestNumber: "HLT-REQ-2026-MOCK",
  trackingNumber: "HLT-REQ-2026-MOCK",
  message: "Mock Health request accepted."
}, "healthRequestsRead");
