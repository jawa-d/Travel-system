import { NextRequest, NextResponse } from "next/server";
import { jsonError, requirePermission } from "@/lib/api";
import { createEngineeringInsuranceRequest, parseEngineeringRequestJson } from "@/lib/engineering-requests";

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("engineeringRequestsManage");
    const parsed = parseEngineeringRequestJson(await request.json());
    const created = await createEngineeringInsuranceRequest({
      ...parsed,
      agentCode: user.name ?? user.email ?? "Internal"
    }, "Internal");

    return NextResponse.json({ success: true, request: created }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
