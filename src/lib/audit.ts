import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function writeAuditLog(input: {
  userId?: string | null;
  role?: Role | null;
  agency?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const account = input.agency === undefined && input.userId
    ? await prisma.user.findUnique({
        where: { id: input.userId },
        select: { agency: { select: { name: true } } }
      })
    : null;
  await prisma.auditLog.create({
    data: {
      userId: input.userId ?? null,
      role: input.role ?? null,
      agency: input.agency ?? account?.agency?.name ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      ipAddress: input.ipAddress ?? null,
      metadata: input.metadata as Prisma.InputJsonValue | undefined
    }
  });
}

export function getIpAddress(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headers.get("x-real-ip") ?? "local";
}
