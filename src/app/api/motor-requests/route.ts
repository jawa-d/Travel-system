import { MotorRequestStatus, Prisma, Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireUser } from "@/lib/api";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { motorInsuranceRequestSchema } from "@/lib/validators";

const REQUEST_PREFIX = "MTR-REQ";

function requestYear(date = new Date()) {
  return date.getFullYear();
}

async function createMotorRequestNumber(tx: Prisma.TransactionClient, year: number) {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));
  const count = await tx.motorInsuranceRequest.count({
    where: {
      createdAt: {
        gte: start,
        lt: end
      }
    }
  });
  return `${REQUEST_PREFIX}-${year}-${String(count + 1).padStart(6, "0")}`;
}

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
    if (existing) return NextResponse.json(existing, { status: 200 });

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
          const requestNumber = await createMotorRequestNumber(tx, requestYear(now));
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

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
