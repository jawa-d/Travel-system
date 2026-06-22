-- Policy ownership snapshots, soft deletion, agencies, and reusable lookup values.
CREATE TYPE "LookupCategory" AS ENUM (
  'CLAIM_TYPE',
  'DESTINATION',
  'TRAVEL_PLAN',
  'POLICY_TYPE',
  'COVERAGE_TYPE',
  'ENDORSEMENT_TYPE',
  'CANCELLATION_REASON'
);

CREATE TABLE "Agency" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Agency_code_key" ON "Agency"("code");

ALTER TABLE "User" ADD COLUMN "agencyId" TEXT;
ALTER TABLE "Policy"
  ADD COLUMN "issuedByUserId" TEXT,
  ADD COLUMN "issuedByName" TEXT,
  ADD COLUMN "issuedByRole" "Role",
  ADD COLUMN "agencyId" TEXT,
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "deletedBy" TEXT;

ALTER TABLE "Policy" ALTER COLUMN "policyType" TYPE TEXT USING "policyType"::TEXT;
ALTER TABLE "Policy" ADD COLUMN "coverageType" TEXT NOT NULL DEFAULT 'STANDARD';
ALTER TABLE "Claim" ALTER COLUMN "claimType" TYPE TEXT USING "claimType"::TEXT;
ALTER TABLE "Endorsement" ALTER COLUMN "endorsementType" TYPE TEXT USING "endorsementType"::TEXT;
ALTER TABLE "Cancellation" ALTER COLUMN "reason" TYPE TEXT USING "reason"::TEXT;

UPDATE "Policy" p
SET
  "issuedByUserId" = p."issuedById",
  "issuedByName" = u."name",
  "issuedByRole" = u."role",
  "agencyId" = u."agencyId"
FROM "User" u
WHERE p."issuedById" = u."id";

CREATE INDEX "User_agencyId_idx" ON "User"("agencyId");
CREATE INDEX "Policy_issuedByUserId_idx" ON "Policy"("issuedByUserId");
CREATE INDEX "Policy_agencyId_idx" ON "Policy"("agencyId");
CREATE INDEX "Policy_deletedAt_idx" ON "Policy"("deletedAt");

ALTER TABLE "User" ADD CONSTRAINT "User_agencyId_fkey"
  FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_issuedByUserId_fkey"
  FOREIGN KEY ("issuedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_agencyId_fkey"
  FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "LookupValue" (
  "id" TEXT NOT NULL,
  "category" "LookupCategory" NOT NULL,
  "value" TEXT NOT NULL,
  "labelAr" TEXT NOT NULL,
  "labelEn" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "system" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LookupValue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LookupValue_category_value_key" ON "LookupValue"("category", "value");
CREATE INDEX "LookupValue_category_active_sortOrder_idx" ON "LookupValue"("category", "active", "sortOrder");

INSERT INTO "LookupValue" ("id", "category", "value", "labelAr", "labelEn", "system", "sortOrder", "updatedAt") VALUES
  ('lookup-claim-medical', 'CLAIM_TYPE', 'MEDICAL', 'طبية', 'Medical', true, 10, CURRENT_TIMESTAMP),
  ('lookup-claim-baggage', 'CLAIM_TYPE', 'BAGGAGE', 'أمتعة', 'Baggage', true, 20, CURRENT_TIMESTAMP),
  ('lookup-claim-delay', 'CLAIM_TYPE', 'TRIP_DELAY', 'تأخير رحلة', 'Trip delay', true, 30, CURRENT_TIMESTAMP),
  ('lookup-claim-cancel', 'CLAIM_TYPE', 'CANCELLATION', 'إلغاء رحلة', 'Cancellation', true, 40, CURRENT_TIMESTAMP),
  ('lookup-claim-other', 'CLAIM_TYPE', 'OTHER', 'أخرى', 'Other', true, 50, CURRENT_TIMESTAMP),
  ('lookup-policy-individual', 'POLICY_TYPE', 'INDIVIDUAL', 'فردي', 'Individual', true, 10, CURRENT_TIMESTAMP),
  ('lookup-policy-family', 'POLICY_TYPE', 'FAMILY', 'عائلي', 'Family', true, 20, CURRENT_TIMESTAMP),
  ('lookup-policy-student', 'POLICY_TYPE', 'STUDENT', 'طالب', 'Student', true, 30, CURRENT_TIMESTAMP),
  ('lookup-policy-business', 'POLICY_TYPE', 'BUSINESS', 'أعمال', 'Business', true, 40, CURRENT_TIMESTAMP),
  ('lookup-policy-multi', 'POLICY_TYPE', 'MULTI_TRIP', 'رحلات متعددة', 'Multi trip', true, 50, CURRENT_TIMESTAMP),
  ('lookup-coverage-standard', 'COVERAGE_TYPE', 'STANDARD', 'تغطية قياسية', 'Standard coverage', true, 10, CURRENT_TIMESTAMP),
  ('lookup-endorsement-extend', 'ENDORSEMENT_TYPE', 'EXTEND_TRAVEL_PERIOD', 'تمديد فترة السفر', 'Extend travel period', true, 10, CURRENT_TIMESTAMP),
  ('lookup-endorsement-destination', 'ENDORSEMENT_TYPE', 'CHANGE_DESTINATION', 'تغيير الوجهة', 'Change destination', true, 20, CURRENT_TIMESTAMP),
  ('lookup-endorsement-customer', 'ENDORSEMENT_TYPE', 'UPDATE_CUSTOMER_INFORMATION', 'تحديث بيانات العميل', 'Update customer information', true, 30, CURRENT_TIMESTAMP),
  ('lookup-endorsement-coverage', 'ENDORSEMENT_TYPE', 'INCREASE_COVERAGE_AMOUNT', 'زيادة مبلغ التغطية', 'Increase coverage amount', true, 40, CURRENT_TIMESTAMP),
  ('lookup-cancel-visa', 'CANCELLATION_REASON', 'VISA_REJECTION', 'رفض التأشيرة', 'Visa rejection', true, 10, CURRENT_TIMESTAMP),
  ('lookup-cancel-trip', 'CANCELLATION_REASON', 'TRIP_CANCELLATION', 'إلغاء الرحلة', 'Trip cancellation', true, 20, CURRENT_TIMESTAMP),
  ('lookup-cancel-customer', 'CANCELLATION_REASON', 'CUSTOMER_REQUEST', 'طلب العميل', 'Customer request', true, 30, CURRENT_TIMESTAMP),
  ('lookup-cancel-error', 'CANCELLATION_REASON', 'ISSUANCE_ERROR', 'خطأ في الإصدار', 'Issuance error', true, 40, CURRENT_TIMESTAMP);
