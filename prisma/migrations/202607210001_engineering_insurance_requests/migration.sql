CREATE TYPE "EngineeringRequestStatus" AS ENUM (
  'SUBMITTED',
  'UNDER_REVIEW',
  'NEEDS_INFO',
  'QUOTED',
  'APPROVED',
  'REJECTED'
);

CREATE TABLE "EngineeringInsuranceRequest" (
  "id" TEXT NOT NULL,
  "requestNumber" TEXT NOT NULL,
  "submissionToken" TEXT,
  "status" "EngineeringRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
  "customerFullName" TEXT NOT NULL,
  "customerMobile" TEXT NOT NULL,
  "customerEmail" TEXT,
  "customerNationalId" TEXT,
  "customerAddress" TEXT,
  "customerCity" TEXT,
  "projectName" TEXT NOT NULL,
  "projectType" TEXT NOT NULL,
  "projectLocation" TEXT NOT NULL,
  "contractValue" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'IQD',
  "insuranceType" TEXT NOT NULL,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "contractorName" TEXT,
  "ownerName" TEXT,
  "riskDetails" TEXT,
  "documents" JSONB NOT NULL DEFAULT '[]',
  "notes" TEXT,
  "source" TEXT NOT NULL DEFAULT 'Internal',
  "agentId" TEXT,
  "agentName" TEXT,
  "agentEmail" TEXT,
  "reviewedById" TEXT,
  "reviewedByName" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "managerNotes" TEXT,
  "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdTime" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EngineeringInsuranceRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EngineeringInsuranceRequest_requestNumber_key" ON "EngineeringInsuranceRequest"("requestNumber");
CREATE UNIQUE INDEX "EngineeringInsuranceRequest_submissionToken_key" ON "EngineeringInsuranceRequest"("submissionToken");
CREATE INDEX "EngineeringInsuranceRequest_status_idx" ON "EngineeringInsuranceRequest"("status");
CREATE INDEX "EngineeringInsuranceRequest_agentId_idx" ON "EngineeringInsuranceRequest"("agentId");
CREATE INDEX "EngineeringInsuranceRequest_createdAt_idx" ON "EngineeringInsuranceRequest"("createdAt");
CREATE INDEX "EngineeringInsuranceRequest_customerNationalId_idx" ON "EngineeringInsuranceRequest"("customerNationalId");

ALTER TABLE "EngineeringInsuranceRequest"
ADD CONSTRAINT "EngineeringInsuranceRequest_agentId_fkey"
FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
