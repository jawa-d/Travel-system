import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { can, type Permission } from "@/lib/rbac";
import { directAccessUser, isDirectAccessEnabled } from "@/lib/direct-access";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  const session = await auth();
  const user = session?.user ?? (isDirectAccessEnabled() ? directAccessUser : null);
  if (!user) throw new Response("Unauthorized", { status: 401 });
  if (user.id !== directAccessUser.id) {
    const account = await prisma.user.findUnique({ where: { id: user.id }, select: { active: true } });
    if (!account?.active) throw new Response("Unauthorized", { status: 401 });
  }
  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser();
  if (!can(user.role, permission)) throw new Response("Forbidden", { status: 403 });
  return user;
}

export function jsonError(error: unknown) {
  if (error instanceof Response) return error;
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues.map((issue) => issue.message).join("، ") },
      { status: 400 }
    );
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json({ error: "السجل موجود مسبقا" }, { status: 409 });
  }
  const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع";
  return NextResponse.json({ error: message }, { status: 400 });
}
