import { Prisma } from "@prisma/client";

const REQUEST_PREFIX = "MTR-REQ";
const REQUEST_NUMBER_PADDING = 6;

export function motorRequestYear(date = new Date()) {
  return date.getFullYear();
}

export async function createMotorRequestNumber(tx: Prisma.TransactionClient, year: number) {
  const prefix = `${REQUEST_PREFIX}-${year}-`;

  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`motor-request-number:${year}`}))`;

  const latest = await tx.motorInsuranceRequest.findFirst({
    where: {
      requestNumber: { startsWith: prefix }
    },
    orderBy: { requestNumber: "desc" },
    select: { requestNumber: true }
  });

  const latestSequence = latest?.requestNumber.startsWith(prefix)
    ? Number.parseInt(latest.requestNumber.slice(prefix.length), 10)
    : 0;
  const nextSequence = Number.isFinite(latestSequence) ? latestSequence + 1 : 1;

  return `${prefix}${String(nextSequence).padStart(REQUEST_NUMBER_PADDING, "0")}`;
}
