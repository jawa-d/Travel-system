import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { getDemoAuditLogs } from "@/lib/demo-audit-store";

export async function GET() {
  if (isDirectAccessEnabled()) return NextResponse.json(getDemoAuditLogs());
  await requirePermission("auditRead");
  const logs = await prisma.auditLog.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json(logs);
}
