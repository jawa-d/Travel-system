import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requirePermission } from "@/lib/api";
import type { Permission } from "@/lib/rbac";
import type { InsuranceRequestService } from "@/lib/insurance-request-ui";
import type { InsurancePortalRequestDto } from "@/lib/insurance-portal-contracts";
import { insurancePortalRequestDtoSchema } from "@/lib/insurance-portal-contracts";

export type MockPortalAcceptance = {
  requestNumber: string;
  trackingNumber: string;
  message: string;
};

function insuranceJsonError(error: unknown) {
  if (error instanceof Response) {
    return NextResponse.json({ success: false, error: error.statusText || "Request failed" }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { success: false, error: error.issues.map((issue) => issue.message).join("، ") },
      { status: 400 }
    );
  }
  const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع";
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

export function createInsuranceRequestRouteHandlers(
  service: InsuranceRequestService,
  mockAcceptance: MockPortalAcceptance,
  permission: Permission
) {
  return {
    async GET() {
      try {
        await requirePermission(permission);
        return NextResponse.json({ success: true, requests: service.list() });
      } catch (error) {
        return insuranceJsonError(error);
      }
    },
    async POST(request: Request) {
      try {
        await requirePermission(permission);
        const body = await request.json().catch(() => null);
        if (body) insurancePortalRequestDtoSchema.parse(body);
        return NextResponse.json({ success: true, ...mockAcceptance }, { status: 201 });
      } catch (error) {
        return insuranceJsonError(error);
      }
    }
  };
}

export type InsurancePortalIngressService = {
  validate: (input: unknown) => InsurancePortalRequestDto;
};

export const insurancePortalIngressService: InsurancePortalIngressService = {
  validate: (input) => insurancePortalRequestDtoSchema.parse(input)
};
