import { NextRequest, NextResponse } from "next/server";
import { LookupCategory } from "@prisma/client";
import { z } from "zod";
import { jsonError, requirePermission, requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getIpAddress, writeAuditLog } from "@/lib/audit";

const lookupSchema = z.object({
  category: z.nativeEnum(LookupCategory),
  value: z.string().trim().min(1).max(80).transform((value) => value.toUpperCase().replace(/\s+/g, "_")),
  labelAr: z.string().trim().min(1).max(120),
  labelEn: z.string().trim().max(120).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0)
});

export async function GET(request: NextRequest) {
  try {
    await requireUser();
    const category = request.nextUrl.searchParams.get("category") as LookupCategory | null;
    const values = await prisma.lookupValue.findMany({
      where: { active: true, ...(category ? { category } : {}) },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { labelAr: "asc" }]
    });
    return NextResponse.json(values);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("lookupsManage");
    const data = lookupSchema.parse(await request.json());
    const value = await prisma.lookupValue.create({ data: { ...data, labelEn: data.labelEn || null, createdBy: user.id } });
    await writeAuditLog({
      userId: user.id, role: user.role, action: "LOOKUP_CREATED", entity: "LookupValue",
      entityId: value.id, ipAddress: getIpAddress(request.headers), metadata: { category: value.category, value: value.value }
    });
    return NextResponse.json(value, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
