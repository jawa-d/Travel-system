import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, requireUser } from "@/lib/api";
import { getIpAddress, writeAuditLog } from "@/lib/audit";

const pricingSchema = z.object({
  insurancePremium: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).default(0),
  additionalFees: z.coerce.number().min(0).default(0),
  taxes: z.coerce.number().min(0).default(0),
  currency: z.string().trim().min(1).max(12).default("IQD"),
  notes: z.string().trim().max(4000).optional().or(z.literal(""))
});

function canEditPricing(role: Role) {
  return role === Role.SUPER_ADMIN || role === Role.UNDERWRITER;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!canEditPricing(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const payload = pricingSchema.parse(await request.json());
    const netPremium = Math.max(0, payload.insurancePremium - payload.discount + payload.additionalFees + payload.taxes);
    const updated = await prisma.motorInsuranceRequest.update({
      where: { id },
      data: {
        insurancePremium: payload.insurancePremium,
        discount: payload.discount,
        additionalFees: payload.additionalFees,
        taxes: payload.taxes,
        netPremium,
        pricingCurrency: payload.currency,
        pricingNotes: payload.notes || null
      }
    });
    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: "MOTOR_REQUEST_PRICING_UPDATED",
      entity: "MotorInsuranceRequest",
      entityId: id,
      ipAddress: getIpAddress(request.headers),
      metadata: { requestNumber: updated.requestNumber, netPremium, currency: payload.currency }
    });
    return NextResponse.json({ success: true, pricing: updated });
  } catch (error) {
    return jsonError(error);
  }
}
