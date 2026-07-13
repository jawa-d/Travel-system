import { ReferralStatus, Role } from "@prisma/client";
import { del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requirePermission, requireUser } from "@/lib/api";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { referralStatusSchema, referralUpdateSchema } from "@/lib/referrals";

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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (user.role !== Role.SUPER_ADMIN) return NextResponse.json({ error: "Only General Manager can edit referral details." }, { status: 403 });
    const { id } = await params;
    const payload = referralUpdateSchema.parse(await request.json());
    const installments = payload.installments as Array<{ label?: string | null; amount?: number | null; dueDate?: Date | null }>;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.referralInstallment.deleteMany({ where: { referralId: id } });
      return tx.referral.update({
        where: { id },
        data: {
          type: payload.type,
          status: payload.status,
          issuedAt: payload.status === ReferralStatus.ISSUED ? new Date() : payload.status ? null : undefined,
          applicantName: payload.applicantName || null,
          beneficiaryName: payload.beneficiaryName || null,
          insuredAmount: payload.insuredAmount,
          insuranceFrom: payload.insuranceFrom,
          insuranceTo: payload.insuranceTo,
          totalInsuredAfterIncrease: payload.totalInsuredAfterIncrease,
          increaseRate: payload.increaseRate,
          coverType: payload.coverType || null,
          cargoDescription: payload.cargoDescription || null,
          routeFrom: payload.routeFrom || null,
          routeTo: payload.routeTo || null,
          transportMode: payload.transportMode,
          packagingType: payload.packagingType || null,
          lcNumber: payload.lcNumber || null,
          carrierName: payload.carrierName || null,
          invoiceNumber: payload.invoiceNumber || null,
          currency: payload.currency,
          extraRisks: payload.extraRisks,
          hasPreviousCompensation: payload.hasPreviousCompensation,
          totalPremium: payload.totalPremium,
          notes: payload.notes || null,
          installments: {
            create: installments
              .filter((item) => item.label || item.amount)
              .map((item, index) => ({
                label: item.label || `دفعة ${index + 1}`,
                amount: item.amount ?? null,
                dueDate: item.dueDate ?? null
              }))
          }
        },
        select: { id: true, referralNumber: true, status: true }
      });
    });

    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: "REFERRAL_UPDATED",
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("referralsDelete");
    const { id } = await params;
    const existing = await prisma.referral.findUnique({ where: { id }, select: { referralNumber: true, takafulAttachments: true } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.referral.delete({ where: { id } });
    const attachmentUrls = Array.isArray(existing.takafulAttachments)
      ? existing.takafulAttachments
          .filter((item): item is { url: string } => Boolean(item && typeof item === "object" && "url" in item && typeof (item as { url?: unknown }).url === "string"))
          .map((item) => item.url)
      : [];
    await Promise.allSettled(attachmentUrls.map((url) => del(url)));
    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: "REFERRAL_DELETED",
      entity: "Referral",
      entityId: id,
      ipAddress: getIpAddress(request.headers),
      metadata: { referralNumber: existing.referralNumber }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
