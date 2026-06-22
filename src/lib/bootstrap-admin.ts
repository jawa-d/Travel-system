import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

let bootstrapPromise: Promise<void> | null = null;

async function bootstrapAdminWhenDatabaseIsEmpty() {
  const userCount = await prisma.user.count();
  if (userCount > 0) return;

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "System Administrator";

  if (!email || !password) {
    console.error("[auth] Database has no users and bootstrap admin credentials are not configured", {
      requiredVariables: ["BOOTSTRAP_ADMIN_EMAIL", "BOOTSTRAP_ADMIN_PASSWORD"]
    });
    return;
  }

  if (password.length < 12) {
    console.error("[auth] BOOTSTRAP_ADMIN_PASSWORD must contain at least 12 characters");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name,
      email,
      passwordHash,
      role: Role.SUPER_ADMIN,
      active: true
    }
  });

  console.info("[auth] Bootstrap administrator created", { email });
}

export function ensureBootstrapAdmin() {
  bootstrapPromise ??= bootstrapAdminWhenDatabaseIsEmpty().catch((error) => {
    bootstrapPromise = null;
    console.error("[auth] Failed to bootstrap administrator", error);
    throw error;
  });
  return bootstrapPromise;
}
