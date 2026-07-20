import { NextResponse } from "next/server";
import { MotorRequestNotFoundError } from "@/lib/motor-requests/errors";
import type { MotorRequestService } from "@/lib/motor-requests/service";
import type { MotorRequestUserScope } from "@/lib/motor-requests/types";

export class MotorRequestController {
  constructor(private readonly service: MotorRequestService) {}

  async list(scope: MotorRequestUserScope) {
    const requests = await this.service.list(scope);
    return NextResponse.json({ data: requests });
  }

  async getById(id: string, scope: MotorRequestUserScope) {
    const request = await this.service.getById(id, scope);
    if (!request) throw new MotorRequestNotFoundError();
    return NextResponse.json({ data: request });
  }
}
