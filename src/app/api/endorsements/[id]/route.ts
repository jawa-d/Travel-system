import { NextRequest, NextResponse } from "next/server";
import { EndorsementStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonError, requirePermission } from "@/lib/api";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { updateDemoEndorsementStatus, type DemoEndorsementStatus } from "@/lib/demo-endorsement-store";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const allowed = ["DRAFT", "APPROVED", "REJECTED"];
    if (!allowed.includes(body.status)) return NextResponse.json({ error: "حالة الملحق غير صحيحة" }, { status: 400 });
    if (isDirectAccessEnabled()) {
      const item = updateDemoEndorsementStatus(id, body.status as DemoEndorsementStatus);
      if (!item) return NextResponse.json({ error: "الملحق غير موجود" }, { status: 404 });
      return NextResponse.json(item);
    }
    await requirePermission("endorsementsWrite");
    return NextResponse.json(await prisma.endorsement.update({
      where: { id },
      data: { status: body.status as EndorsementStatus }
    }));
  } catch (error) {
    return jsonError(error);
  }
}
