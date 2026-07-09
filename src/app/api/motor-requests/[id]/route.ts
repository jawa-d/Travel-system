import { MotorRequestStatus, Prisma, Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, requirePermission, requireUser } from "@/lib/api";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { deleteMotorBlobFiles } from "@/lib/public-api/motor-files";

const MAX_DECIMAL_12_2_VALUE = 9_999_999_999.99;

const statusUpdateSchema = z.object({
  status: z.nativeEnum(MotorRequestStatus),
  managerNotes: z.string().trim().max(4000).optional().or(z.literal(""))
}).refine((data) => data.status !== MotorRequestStatus.DRAFT, {
  message: "Draft status cannot be assigned from management."
});

const requestEditSchema = z.object({
  customer: z.object({
    fullName: z.string().trim().min(2).optional(),
    mobile: z.string().trim().min(7).optional(),
    email: z.string().trim().email().optional().or(z.literal("")),
    nationalId: z.string().trim().min(4).optional(),
    address: z.string().trim().min(2).optional(),
    city: z.string().trim().min(2).optional()
  }).optional(),
  vehicle: z.object({
    vehicleType: z.string().trim().min(1).optional(),
    manufacturer: z.string().trim().min(1).optional(),
    model: z.string().trim().min(1).optional(),
    manufacturingYear: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1).optional(),
    color: z.string().trim().min(1).optional(),
    plateNumber: z.string().trim().min(1).optional(),
    chassisNumber: z.string().trim().min(4).optional(),
    engineNumber: z.string().trim().min(3).optional(),
    estimatedVehicleValue: z.coerce.number()
      .finite("Estimated vehicle value must be a valid number")
      .positive("Estimated vehicle value is required")
      .max(MAX_DECIMAL_12_2_VALUE, "Estimated vehicle value exceeds the maximum allowed amount")
      .optional()
  }).optional(),
  coverageType: z.string().trim().max(120).optional().or(z.literal("")),
  coverageNotes: z.string().trim().max(4000).optional().or(z.literal("")),
  notes: z.string().trim().max(4000).optional().or(z.literal(""))
});

function canEditRequest(user: { role: Role }, request: { policyIssuedAt: Date | null }) {
  if (user.role === Role.SUPER_ADMIN || user.role === Role.ADMIN) return true;
  return user.role === Role.UNDERWRITER && !request.policyIssuedAt;
}

function canDeleteRequest(user: { role: Role }, request: { policyIssuedAt: Date | null; issuedPolicyNumber: string | null }) {
  return user.role === Role.SUPER_ADMIN && !request.policyIssuedAt && !request.issuedPolicyNumber;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("motorRequestsManage");
    const { id } = await params;
    const payload = statusUpdateSchema.parse(await request.json());
    const existing = await prisma.motorInsuranceRequest.findUnique({
      where: { id },
      select: { id: true, requestNumber: true, status: true }
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.motorInsuranceRequest.update({
      where: { id },
      data: {
        status: payload.status,
        managerNotes: payload.managerNotes || null,
        reviewedById: user.id,
        reviewedByName: user.name ?? user.email ?? "Manager",
        reviewedAt: new Date(),
        approvedById: payload.status === MotorRequestStatus.APPROVED ? user.id : undefined,
        approvedByName: payload.status === MotorRequestStatus.APPROVED ? user.name ?? user.email ?? "Manager" : undefined,
        approvedAt: payload.status === MotorRequestStatus.APPROVED ? new Date() : undefined
      },
      select: {
        id: true,
        requestNumber: true,
        status: true,
        managerNotes: true,
        reviewedByName: true,
        reviewedAt: true
      }
    });

    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: "MOTOR_REQUEST_STATUS_UPDATED",
      entity: "MotorInsuranceRequest",
      entityId: updated.id,
      ipAddress: getIpAddress(request.headers),
      metadata: {
        requestNumber: updated.requestNumber,
        previousStatus: existing.status,
        status: updated.status
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const payload = requestEditSchema.parse(await request.json());
    const existing = await prisma.motorInsuranceRequest.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canEditRequest(user, existing)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const editHistory = Array.isArray(existing.editHistory) ? existing.editHistory : [];
    const data: Prisma.MotorInsuranceRequestUpdateInput = {
      customerFullName: payload.customer?.fullName,
      customerMobile: payload.customer?.mobile,
      customerEmail: payload.customer?.email === undefined ? undefined : payload.customer.email || null,
      customerNationalId: payload.customer?.nationalId,
      customerAddress: payload.customer?.address,
      customerCity: payload.customer?.city,
      vehicleType: payload.vehicle?.vehicleType,
      manufacturer: payload.vehicle?.manufacturer,
      model: payload.vehicle?.model,
      manufacturingYear: payload.vehicle?.manufacturingYear,
      color: payload.vehicle?.color,
      plateNumber: payload.vehicle?.plateNumber,
      chassisNumber: payload.vehicle?.chassisNumber,
      engineNumber: payload.vehicle?.engineNumber,
      estimatedVehicleValue: payload.vehicle?.estimatedVehicleValue,
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
            vehicleType: existing.vehicleType,
            manufacturer: existing.manufacturer,
            model: existing.model,
            manufacturingYear: existing.manufacturingYear,
            color: existing.color,
            plateNumber: existing.plateNumber,
            chassisNumber: existing.chassisNumber,
            engineNumber: existing.engineNumber,
            estimatedVehicleValue: String(existing.estimatedVehicleValue),
            coverageType: existing.coverageType,
            coverageNotes: existing.coverageNotes,
            notes: existing.notes
          }
        }
      ] as Prisma.InputJsonValue
    };

    const updated = await prisma.motorInsuranceRequest.update({ where: { id }, data });
    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: "MOTOR_REQUEST_EDITED",
      entity: "MotorInsuranceRequest",
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
    const { id } = await params;
    const existing = await prisma.motorInsuranceRequest.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canDeleteRequest(user, existing)) {
      return NextResponse.json({ error: "Issued requests cannot be deleted." }, { status: 403 });
    }

    const files = [
      ...((existing.vehicleImages as unknown[]) ?? []),
      ...((existing.customerDocuments as unknown[]) ?? []),
      existing.underwriterSignature,
      existing.managerSignature,
      existing.companyStamp
    ].filter(Boolean);
    await deleteMotorBlobFiles(files);
    await prisma.motorInsuranceRequest.delete({ where: { id } });
    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: "MOTOR_REQUEST_DELETED",
      entity: "MotorInsuranceRequest",
      entityId: id,
      ipAddress: getIpAddress(request.headers),
      metadata: { requestNumber: existing.requestNumber }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
