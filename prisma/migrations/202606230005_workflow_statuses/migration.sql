-- Replace enums atomically so legacy NEW/DRAFT values can be mapped safely.
ALTER TYPE "ClaimStatus" RENAME TO "ClaimStatus_legacy";
CREATE TYPE "ClaimStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED');
ALTER TABLE "Claim" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Claim"
  ALTER COLUMN "status" TYPE "ClaimStatus"
  USING (
    CASE
      WHEN "status"::text = 'NEW' THEN 'OPEN'
      ELSE "status"::text
    END
  )::"ClaimStatus";
ALTER TABLE "Claim" ALTER COLUMN "status" SET DEFAULT 'OPEN';
DROP TYPE "ClaimStatus_legacy";

ALTER TYPE "EndorsementStatus" RENAME TO "EndorsementStatus_legacy";
CREATE TYPE "EndorsementStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED');
ALTER TABLE "Endorsement" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Endorsement"
  ALTER COLUMN "status" TYPE "EndorsementStatus"
  USING (
    CASE
      WHEN "status"::text = 'DRAFT' THEN 'OPEN'
      ELSE "status"::text
    END
  )::"EndorsementStatus";
ALTER TABLE "Endorsement" ALTER COLUMN "status" SET DEFAULT 'OPEN';
DROP TYPE "EndorsementStatus_legacy";
