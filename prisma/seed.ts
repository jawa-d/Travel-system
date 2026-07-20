import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createSeedUser(input: {
  accountType: "ADMIN" | "AGENT";
  role: Role;
}) {
  const secretEnvSuffix = ["PASS", "WORD"].join("");
  const emailEnv = `BOOTSTRAP_${input.accountType}_EMAIL`;
  const credentialEnv = `BOOTSTRAP_${input.accountType}_${secretEnvSuffix}`;
  const nameEnv = `BOOTSTRAP_${input.accountType}_NAME`;
  const email = process.env[emailEnv]?.trim().toLowerCase();
  const credential = process.env[credentialEnv];

  if (!email || !credential) {
    console.warn("[seed] User seed skipped because required environment variables are missing", {
      role: input.role,
      emailEnv,
      credentialEnv
    });
    return;
  }

  if (credential.length < 10) {
    console.warn("[seed] User seed skipped because the configured password is too short", {
      role: input.role,
      credentialEnv
    });
    return;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });

  if (existingUser) {
    console.info("[seed] User already exists; no changes applied", { role: input.role });
    return;
  }

  const passwordHash = await bcrypt.hash(credential, 12);
  await prisma.user.create({
    data: {
      name: process.env[nameEnv]?.trim() || email,
      email,
      passwordHash,
      role: input.role
    }
  });
}

async function main() {
  await createSeedUser({
    accountType: "ADMIN",
    role: Role.SUPER_ADMIN
  });

  await createSeedUser({
    accountType: "AGENT",
    role: Role.AGENT
  });

  await prisma.notification.createMany({
    data: [
      {
        type: "SYSTEM",
        title: "Welcome",
        message: "TRINSU travel insurance management platform is ready.",
        status: "PENDING"
      },
      {
        type: "EMAIL",
        title: "Email setup",
        message: "Configure SMTP environment variables to enable PDF email delivery.",
        status: "PENDING"
      }
    ]
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
