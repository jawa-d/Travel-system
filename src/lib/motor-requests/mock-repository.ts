import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { MotorRequestRepository } from "@/lib/motor-requests/repository";
import type { MotorRequestUserScope } from "@/lib/motor-requests/types";

export class MockMotorRequestRepository implements MotorRequestRepository {
  async list(scope: MotorRequestUserScope) {
    const requests = await prisma.motorInsuranceRequest.findMany({
      where: scope.role === Role.AGENT ? { agentId: scope.id } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        requestNumber: true,
        status: true,
        customerFullName: true,
        manufacturer: true,
        model: true,
        plateNumber: true,
        estimatedVehicleValue: true,
        insurancePremium: true,
        netPremium: true,
        pricingCurrency: true,
        commission: {
          select: {
            id: true,
            paid: true,
            commissionAmount: true
          }
        },
        createdDate: true,
        createdTime: true
      }
    });

    return requests.map((request) => ({
      ...request,
      estimatedVehicleValue: String(request.estimatedVehicleValue),
      insurancePremium: String(request.insurancePremium),
      netPremium: String(request.netPremium),
      commission: request.commission ? {
        id: request.commission.id,
        paid: request.commission.paid,
        commissionAmount: String(request.commission.commissionAmount)
      } : null,
      createdDate: request.createdDate.toISOString()
    }));
  }

  async getById(id: string, scope: MotorRequestUserScope) {
    const request = await prisma.motorInsuranceRequest.findUnique({ where: { id } });
    if (!request) return null;
    if (scope.role === Role.AGENT && request.agentId !== scope.id) return null;

    return request;
  }
}
