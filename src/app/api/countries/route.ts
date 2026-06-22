import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requirePermission, requireUser } from "@/lib/api";
import { countrySchema } from "@/lib/validators";
import { createDemoCountry, getDemoCountries } from "@/lib/demo-country-store";
import { isDirectAccessEnabled } from "@/lib/direct-access";

export async function GET() {
  if (isDirectAccessEnabled()) return NextResponse.json(getDemoCountries());
  await requireUser();
  return NextResponse.json(await prisma.country.findMany({ orderBy: [{ category: "asc" }, { nameAr: "asc" }] }));
}

export async function POST(request: NextRequest) {
  try {
    if (isDirectAccessEnabled()) {
      const data = countrySchema.parse(await request.json());
      return NextResponse.json(createDemoCountry(data), { status: 201 });
    }
    const user = await requirePermission("countriesWrite");
    const country = await prisma.country.create({ data: countrySchema.parse(await request.json()) });
    await prisma.activity.create({ data: { actorId: user.id, action: "CREATE", entity: "Country", entityId: country.id } });
    return NextResponse.json(country, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
