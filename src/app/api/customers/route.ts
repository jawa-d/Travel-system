import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/validators";
import { jsonError, requirePermission, requireUser } from "@/lib/api";
import { directAccessUser } from "@/lib/direct-access";

export async function GET(request: NextRequest) {
  try {
    await requireUser();
    const q = request.nextUrl.searchParams.get("q") ?? "";
    const customers = await prisma.customer.findMany({
      where: q
        ? {
            OR: [
              { passportNumber: { contains: q, mode: "insensitive" } },
              { arabicName: { contains: q, mode: "insensitive" } },
              { englishName: { contains: q, mode: "insensitive" } }
            ]
          }
        : undefined,
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
    const customer = await prisma.customer.create({ data });
    await prisma.activity.create({
      data: {
        actorId: user.id === directAccessUser.id ? null : user.id,
        action: "CREATE",
        entity: "Customer",
        entityId: customer.id
      }
    });
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
