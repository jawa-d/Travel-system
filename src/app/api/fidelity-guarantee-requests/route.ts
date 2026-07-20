import { createInsuranceRequestRouteHandlers } from "@/lib/insurance-request-api";
import { fidelityGuaranteeRequestService } from "@/lib/insurance-modules/fidelity-guarantee-requests";

export const { GET, POST } = createInsuranceRequestRouteHandlers(fidelityGuaranteeRequestService, {
  requestNumber: "FDL-REQ-2026-MOCK",
  trackingNumber: "FDL-REQ-2026-MOCK",
  message: "Mock Fidelity Guarantee request accepted."
}, "fidelityGuaranteeRequestsRead");
