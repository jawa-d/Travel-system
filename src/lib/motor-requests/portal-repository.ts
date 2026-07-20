import type { MotorPortalApiClient } from "@/lib/motor-requests/api-client";
import type { MotorRequestRepository } from "@/lib/motor-requests/repository";
import { mapPortalMotorDetailResponse, mapPortalMotorListResponse } from "@/lib/motor-requests/response-mapper";
import type { MotorRequestUserScope } from "@/lib/motor-requests/types";

export class PortalMotorRequestRepository implements MotorRequestRepository {
  constructor(private readonly client: MotorPortalApiClient) {}

  async list(_scope: MotorRequestUserScope) {
    const response = await this.client.get("/motor-requests");
    return mapPortalMotorListResponse(response);
  }

  async getById(id: string, _scope: MotorRequestUserScope) {
    const response = await this.client.get(`/motor-requests/${encodeURIComponent(id)}`);
    return mapPortalMotorDetailResponse(response);
  }
}
