DROP TABLE IF EXISTS "Cancellation" CASCADE;
DROP TABLE IF EXISTS "Endorsement" CASCADE;
DROP TABLE IF EXISTS "Claim" CASCADE;
DROP TABLE IF EXISTS "Policy" CASCADE;
DROP TABLE IF EXISTS "Customer" CASCADE;
DROP TABLE IF EXISTS "TravelPlan" CASCADE;
DROP TABLE IF EXISTS "Country" CASCADE;

DROP TYPE IF EXISTS "CancellationReason";
DROP TYPE IF EXISTS "EndorsementStatus";
DROP TYPE IF EXISTS "EndorsementType";
DROP TYPE IF EXISTS "ClaimStatus";
DROP TYPE IF EXISTS "ClaimType";
DROP TYPE IF EXISTS "TravelPurpose";
DROP TYPE IF EXISTS "PolicyStatus";
DROP TYPE IF EXISTS "PolicyType";
DROP TYPE IF EXISTS "CountryStatus";
DROP TYPE IF EXISTS "CountryCategory";
DROP TYPE IF EXISTS "Gender";

DELETE FROM "LookupValue" WHERE "category" <> 'COVERAGE_TYPE';

ALTER TYPE "LookupCategory" RENAME TO "LookupCategory_old";
CREATE TYPE "LookupCategory" AS ENUM ('COVERAGE_TYPE');
ALTER TABLE "LookupValue" ALTER COLUMN "category" TYPE "LookupCategory" USING ("category"::text::"LookupCategory");
DROP TYPE "LookupCategory_old";
