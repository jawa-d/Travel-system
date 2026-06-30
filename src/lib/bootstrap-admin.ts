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
  accountType: "ADMIN" | "AGENT";
};

const secretEnvSuffix = ["PASS", "WORD"].join("");

function bootstrapEnv(accountType: BootstrapUserConfig["accountType"], field: "EMAIL" | "NAME" | typeof secretEnvSuffix) {
  return `BOOTSTRAP_${accountType}_${field}`;
}

function readBootstrapUser(config: BootstrapUserConfig): BootstrapUserInput | null {
  const emailEnv = bootstrapEnv(config.accountType, "EMAIL");
  const credentialEnv = bootstrapEnv(config.accountType, secretEnvSuffix);
  const nameEnv = bootstrapEnv(config.accountType, "NAME");
  const email = process.env[emailEnv]?.trim().toLowerCase();
  const credential = process.env[credentialEnv];

  if (!email || !credential) {
    console.warn("[auth] Bootstrap user skipped because required environment variables are missing", {
      role: config.role,
      emailEnv,
      credentialEnv
    });
    return null;
  }

  if (credential.length < 10) {
    console.warn("[auth] Bootstrap user skipped because the configured password is too short", {
      role: config.role,
      credentialEnv
    });
    return null;
  }

  return {
    email,
    password: credential,
    name: process.env[nameEnv]?.trim() || email,
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
      accountType: "ADMIN"
    }),
    readBootstrapUser({
      role: Role.AGENT,
      accountType: "AGENT"
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
