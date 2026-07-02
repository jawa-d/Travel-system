import { Prisma } from "@prisma/client";

const REQUEST_PREFIX = "MTR-REQ";

export function motorRequestYear(date = new Date()) {
  return date.getFullYear();
}

export async function createMotorRequestNumber(tx: Prisma.TransactionClient, year: number) {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));
  const count = await tx.motorInsuranceRequest.count({
    where: {
      createdAt: {
        gte: start,
        lt: end
      }
    }
  });
  return `${REQUEST_PREFIX}-${year}-${String(count + 1).padStart(6, "0")}`;
}
