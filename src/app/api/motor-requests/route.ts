import { MotorRequestStatus, Prisma, Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireUser } from "@/lib/api";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { motorInsuranceRequestSchema } from "@/lib/validators";
import { createMotorRequestNumber, motorRequestYear } from "@/lib/motor-request-number";

async function getAgentSnapshot(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      active: true,
      role: true,
      agency: { select: { name: true } }
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (user.role !== Role.AGENT) {
      return NextResponse.json({ error: "Only logged-in agents can create motor insurance requests." }, { status: 403 });
    }

    const payload = motorInsuranceRequestSchema.parse(await request.json());
    const existing = await prisma.motorInsuranceRequest.findUnique({
      where: { submissionToken: payload.submissionToken },
      select: { id: true, requestNumber: true, status: true }
    });
    if (existing) {
      return NextResponse.json(
        {
          success: true,
          requestId: existing.id,
          id: existing.id,
          requestNumber: existing.requestNumber,
          status: existing.status,
          message: "Request submitted successfully"
        },
        { status: 200 }
      );
    }

    const agent = await getAgentSnapshot(user.id);
    if (!agent || !agent.active) {
      return NextResponse.json({ error: "Agent account is not active." }, { status: 401 });
    }

    const now = new Date();
    const createdTime = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Baghdad"
    }).format(now);
    const status = payload.intent === "draft" ? MotorRequestStatus.DRAFT : MotorRequestStatus.SUBMITTED;

    let created;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        created = await prisma.$transaction(async (tx) => {
          const requestNumber = await createMotorRequestNumber(tx, motorRequestYear(now));
          return tx.motorInsuranceRequest.create({
            data: {
              requestNumber,
              submissionToken: payload.submissionToken,
              status,
              customerFullName: payload.customer.fullName,
              customerMobile: payload.customer.mobile,
              customerEmail: payload.customer.email || null,
              customerNationalId: payload.customer.nationalId,
              customerAddress: payload.customer.address,
              customerCity: payload.customer.city,
              vehicleType: payload.vehicle.vehicleType,
              manufacturer: payload.vehicle.manufacturer,
              model: payload.vehicle.model,
              manufacturingYear: payload.vehicle.manufacturingYear,
              color: payload.vehicle.color,
              plateNumber: payload.vehicle.plateNumber,
              chassisNumber: payload.vehicle.chassisNumber,
              engineNumber: payload.vehicle.engineNumber,
              estimatedVehicleValue: payload.vehicle.estimatedVehicleValue,
              vehicleImages: payload.vehicleImages,
              customerDocuments: payload.documents,
              notes: payload.notes || null,
              source: "Internal",
              agentId: agent.id,
              agentName: agent.name ?? "Agent",
              agentEmail: agent.email,
              agentRole: agent.role,
              agentAgency: agent.agency?.name ?? null,
              userId: user.id,
              createdDate: now,
              createdTime
            },
            select: {
              id: true,
              requestNumber: true,
              status: true,
              createdAt: true,
              createdTime: true
            }
          });
        });
        break;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002" &&
          attempt < 2
        ) {
          continue;
        }
        throw error;
      }
    }

    if (!created) throw new Error("Unable to create request.");

    await writeAuditLog({
      userId: user.id,
      role: user.role,
      agency: agent.agency?.name ?? null,
      action: "MOTOR_REQUEST_CREATED",
      entity: "MotorInsuranceRequest",
      entityId: created.id,
      ipAddress: getIpAddress(request.headers),
      metadata: { requestNumber: created.requestNumber, status: created.status }
    });

    return NextResponse.json(
      {
        success: true,
        requestId: created.id,
        id: created.id,
        requestNumber: created.requestNumber,
        status: created.status,
        createdAt: created.createdAt,
        createdTime: created.createdTime,
        message: "Request submitted successfully"
      },
      { status: 201 }
    );
  } catch (error) {
    return jsonError(error);
  }
}
