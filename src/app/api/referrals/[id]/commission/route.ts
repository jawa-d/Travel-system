import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, requirePermission } from "@/lib/api";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { commissionAmount, referralCommissionSchema } from "@/lib/referrals";

const cancelCommissionSchema = z.object({
  reason: z.string().trim().min(3, "Cancellation reason is required.").max(2000)
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("referralCommissionsWrite");
    const { id } = await params;
    const payload = referralCommissionSchema.parse(await request.json());
    const referral = await prisma.referral.findUnique({
      where: { id },
      select: {
        id: true,
        referralNumber: true,
        status: true,
        currency: true,
        createdByName: true,
        createdByBank: true,
        commission: { select: { id: true, paid: true } }
      }
    });

    if (!referral) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (referral.status !== "ISSUED") return NextResponse.json({ error: "يجب إصدار الإحالة قبل صرف العمولة." }, { status: 400 });
    if (referral.commission?.paid) return NextResponse.json({ error: "تم صرف عمولة هذه الإحالة مسبقا." }, { status: 409 });

    const amount = commissionAmount(payload.premiumAmount, payload.commissionRate);
    const commission = referral.commission
      ? await prisma.referralCommission.update({
          where: { id: referral.commission.id },
          data: {
            premiumAmount: payload.premiumAmount,
            commissionRate: payload.commissionRate,
            commissionAmount: amount,
            currency: referral.currency,
            paid: true,
            paidAt: new Date(),
            paidById: user.id,
            paidByName: user.name ?? user.email ?? "User",
            paidToName: referral.createdByName,
            paidToBank: referral.createdByBank,
            notes: payload.notes || null
          }
        })
      : await prisma.referralCommission.create({
          data: {
            referralId: referral.id,
            premiumAmount: payload.premiumAmount,
            commissionRate: payload.commissionRate,
            commissionAmount: amount,
            currency: referral.currency,
            paidById: user.id,
            paidByName: user.name ?? user.email ?? "User",
            paidToName: referral.createdByName,
            paidToBank: referral.createdByBank,
            notes: payload.notes || null
          }
        });

    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: "REFERRAL_COMMISSION_PAID",
      entity: "ReferralCommission",
      entityId: commission.id,
      ipAddress: getIpAddress(request.headers),
      metadata: { referralNumber: referral.referralNumber, premiumAmount: payload.premiumAmount, commissionAmount: amount }
    });

    return NextResponse.json({ success: true, commission });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("referralCommissionsWrite");
    const { id } = await params;
    const payload = cancelCommissionSchema.parse(await request.json());
    const referral = await prisma.referral.findUnique({
      where: { id },
      select: {
        id: true,
        referralNumber: true,
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

    if (!referral) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!referral.commission) return NextResponse.json({ error: "No commission exists for this referral." }, { status: 404 });
    if (!referral.commission.paid) return NextResponse.json({ error: "Commission is already cancelled." }, { status: 409 });

    const cancelledAt = new Date();
    const cancellationNote = `إلغاء صرف العمولة: ${payload.reason}`;
    const notes = [referral.commission.notes, cancellationNote].filter(Boolean).join("\n");
    const commission = await prisma.referralCommission.update({
      where: { id: referral.commission.id },
      data: {
        paid: false,
        notes
      }
    });

    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: "REFERRAL_COMMISSION_CANCELLED",
      entity: "ReferralCommission",
      entityId: commission.id,
      ipAddress: getIpAddress(request.headers),
      metadata: {
        referralNumber: referral.referralNumber,
        reason: payload.reason,
        cancelledAt: cancelledAt.toISOString(),
        commissionAmount: Number(referral.commission.commissionAmount),
        currency: referral.commission.currency
      }
    });

    return NextResponse.json({ success: true, commission });
  } catch (error) {
    return jsonError(error);
  }
}
