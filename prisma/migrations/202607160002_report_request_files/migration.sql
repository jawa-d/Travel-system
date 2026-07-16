-- AlterTable
ALTER TABLE "ReportRequest" ADD COLUMN "reportFileUrl" TEXT,
ADD COLUMN "reportFileName" TEXT,
ADD COLUMN "reportFileType" TEXT,
ADD COLUMN "reportFileSize" INTEGER,
ADD COLUMN "reportFileUploadedAt" TIMESTAMP(3);
