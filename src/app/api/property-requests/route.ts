import { createInsuranceRequestRouteHandlers } from "@/lib/insurance-request-api";
import { propertyRequestService } from "@/lib/insurance-modules/property-requests";

export const { GET, POST } = createInsuranceRequestRouteHandlers(propertyRequestService, {
  requestNumber: "PRP-REQ-2026-MOCK",
  trackingNumber: "PRP-REQ-2026-MOCK",
  message: "Mock Property request accepted."
}, "propertyRequestsRead");
