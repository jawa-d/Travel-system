import { Prisma } from "@prisma/client";

const REQUEST_PREFIX = "MTR-REQ";
const REQUEST_NUMBER_PADDING = 6;

export function motorRequestYear(date = new Date()) {
  return date.getFullYear();
}

export async function createMotorRequestNumber(tx: Prisma.TransactionClient, year: number) {
  const prefix = `${REQUEST_PREFIX}-${year}-`;

  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`motor-request-number:${year}`}))`;
  await tx.$executeRawUnsafe("CREATE SEQUENCE IF NOT EXISTS motor_request_number_seq");

  const rows = await tx.$queryRaw<Array<{ nextval: bigint }>>`SELECT nextval('motor_request_number_seq') AS nextval`;
  const sequenceValue = Number(rows[0]?.nextval ?? 0);

  return `${prefix}${String(sequenceValue).padStart(REQUEST_NUMBER_PADDING, "0")}`;
}
