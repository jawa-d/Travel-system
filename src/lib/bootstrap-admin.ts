import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

let bootstrapPromise: Promise<void> | null = null;

async function upsertBootstrapUser(input: {
  email: string;
  password: string;
  name: string;
  role: Role;
}) {
  const { email, password, name, role } = input;
  if (password.length < 10) {
    console.error("[auth] Bootstrap password must contain at least 10 characters", { email });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role,
      active: true
    },
    create: {
      name,
      email,
      passwordHash,
      role,
      active: true
    }
  });
}

async function bootstrapUsers() {
  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase() || "admin@trinsu.local";
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || "Admin@12345";
  const adminName = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "System Administrator";
  const agentEmail = process.env.BOOTSTRAP_AGENT_EMAIL?.trim().toLowerCase() || "agent@trinsu.local";
  const agentPassword = process.env.BOOTSTRAP_AGENT_PASSWORD || "Agent@12345";
  const agentName = process.env.BOOTSTRAP_AGENT_NAME?.trim() || "Sales Agent";

  await upsertBootstrapUser({
    email: adminEmail,
    password: adminPassword,
    name: adminName,
    role: Role.SUPER_ADMIN
  });
  await upsertBootstrapUser({
    email: agentEmail,
    password: agentPassword,
    name: agentName,
    role: Role.AGENT
  });

  console.info("[auth] Bootstrap users are ready", { adminEmail, agentEmail });
}

export function ensureBootstrapUsers() {
  bootstrapPromise ??= bootstrapUsers().catch((error) => {
    bootstrapPromise = null;
    console.error("[auth] Failed to bootstrap users", error);
    throw error;
  });
  return bootstrapPromise;
}
