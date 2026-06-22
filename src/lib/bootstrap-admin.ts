import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

let bootstrapPromise: Promise<void> | null = null;

async function bootstrapAdmin() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase() || "admin@trinsu.local";
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || "Admin@12345";
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "System Administrator";

  if (password.length < 10) {
    console.error("[auth] BOOTSTRAP_ADMIN_PASSWORD must contain at least 10 characters");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: Role.SUPER_ADMIN,
      active: true
    },
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
  bootstrapPromise ??= bootstrapAdmin().catch((error) => {
    bootstrapPromise = null;
    console.error("[auth] Failed to bootstrap administrator", error);
    throw error;
  });
  return bootstrapPromise;
}
