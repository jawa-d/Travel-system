CREATE TYPE "PortalRequestType" AS ENUM (
  'MOTOR',
  'CIVIL_LIABILITY',
  'TRAVEL',
  'BUILDING_GLASS',
  'FIDELITY_GUARANTEE',
  'CASH_IN_SAFE',
  'CONTRACTORS_ALL_RISKS',
  'PERSONAL_ACCIDENT',
  'WORKERS_COMPENSATION'
);

ALTER TABLE "MotorInsuranceRequest"
  ADD COLUMN "requestType" "PortalRequestType" NOT NULL DEFAULT 'MOTOR',
  ADD COLUMN "portalPayload" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "portalAttachments" JSONB NOT NULL DEFAULT '[]',
  ALTER COLUMN "customerNationalId" DROP NOT NULL,
  ALTER COLUMN "customerAddress" DROP NOT NULL,
  ALTER COLUMN "customerCity" DROP NOT NULL,
  ALTER COLUMN "vehicleType" DROP NOT NULL,
  ALTER COLUMN "manufacturer" DROP NOT NULL,
  ALTER COLUMN "model" DROP NOT NULL,
  ALTER COLUMN "manufacturingYear" DROP NOT NULL,
  ALTER COLUMN "color" DROP NOT NULL,
  ALTER COLUMN "plateNumber" DROP NOT NULL,
  ALTER COLUMN "chassisNumber" DROP NOT NULL,
  ALTER COLUMN "engineNumber" DROP NOT NULL,
  ALTER COLUMN "estimatedVehicleValue" DROP NOT NULL;

CREATE INDEX "MotorInsuranceRequest_requestType_idx" ON "MotorInsuranceRequest"("requestType");
