-- AlterTable
ALTER TABLE "ReportRequest" ADD COLUMN "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lockedAt" TIMESTAMP(3),
ADD COLUMN "lockedById" TEXT,
ADD COLUMN "lockedByName" TEXT;
