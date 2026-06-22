-- Enterprise modules migration for claims, endorsements, cancellations, audit logs, notifications.
-- Run with `npx prisma migrate dev` after installing dependencies.

CREATE TYPE "ClaimType" AS ENUM ('MEDICAL', 'BAGGAGE', 'TRIP_DELAY', 'CANCELLATION', 'OTHER');
CREATE TYPE "ClaimStatus" AS ENUM ('NEW', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED');
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'EXPIRY', 'EMAIL');
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'READ', 'FAILED');
CREATE TYPE "EndorsementType" AS ENUM ('EXTEND_TRAVEL_PERIOD', 'CHANGE_DESTINATION', 'UPDATE_CUSTOMER_INFORMATION', 'INCREASE_COVERAGE_AMOUNT');
CREATE TYPE "EndorsementStatus" AS ENUM ('DRAFT', 'APPROVED', 'REJECTED');
CREATE TYPE "CancellationReason" AS ENUM ('VISA_REJECTION', 'TRIP_CANCELLATION', 'CUSTOMER_REQUEST', 'ISSUANCE_ERROR');

CREATE TABLE "Claim" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "claimNumber" TEXT NOT NULL UNIQUE,
  "policyId" TEXT NOT NULL REFERENCES "Policy"("id"),
  "customerId" TEXT NOT NULL REFERENCES "Customer"("id"),
  "claimType" "ClaimType" NOT NULL,
  "description" TEXT NOT NULL,
  "attachments" TEXT[] NOT NULL,
  "status" "ClaimStatus" NOT NULL DEFAULT 'NEW',
  "createdById" TEXT REFERENCES "User"("id"),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Endorsement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "endorsementNumber" TEXT NOT NULL UNIQUE,
  "policyId" TEXT NOT NULL REFERENCES "Policy"("id"),
  "endorsementType" "EndorsementType" NOT NULL,
  "previousValue" JSONB,
  "newValue" JSONB NOT NULL,
  "destinationCountryId" TEXT REFERENCES "Country"("id"),
  "additionalPremium" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "status" "EndorsementStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Cancellation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "cancellationNumber" TEXT NOT NULL UNIQUE,
  "policyId" TEXT NOT NULL UNIQUE REFERENCES "Policy"("id"),
  "reason" "CancellationReason" NOT NULL,
  "notes" TEXT,
  "refundAmount" DECIMAL(10,2) NOT NULL,
  "administrativeFees" DECIMAL(10,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "role" "Role",
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "ipAddress" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT REFERENCES "User"("id") ON DELETE CASCADE,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "entity" TEXT,
  "entityId" TEXT,
  "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
  "dueAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
