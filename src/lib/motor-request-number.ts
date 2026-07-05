import { Prisma } from "@prisma/client";

const REQUEST_PREFIX = "MTR-REQ";
const REQUEST_NUMBER_PADDING = 6;

export function motorRequestYear(date = new Date()) {
  return date.getFullYear();
}

export async function createMotorRequestNumber(tx: Prisma.TransactionClient, year: number) {
  const prefix = `${REQUEST_PREFIX}-${year}-`;

  const rows = await tx.$queryRaw<Array<{ nextval: bigint }>>`SELECT nextval('motor_request_number_seq') AS nextval`;
  const sequenceValue = rows[0]?.nextval;
  if (!sequenceValue) throw new Error("Unable to allocate motor request number.");

  return `${prefix}${sequenceValue.toString().padStart(REQUEST_NUMBER_PADDING, "0")}`;
}
