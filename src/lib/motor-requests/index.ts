import { FetchMotorPortalApiClient } from "@/lib/motor-requests/api-client";
import { MotorRequestController } from "@/lib/motor-requests/controller";
import { MockMotorRequestRepository } from "@/lib/motor-requests/mock-repository";
import { PortalMotorRequestRepository } from "@/lib/motor-requests/portal-repository";
import { MotorRequestService } from "@/lib/motor-requests/service";

export function createMotorRequestService() {
  const fallbackRepository = new MockMotorRequestRepository();
  const primaryRepository = new PortalMotorRequestRepository(
    new FetchMotorPortalApiClient({
      baseUrl: process.env.PORTAL_API_BASE_URL,
      apiKey: process.env.PORTAL_API_KEY
    })
  );

  return new MotorRequestService(primaryRepository, fallbackRepository);
}

export function createMotorRequestController() {
  return new MotorRequestController(createMotorRequestService());
}

export type { MotorRequestRepository } from "@/lib/motor-requests/repository";
export { MotorRequestService } from "@/lib/motor-requests/service";
