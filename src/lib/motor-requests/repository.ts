import type { MotorRequestDetail, MotorRequestListItem, MotorRequestUserScope } from "@/lib/motor-requests/types";

export interface MotorRequestRepository {
  list(scope: MotorRequestUserScope): Promise<MotorRequestListItem[]>;
  getById(id: string, scope: MotorRequestUserScope): Promise<MotorRequestDetail | null>;
}
