import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [claims, endorsements] = await Promise.all([
    prisma.$queryRaw<Array<{ status: string; count: bigint }>>`
      SELECT "status"::text AS status, COUNT(*)::bigint AS count
      FROM "Claim" GROUP BY "status"
    `,
    prisma.$queryRaw<Array<{ status: string; count: bigint }>>`
      SELECT "status"::text AS status, COUNT(*)::bigint AS count
      FROM "Endorsement" GROUP BY "status"
    `
  ]);
  console.log(JSON.stringify({
    claims: claims.map((item) => ({ status: item.status, count: Number(item.count) })),
    endorsements: endorsements.map((item) => ({ status: item.status, count: Number(item.count) }))
  }));
}

main().finally(() => prisma.$disconnect());
