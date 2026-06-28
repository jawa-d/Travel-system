import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/validators";
import { jsonError, requirePermission, requireUser } from "@/lib/api";
import { directAccessUser } from "@/lib/direct-access";
import { getActorSnapshot, visibleCustomerWhere, visiblePolicyWhere } from "@/lib/policy-access";
import { getIpAddress, writeAuditLog } from "@/lib/audit";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const customer = await prisma.customer.findFirst({
      where: { AND: [{ id }, visibleCustomerWhere(user)] },
      include: {
        policies: {
          where: visiblePolicyWhere(user),
          include: { travelPlan: true, destinationCountry: true },
          orderBy: { createdAt: "desc" }
        }
      }
    });
    if (!customer) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }
    return NextResponse.json(customer);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("customersWrite");
    const { id } = await params;
    const data = customerSchema.parse(await request.json());
    const accessibleCustomer = await prisma.customer.findFirst({
      where: { AND: [{ id }, visibleCustomerWhere(user)] },
      select: { id: true }
    });
    if (!accessibleCustomer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const customer = await prisma.customer.update({ where: { id }, data });
    const actor = await getActorSnapshot(user);
    await prisma.activity.create({
      data: {
        actorId: user.id === directAccessUser.id ? null : user.id,
        action: "UPDATE",
        entity: "Customer",
        entityId: customer.id
      }
    });
    await writeAuditLog({
      userId: user.id === directAccessUser.id ? null : user.id,
      role: user.role,
      agency: actor.agencyName,
      action: "CUSTOMER_UPDATED",
      entity: "Customer",
      entityId: customer.id,
      ipAddress: getIpAddress(request.headers)
    });
    return NextResponse.json(customer);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("customersDelete");
    const { id } = await params;
    const customer = await prisma.customer.findFirst({
      where: { AND: [{ id }, visibleCustomerWhere(user)] },
      select: { id: true, _count: { select: { policies: true, claims: true } } }
    });

    if (!customer) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }
    if (customer._count.policies > 0 || customer._count.claims > 0) {
      return NextResponse.json(
        { error: "لا يمكن حذف العميل لوجود وثائق أو مطالبات مرتبطة به." },
        { status: 409 }
      );
    }

    const actor = await getActorSnapshot(user);
    await prisma.$transaction([
      prisma.customer.delete({ where: { id } }),
      prisma.activity.create({
        data: {
          actorId: user.id === directAccessUser.id ? null : user.id,
          action: "DELETE",
          entity: "Customer",
          entityId: id
        }
      })
    ]);
    await writeAuditLog({
      userId: user.id === directAccessUser.id ? null : user.id,
      role: user.role,
      agency: actor.agencyName,
      action: "CUSTOMER_DELETED",
      entity: "Customer",
      entityId: id
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
