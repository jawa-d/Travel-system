import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requirePermission } from "@/lib/api";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { commissionAmount, referralCommissionSchema } from "@/lib/referrals";

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
        commission: { select: { id: true } }
      }
    });

    if (!referral) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (referral.status !== "ISSUED") return NextResponse.json({ error: "يجب إصدار الإحالة قبل صرف العمولة." }, { status: 400 });
    if (referral.commission) return NextResponse.json({ error: "تم صرف عمولة هذه الإحالة مسبقا." }, { status: 409 });

    const amount = commissionAmount(payload.premiumAmount, payload.commissionRate);
    const commission = await prisma.referralCommission.create({
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
