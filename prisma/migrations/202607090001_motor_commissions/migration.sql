CREATE TABLE "MotorCommission" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "motorRequestId" TEXT NOT NULL,
  "premiumAmount" DECIMAL(12,2) NOT NULL,
  "commissionRate" DECIMAL(5,2) NOT NULL,
  "commissionAmount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'IQD',
  "paid" BOOLEAN NOT NULL DEFAULT true,
  "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paidById" TEXT,
  "paidByName" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MotorCommission_motorRequestId_fkey" FOREIGN KEY ("motorRequestId") REFERENCES "MotorInsuranceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MotorCommission_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "MotorCommission_motorRequestId_key" ON "MotorCommission"("motorRequestId");
CREATE INDEX "MotorCommission_paid_idx" ON "MotorCommission"("paid");
CREATE INDEX "MotorCommission_paidAt_idx" ON "MotorCommission"("paidAt");
CREATE INDEX "MotorCommission_paidById_idx" ON "MotorCommission"("paidById");
