-- CreateEnum
CREATE TYPE "ReportRequestStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'COMPLETED', 'REJECTED');

-- CreateTable
CREATE TABLE "ReportRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "status" "ReportRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requesterId" TEXT,
    "requesterName" TEXT,
    "requesterEmail" TEXT,
    "requesterRole" "Role",
    "requesterBank" TEXT,
    "managerNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedByName" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReportRequest_requestNumber_key" ON "ReportRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "ReportRequest_status_idx" ON "ReportRequest"("status");

-- CreateIndex
CREATE INDEX "ReportRequest_requesterId_idx" ON "ReportRequest"("requesterId");

-- CreateIndex
CREATE INDEX "ReportRequest_createdAt_idx" ON "ReportRequest"("createdAt");

-- CreateIndex
CREATE INDEX "ReportRequest_reviewedById_idx" ON "ReportRequest"("reviewedById");

-- AddForeignKey
ALTER TABLE "ReportRequest" ADD CONSTRAINT "ReportRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportRequest" ADD CONSTRAINT "ReportRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
