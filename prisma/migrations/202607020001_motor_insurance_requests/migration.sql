-- CreateEnum
CREATE TYPE "MotorRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateTable
CREATE TABLE "MotorInsuranceRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "submissionToken" TEXT NOT NULL,
    "status" "MotorRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "customerFullName" TEXT NOT NULL,
    "customerMobile" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerNationalId" TEXT NOT NULL,
    "customerAddress" TEXT NOT NULL,
    "customerCity" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "manufacturingYear" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "chassisNumber" TEXT NOT NULL,
    "engineNumber" TEXT NOT NULL,
    "estimatedVehicleValue" DECIMAL(12,2) NOT NULL,
    "vehicleImages" JSONB NOT NULL,
    "customerDocuments" JSONB NOT NULL,
    "notes" TEXT,
    "agentId" TEXT,
    "agentName" TEXT NOT NULL,
    "agentEmail" TEXT,
    "agentRole" "Role",
    "agentAgency" TEXT,
    "userId" TEXT,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MotorInsuranceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MotorInsuranceRequest_requestNumber_key" ON "MotorInsuranceRequest"("requestNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MotorInsuranceRequest_submissionToken_key" ON "MotorInsuranceRequest"("submissionToken");

-- CreateIndex
CREATE INDEX "MotorInsuranceRequest_status_idx" ON "MotorInsuranceRequest"("status");

-- CreateIndex
CREATE INDEX "MotorInsuranceRequest_agentId_idx" ON "MotorInsuranceRequest"("agentId");

-- CreateIndex
CREATE INDEX "MotorInsuranceRequest_createdAt_idx" ON "MotorInsuranceRequest"("createdAt");

-- CreateIndex
CREATE INDEX "MotorInsuranceRequest_customerNationalId_idx" ON "MotorInsuranceRequest"("customerNationalId");

-- CreateIndex
CREATE INDEX "MotorInsuranceRequest_plateNumber_idx" ON "MotorInsuranceRequest"("plateNumber");

-- AddForeignKey
ALTER TABLE "MotorInsuranceRequest" ADD CONSTRAINT "MotorInsuranceRequest_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
