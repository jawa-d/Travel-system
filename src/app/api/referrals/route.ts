import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requirePermission } from "@/lib/api";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { createReferralNumber, referralSchema } from "@/lib/referrals";

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("referralsCreate");
    const payload = referralSchema.parse(await request.json());
    const account = user.id ? await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true, role: true, agency: { select: { name: true } } }
    }) : null;

    const installments = payload.installments as Array<{ label?: string | null; amount?: number | null; dueDate?: Date | null }>;
    const created = await prisma.referral.create({
      data: {
        referralNumber: createReferralNumber(),
        type: payload.type,
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
        createdById: user.id,
        createdByName: account?.name ?? user.name ?? "User",
        createdByEmail: account?.email ?? user.email ?? null,
        createdByRole: account?.role ?? user.role,
        createdByBank: account?.role === Role.BANK ? account.agency?.name ?? account.name ?? user.email ?? null : account?.agency?.name ?? null,
        installments: installments.length ? {
          create: installments
            .filter((item) => item.label || item.amount)
            .map((item, index) => ({
              label: item.label || `دفعة ${index + 1}`,
              amount: item.amount ?? null,
              dueDate: item.dueDate ?? null
            }))
        } : undefined
      },
      select: { id: true, referralNumber: true }
    });

    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: "REFERRAL_CREATED",
      entity: "Referral",
      entityId: created.id,
      ipAddress: getIpAddress(request.headers),
      metadata: { referralNumber: created.referralNumber }
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
