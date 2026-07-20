import { createInsuranceRequestRouteHandlers } from "@/lib/insurance-request-api";
import { cashInsuranceRequestService } from "@/lib/insurance-modules/cash-insurance-requests";

export const { GET, POST } = createInsuranceRequestRouteHandlers(cashInsuranceRequestService, {
  requestNumber: "CSH-REQ-2026-MOCK",
  trackingNumber: "CSH-REQ-2026-MOCK",
  message: "Mock Cash Insurance request accepted."
}, "cashInsuranceRequestsRead");
