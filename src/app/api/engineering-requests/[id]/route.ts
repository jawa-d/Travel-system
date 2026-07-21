import { EngineeringRequestStatus, Prisma, Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { jsonError, requirePermission, requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const statusUpdateSchema = z.object({
  status: z.nativeEnum(EngineeringRequestStatus),
  managerNotes: z.string().trim().max(4000).optional().or(z.literal(""))
});

const MAX_DECIMAL_12_2_VALUE = 9_999_999_999.99;

const requestEditSchema = z.object({
  customer: z.object({
    fullName: z.string().trim().min(2).optional(),
    mobile: z.string().trim().min(7).optional(),
    email: z.string().trim().email().optional().or(z.literal("")),
    nationalId: z.string().trim().max(80).optional().or(z.literal("")),
    address: z.string().trim().max(300).optional().or(z.literal("")),
    city: z.string().trim().max(120).optional().or(z.literal(""))
  }).optional(),
  project: z.object({
    name: z.string().trim().min(2).optional(),
    type: z.string().trim().min(2).optional(),
    location: z.string().trim().min(2).optional(),
    contractValue: z.coerce.number().positive().max(MAX_DECIMAL_12_2_VALUE).optional(),
    currency: z.string().trim().min(3).max(8).optional(),
    insuranceType: z.string().trim().min(2).optional(),
    startDate: z.string().datetime().optional().or(z.literal("")),
    endDate: z.string().datetime().optional().or(z.literal("")),
    contractorName: z.string().trim().max(200).optional().or(z.literal("")),
    ownerName: z.string().trim().max(200).optional().or(z.literal("")),
    riskDetails: z.string().trim().max(4000).optional().or(z.literal(""))
  }).optional(),
  coverageType: z.string().trim().max(120).optional().or(z.literal("")),
  coverageNotes: z.string().trim().max(4000).optional().or(z.literal("")),
  notes: z.string().trim().max(4000).optional().or(z.literal(""))
});

function canEditRequest(user: { role: Role }, request: { policyIssuedAt: Date | null; issuedPolicyNumber: string | null }) {
  if (user.role === Role.SUPER_ADMIN || user.role === Role.ADMIN) return true;
  return user.role === Role.UNDERWRITER && !request.policyIssuedAt && !request.issuedPolicyNumber;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("engineeringRequestsManage");
    const { id } = await params;
    const payload = statusUpdateSchema.parse(await request.json());
    const existing = await prisma.engineeringInsuranceRequest.findUnique({
      where: { id },
      select: { id: true, requestNumber: true, status: true }
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.engineeringInsuranceRequest.update({
      where: { id },
      data: {
        status: payload.status,
        managerNotes: payload.managerNotes || null,
        reviewedById: user.id,
        reviewedByName: user.name ?? user.email ?? "Manager",
        reviewedAt: new Date()
      }
    });

    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: "ENGINEERING_REQUEST_STATUS_UPDATED",
      entity: "EngineeringInsuranceRequest",
      entityId: updated.id,
      ipAddress: getIpAddress(request.headers),
      metadata: { requestNumber: updated.requestNumber, previousStatus: existing.status, status: updated.status }
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const payload = requestEditSchema.parse(await request.json());
    const existing = await prisma.engineeringInsuranceRequest.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canEditRequest(user, existing)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const editHistory = Array.isArray(existing.editHistory) ? existing.editHistory : [];
    const data: Prisma.EngineeringInsuranceRequestUpdateInput = {
      customerFullName: payload.customer?.fullName,
      customerMobile: payload.customer?.mobile,
      customerEmail: payload.customer?.email === undefined ? undefined : payload.customer.email || null,
      customerNationalId: payload.customer?.nationalId === undefined ? undefined : payload.customer.nationalId || null,
      customerAddress: payload.customer?.address === undefined ? undefined : payload.customer.address || null,
      customerCity: payload.customer?.city === undefined ? undefined : payload.customer.city || null,
      projectName: payload.project?.name,
      projectType: payload.project?.type,
      projectLocation: payload.project?.location,
      contractValue: payload.project?.contractValue,
      currency: payload.project?.currency,
      insuranceType: payload.project?.insuranceType,
      startDate: payload.project?.startDate === undefined ? undefined : payload.project.startDate ? new Date(payload.project.startDate) : null,
      endDate: payload.project?.endDate === undefined ? undefined : payload.project.endDate ? new Date(payload.project.endDate) : null,
      contractorName: payload.project?.contractorName === undefined ? undefined : payload.project.contractorName || null,
      ownerName: payload.project?.ownerName === undefined ? undefined : payload.project.ownerName || null,
      riskDetails: payload.project?.riskDetails === undefined ? undefined : payload.project.riskDetails || null,
      coverageType: payload.coverageType === undefined ? undefined : payload.coverageType || null,
      coverageNotes: payload.coverageNotes === undefined ? undefined : payload.coverageNotes || null,
      notes: payload.notes === undefined ? undefined : payload.notes || null,
      editHistory: [
        ...editHistory,
        {
          editedAt: new Date().toISOString(),
          editedById: user.id,
          editedByName: user.name ?? user.email ?? "User",
          previous: {
            customerFullName: existing.customerFullName,
            customerMobile: existing.customerMobile,
            customerEmail: existing.customerEmail,
            customerNationalId: existing.customerNationalId,
            customerAddress: existing.customerAddress,
            customerCity: existing.customerCity,
            projectName: existing.projectName,
            projectType: existing.projectType,
            projectLocation: existing.projectLocation,
            contractValue: String(existing.contractValue),
            currency: existing.currency,
            insuranceType: existing.insuranceType,
            contractorName: existing.contractorName,
            ownerName: existing.ownerName,
            riskDetails: existing.riskDetails,
            coverageType: existing.coverageType,
            coverageNotes: existing.coverageNotes,
            notes: existing.notes
          }
        }
      ] as Prisma.InputJsonValue
    };

    const updated = await prisma.engineeringInsuranceRequest.update({ where: { id }, data });
    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: "ENGINEERING_REQUEST_EDITED",
      entity: "EngineeringInsuranceRequest",
      entityId: id,
      ipAddress: getIpAddress(request.headers),
      metadata: { requestNumber: existing.requestNumber }
    });
    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const existing = await prisma.engineeringInsuranceRequest.findUnique({
      where: { id },
      select: { id: true, requestNumber: true }
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.engineeringInsuranceRequest.delete({ where: { id } });
    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: "ENGINEERING_REQUEST_DELETED",
      entity: "EngineeringInsuranceRequest",
      entityId: id,
      ipAddress: getIpAddress(request.headers),
      metadata: { requestNumber: existing.requestNumber }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
