import { ReferralStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requirePermission } from "@/lib/api";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { referralStatusSchema } from "@/lib/referrals";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("referralsManage");
    const { id } = await params;
    const payload = referralStatusSchema.parse(await request.json());
    const updated = await prisma.referral.update({
      where: { id },
      data: {
        status: payload.status,
        issuedAt: payload.status === ReferralStatus.ISSUED ? new Date() : null
      },
      select: { id: true, referralNumber: true, status: true }
    });

    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: "REFERRAL_STATUS_UPDATED",
      entity: "Referral",
      entityId: id,
      ipAddress: getIpAddress(request.headers),
      metadata: { referralNumber: updated.referralNumber, status: updated.status }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return jsonError(error);
  }
}
