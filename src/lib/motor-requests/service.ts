import { handleMotorRepositoryError } from "@/lib/motor-requests/errors";
import { logMotorRequestInfo } from "@/lib/motor-requests/logger";
import type { MotorRequestRepository } from "@/lib/motor-requests/repository";
import type { MotorRequestUserScope } from "@/lib/motor-requests/types";

export class MotorRequestService {
  constructor(
    private readonly primaryRepository: MotorRequestRepository,
    private readonly fallbackRepository: MotorRequestRepository
  ) {}

  async list(scope: MotorRequestUserScope) {
    try {
      const requests = await this.primaryRepository.list(scope);
      logMotorRequestInfo("loaded motor request list", { source: "primary", count: requests.length });
      return requests;
    } catch (error) {
      handleMotorRepositoryError("primary list failed", error);
      const requests = await this.fallbackRepository.list(scope);
      logMotorRequestInfo("loaded motor request list", { source: "fallback", count: requests.length });
      return requests;
    }
  }

  async getById(id: string, scope: MotorRequestUserScope) {
    try {
      const request = await this.primaryRepository.getById(id, scope);
      logMotorRequestInfo("loaded motor request detail", { source: "primary", id, found: Boolean(request) });
      return request;
    } catch (error) {
      handleMotorRepositoryError("primary detail failed", error);
      const request = await this.fallbackRepository.getById(id, scope);
      logMotorRequestInfo("loaded motor request detail", { source: "fallback", id, found: Boolean(request) });
      return request;
    }
  }
}
