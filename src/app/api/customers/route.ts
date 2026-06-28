import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/validators";
import { jsonError, requirePermission, requireUser } from "@/lib/api";
import { directAccessUser } from "@/lib/direct-access";
import { getActorSnapshot, visibleCustomerWhere } from "@/lib/policy-access";
import { getIpAddress, writeAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const q = request.nextUrl.searchParams.get("q") ?? "";
    const customers = await prisma.customer.findMany({
      where: {
        AND: [
          visibleCustomerWhere(user),
          q ? {
            OR: [
              { passportNumber: { contains: q, mode: "insensitive" } },
              { arabicName: { contains: q, mode: "insensitive" } },
              { englishName: { contains: q, mode: "insensitive" } }
            ]
          } : {}
        ]
      },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    return NextResponse.json(customers);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = customerSchema.parse(await request.json());
    const user = await requirePermission("customersWrite");
    const actor = await getActorSnapshot(user);
    const customer = await prisma.customer.create({
      data: {
        ...data,
        createdByUserId: actor.userId === directAccessUser.id ? null : actor.userId,
        createdByName: actor.name,
        createdByEmail: actor.email,
        createdByRole: actor.role,
        createdByAgency: actor.agencyName
      }
    });
    await prisma.activity.create({
      data: {
        actorId: user.id === directAccessUser.id ? null : user.id,
        action: "CREATE",
        entity: "Customer",
        entityId: customer.id
      }
    });
    await writeAuditLog({
      userId: user.id === directAccessUser.id ? null : user.id,
      role: user.role,
      agency: actor.agencyName,
      action: "CUSTOMER_CREATED",
      entity: "Customer",
      entityId: customer.id,
      ipAddress: getIpAddress(request.headers)
    });
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
