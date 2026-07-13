import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { can, type Permission } from "@/lib/rbac";
import { directAccessUser, isDirectAccessEnabled } from "@/lib/direct-access";
import { prisma } from "@/lib/prisma";

export async function requirePagePermission(permission: Permission) {
  const session = await auth();
  const user = session?.user ?? (isDirectAccessEnabled() ? directAccessUser : null);
  if (!user) redirect("/login");
  if (user.id !== directAccessUser.id) {
    const account = await prisma.user.findUnique({ where: { id: user.id }, select: { active: true } }).catch((error) => {
      console.error("[auth] Failed to verify active user from database", { userId: user.id, error });
      return { active: "active" in user ? user.active !== false : true };
    });
    if (!account?.active) redirect("/login");
  }
  if (!can(user.role, permission)) {
    const currentPath = (await headers()).get("x-current-path") ?? "";
    const deniedUrl = new URLSearchParams({
      permission,
      from: currentPath || "unknown"
    });
    redirect(`/access-denied?${deniedUrl.toString()}`);
  }
  return user;
}
