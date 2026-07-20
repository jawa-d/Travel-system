import { createInsuranceRequestRouteHandlers } from "@/lib/insurance-request-api";
import { publicLiabilityRequestService } from "@/lib/insurance-modules/public-liability-requests";

export const { GET, POST } = createInsuranceRequestRouteHandlers(publicLiabilityRequestService, {
  requestNumber: "PLI-REQ-2026-MOCK",
  trackingNumber: "PLI-REQ-2026-MOCK",
  message: "Mock Public Liability request accepted."
}, "publicLiabilityRequestsRead");
