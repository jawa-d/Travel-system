import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requirePermission } from "@/lib/api";
import { countrySchema } from "@/lib/validators";
import { deleteDemoCountry, updateDemoCountry } from "@/lib/demo-country-store";
import { isDirectAccessEnabled } from "@/lib/direct-access";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = countrySchema.parse(await request.json());
    if (isDirectAccessEnabled()) {
      const country = updateDemoCountry(id, data);
      if (!country) return NextResponse.json({ error: "الدولة غير موجودة" }, { status: 404 });
      return NextResponse.json(country);
    }
    await requirePermission("countriesWrite");
    const country = await prisma.country.update({ where: { id }, data });
    return NextResponse.json(country);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (isDirectAccessEnabled()) {
      if (!deleteDemoCountry(id)) return NextResponse.json({ error: "الدولة غير موجودة" }, { status: 404 });
      return NextResponse.json({ ok: true });
    }
    await requirePermission("countriesWrite");
    await prisma.country.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
