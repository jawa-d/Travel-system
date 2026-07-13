-- CreateEnum
CREATE TYPE "ReferralType" AS ENUM ('MARINE', 'ENGINEERING', 'HEALTH', 'OTHER');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('RECEIVED', 'UNDER_REVIEW', 'CONTACTING', 'ISSUED');

-- CreateEnum
CREATE TYPE "TransportMode" AS ENUM ('SEA', 'LAND', 'AIR');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'BANK';

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referralNumber" TEXT NOT NULL,
    "type" "ReferralType" NOT NULL DEFAULT 'MARINE',
    "status" "ReferralStatus" NOT NULL DEFAULT 'RECEIVED',
    "applicantName" TEXT NOT NULL,
    "beneficiaryName" TEXT NOT NULL,
    "insuredAmount" DECIMAL(12,2) NOT NULL,
    "insuranceFrom" TIMESTAMP(3) NOT NULL,
    "insuranceTo" TIMESTAMP(3) NOT NULL,
    "totalInsuredAfterIncrease" DECIMAL(12,2) NOT NULL,
    "increaseRate" DECIMAL(5,2) NOT NULL,
    "coverType" TEXT NOT NULL,
    "cargoDescription" TEXT NOT NULL,
    "routeFrom" TEXT NOT NULL,
    "routeTo" TEXT NOT NULL,
    "transportMode" "TransportMode" NOT NULL,
    "packagingType" TEXT NOT NULL,
    "lcNumber" TEXT,
    "carrierName" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IQD',
    "extraRisks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hasPreviousCompensation" BOOLEAN NOT NULL DEFAULT false,
    "totalPremium" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdById" TEXT,
    "createdByName" TEXT,
    "createdByEmail" TEXT,
    "createdByRole" "Role",
    "createdByBank" TEXT,
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralInstallment" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralCommission" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "premiumAmount" DECIMAL(12,2) NOT NULL,
    "commissionRate" DECIMAL(5,2) NOT NULL,
    "commissionAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IQD',
    "paid" BOOLEAN NOT NULL DEFAULT true,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidById" TEXT,
    "paidByName" TEXT,
    "paidToName" TEXT,
    "paidToBank" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralCommission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referralNumber_key" ON "Referral"("referralNumber");
CREATE INDEX "Referral_status_idx" ON "Referral"("status");
CREATE INDEX "Referral_type_idx" ON "Referral"("type");
CREATE INDEX "Referral_createdById_idx" ON "Referral"("createdById");
CREATE INDEX "Referral_createdAt_idx" ON "Referral"("createdAt");
CREATE INDEX "Referral_issuedAt_idx" ON "Referral"("issuedAt");
CREATE INDEX "ReferralInstallment_referralId_idx" ON "ReferralInstallment"("referralId");
CREATE UNIQUE INDEX "ReferralCommission_referralId_key" ON "ReferralCommission"("referralId");
CREATE INDEX "ReferralCommission_paidAt_idx" ON "ReferralCommission"("paidAt");
CREATE INDEX "ReferralCommission_paidById_idx" ON "ReferralCommission"("paidById");

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReferralInstallment" ADD CONSTRAINT "ReferralInstallment_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferralCommission" ADD CONSTRAINT "ReferralCommission_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferralCommission" ADD CONSTRAINT "ReferralCommission_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
