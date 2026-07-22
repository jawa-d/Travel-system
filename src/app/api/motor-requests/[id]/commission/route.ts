import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, requirePermission } from "@/lib/api";
import { getIpAddress, writeAuditLog } from "@/lib/audit";

const commissionSchema = z.object({
  commissionRate: z.coerce.number().min(0).max(100),
  commissionAmount: z.coerce.number().positive().max(9_999_999_999.99),
  notes: z.string().trim().max(2000).optional().or(z.literal(""))
});

const cancelCommissionSchema = z.object({
  reason: z.string().trim().min(3, "Cancellation reason is required.").max(2000)
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("motorCommissionsWrite");
    const { id } = await params;
    const payload = commissionSchema.parse(await request.json());

    const motorRequest = await prisma.motorInsuranceRequest.findUnique({
      where: { id },
      select: {
        id: true,
        requestNumber: true,
        insurancePremium: true,
        netPremium: true,
        pricingCurrency: true,
        commission: { select: { id: true, paid: true, notes: true } }
      }
    });

    if (!motorRequest) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (motorRequest.commission?.paid) return NextResponse.json({ error: "Commission already paid for this request." }, { status: 409 });

    const premiumAmount = Number(motorRequest.netPremium) || Number(motorRequest.insurancePremium);
    if (!premiumAmount || premiumAmount <= 0) {
      return NextResponse.json({ error: "Request premium must be set before paying commission." }, { status: 400 });
    }

    const commission = motorRequest.commission
      ? await prisma.motorCommission.update({
          where: { id: motorRequest.commission.id },
          data: {
            premiumAmount,
            commissionRate: payload.commissionRate,
            commissionAmount: payload.commissionAmount,
            currency: motorRequest.pricingCurrency || "IQD",
            paid: true,
            paidAt: new Date(),
            paidById: user.id,
            paidByName: user.name ?? user.email ?? "User",
            notes: payload.notes || null
          }
        })
      : await prisma.motorCommission.create({
          data: {
            motorRequestId: motorRequest.id,
            premiumAmount,
            commissionRate: payload.commissionRate,
            commissionAmount: payload.commissionAmount,
            currency: motorRequest.pricingCurrency || "IQD",
            paid: true,
            paidAt: new Date(),
            paidById: user.id,
            paidByName: user.name ?? user.email ?? "User",
            notes: payload.notes || null
          }
        });

    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: "MOTOR_COMMISSION_PAID",
      entity: "MotorCommission",
      entityId: commission.id,
      ipAddress: getIpAddress(request.headers),
      metadata: {
        requestNumber: motorRequest.requestNumber,
        premiumAmount,
        commissionRate: payload.commissionRate,
        commissionAmount: payload.commissionAmount,
        currency: motorRequest.pricingCurrency || "IQD"
      }
    });

    return NextResponse.json({ success: true, commission });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("motorCommissionsWrite");
    const { id } = await params;
    const payload = cancelCommissionSchema.parse(await request.json());

    const motorRequest = await prisma.motorInsuranceRequest.findUnique({
      where: { id },
      select: {
        id: true,
        requestNumber: true,
        commission: {
          select: {
            id: true,
            paid: true,
            notes: true,
            commissionAmount: true,
            currency: true
          }
        }
      }
    });

    if (!motorRequest) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!motorRequest.commission) return NextResponse.json({ error: "No commission exists for this request." }, { status: 404 });
    if (!motorRequest.commission.paid) return NextResponse.json({ error: "Commission is already cancelled." }, { status: 409 });

    const cancelledAt = new Date();
    const cancellationNote = `إلغاء صرف العمولة: ${payload.reason}`;
    const notes = [motorRequest.commission.notes, cancellationNote].filter(Boolean).join("\n");

    const commission = await prisma.motorCommission.update({
      where: { id: motorRequest.commission.id },
      data: {
        paid: false,
        notes
      }
    });

    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: "MOTOR_COMMISSION_CANCELLED",
      entity: "MotorCommission",
      entityId: commission.id,
      ipAddress: getIpAddress(request.headers),
      metadata: {
        requestNumber: motorRequest.requestNumber,
        reason: payload.reason,
        cancelledAt: cancelledAt.toISOString(),
        commissionAmount: Number(motorRequest.commission.commissionAmount),
        currency: motorRequest.commission.currency
      }
    });

    return NextResponse.json({ success: true, commission });
  } catch (error) {
    return jsonError(error);
  }
}
