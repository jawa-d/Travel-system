import { createInsuranceRequestRouteHandlers } from "@/lib/insurance-request-api";
import { contractorsAllRisksRequestService } from "@/lib/insurance-modules/contractors-all-risks-requests";

export const { GET, POST } = createInsuranceRequestRouteHandlers(contractorsAllRisksRequestService, {
  requestNumber: "CAR-REQ-2026-MOCK",
  trackingNumber: "CAR-REQ-2026-MOCK",
  message: "Mock Contractors All Risks request accepted."
}, "contractorsAllRisksRequestsRead");
