import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

let bootstrapPromise: Promise<void> | null = null;

type BootstrapUserInput = {
  email: string;
  password: string;
  name: string;
  role: Role;
};

type BootstrapUserConfig = {
  role: Role;
  emailEnv: "BOOTSTRAP_ADMIN_EMAIL" | "BOOTSTRAP_AGENT_EMAIL";
  passwordEnv: "BOOTSTRAP_ADMIN_PASSWORD" | "BOOTSTRAP_AGENT_PASSWORD";
  nameEnv: "BOOTSTRAP_ADMIN_NAME" | "BOOTSTRAP_AGENT_NAME";
};

function readBootstrapUser(config: BootstrapUserConfig): BootstrapUserInput | null {
  const email = process.env[config.emailEnv]?.trim().toLowerCase();
  const password = process.env[config.passwordEnv];

  if (!email || !password) {
    console.warn("[auth] Bootstrap user skipped because required environment variables are missing", {
      role: config.role,
      emailEnv: config.emailEnv,
      passwordEnv: config.passwordEnv
    });
    return null;
  }

  if (password.length < 10) {
    console.warn("[auth] Bootstrap user skipped because the configured password is too short", {
      role: config.role,
      passwordEnv: config.passwordEnv
    });
    return null;
  }

  return {
    email,
    password,
    name: process.env[config.nameEnv]?.trim() || email,
    role: config.role
  };
}

async function createBootstrapUserIfMissing(input: BootstrapUserInput) {
  const { email, password, name, role } = input;
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });

  if (existingUser) {
    console.info("[auth] Bootstrap user already exists; no changes applied", { role });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      active: true
    }
  });
  console.info("[auth] Bootstrap user created", { role });
}

async function bootstrapUsers() {
  const users = [
    readBootstrapUser({
      role: Role.SUPER_ADMIN,
      emailEnv: "BOOTSTRAP_ADMIN_EMAIL",
      passwordEnv: "BOOTSTRAP_ADMIN_PASSWORD",
      nameEnv: "BOOTSTRAP_ADMIN_NAME"
    }),
    readBootstrapUser({
      role: Role.AGENT,
      emailEnv: "BOOTSTRAP_AGENT_EMAIL",
      passwordEnv: "BOOTSTRAP_AGENT_PASSWORD",
      nameEnv: "BOOTSTRAP_AGENT_NAME"
    })
  ].filter((user): user is BootstrapUserInput => user !== null);

  for (const user of users) {
    await createBootstrapUserIfMissing(user);
  }
}

export function ensureBootstrapUsers() {
  bootstrapPromise ??= bootstrapUsers().catch((error) => {
    bootstrapPromise = null;
    console.error("[auth] Failed to bootstrap users", error);
    throw error;
  });
  return bootstrapPromise;
}
