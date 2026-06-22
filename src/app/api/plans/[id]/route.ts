import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requirePermission } from "@/lib/api";
import { planSchema } from "@/lib/validators";
import { deleteDemoPlan, updateDemoPlan } from "@/lib/demo-plan-store";
import { isDirectAccessEnabled } from "@/lib/direct-access";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = planSchema.parse(await request.json());
    if (isDirectAccessEnabled()) {
      const plan = updateDemoPlan(id, data);
      if (!plan) return NextResponse.json({ error: "الخطة غير موجودة" }, { status: 404 });
      return NextResponse.json(plan);
    }
    await requirePermission("plansWrite");
    const plan = await prisma.travelPlan.update({ where: { id }, data });
    return NextResponse.json(plan);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (isDirectAccessEnabled()) {
      if (!deleteDemoPlan(id)) return NextResponse.json({ error: "الخطة غير موجودة" }, { status: 404 });
      return NextResponse.json({ ok: true });
    }
    await requirePermission("plansWrite");
    await prisma.travelPlan.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
