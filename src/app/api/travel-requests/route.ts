import { createInsuranceRequestRouteHandlers } from "@/lib/insurance-request-api";
import { travelRequestService } from "@/lib/insurance-modules/travel-requests";

export const { GET, POST } = createInsuranceRequestRouteHandlers(travelRequestService, {
  requestNumber: "TRV-REQ-2026-MOCK",
  trackingNumber: "TRV-REQ-2026-MOCK",
  message: "Mock Travel request accepted."
}, "travelRequestsRead");
