import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      role: "BANK",
      agency: { code: { startsWith: "IIB-" } }
    },
    select: {
      email: true,
      role: true,
      active: true,
      agency: { select: { code: true, name: true, active: true } }
    },
    orderBy: { email: "asc" }
  });

  console.log(JSON.stringify({ count: users.length, users }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
