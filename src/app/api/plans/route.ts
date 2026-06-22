import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requirePermission, requireUser } from "@/lib/api";
import { planSchema } from "@/lib/validators";
import { createDemoPlan, getDemoPlans } from "@/lib/demo-plan-store";
import { isDirectAccessEnabled } from "@/lib/direct-access";

export async function GET() {
  if (isDirectAccessEnabled()) return NextResponse.json(getDemoPlans());
  await requireUser();
  return NextResponse.json(await prisma.travelPlan.findMany({ orderBy: { createdAt: "desc" } }));
}

export async function POST(request: NextRequest) {
  try {
    if (isDirectAccessEnabled()) {
      const data = planSchema.parse(await request.json());
      return NextResponse.json(createDemoPlan(data), { status: 201 });
    }
    const user = await requirePermission("plansWrite");
    const data = planSchema.parse(await request.json());
    const plan = await prisma.travelPlan.create({ data });
    await prisma.activity.create({ data: { actorId: user.id, action: "CREATE", entity: "TravelPlan", entityId: plan.id } });
    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
