import { createInsuranceRequestRouteHandlers } from "@/lib/insurance-request-api";
import { workersCompensationRequestService } from "@/lib/insurance-modules/workers-compensation-requests";

export const { GET, POST } = createInsuranceRequestRouteHandlers(workersCompensationRequestService, {
  requestNumber: "WRK-REQ-2026-MOCK",
  trackingNumber: "WRK-REQ-2026-MOCK",
  message: "Mock Workers Compensation request accepted."
}, "workersCompensationRequestsRead");
