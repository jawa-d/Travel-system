import type { MotorRequestStatus, Prisma, Role } from "@prisma/client";

export type MotorRequestUserScope = {
  id: string;
  role: Role;
};

export type MotorRequestListItem = {
  id: string;
  requestNumber: string;
  status: MotorRequestStatus;
  customerFullName: string;
  manufacturer: string;
  model: string;
  plateNumber: string;
  estimatedVehicleValue: string;
  insurancePremium: string;
  netPremium: string;
  pricingCurrency: string;
  commission: {
    id: string;
    paid: boolean;
    commissionAmount: string;
  } | null;
  createdDate: string;
  createdTime: string;
};

export type MotorRequestDetail = Prisma.MotorInsuranceRequestGetPayload<Record<string, never>>;

export type PortalMotorRequest = {
  id: string;
  requestNumber: string;
  status: string;
  customerFullName: string;
  manufacturer: string;
  model: string;
  plateNumber: string;
  [key: string]: unknown;
};
