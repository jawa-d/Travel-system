ALTER TABLE "EngineeringInsuranceRequest"
ADD COLUMN "coverageType" TEXT,
ADD COLUMN "coverageNotes" TEXT,
ADD COLUMN "insurancePremium" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "additionalFees" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "taxes" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "netPremium" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "pricingCurrency" TEXT NOT NULL DEFAULT 'IQD',
ADD COLUMN "pricingNotes" TEXT,
ADD COLUMN "policyTermsHtml" TEXT,
ADD COLUMN "termsApprovedById" TEXT,
ADD COLUMN "termsApprovedByName" TEXT,
ADD COLUMN "termsApprovedAt" TIMESTAMP(3),
ADD COLUMN "underwriterSignature" JSONB,
ADD COLUMN "managerSignature" JSONB,
ADD COLUMN "companyStamp" JSONB,
ADD COLUMN "issuedPolicyNumber" TEXT,
ADD COLUMN "policyIssuedAt" TIMESTAMP(3),
ADD COLUMN "editHistory" JSONB NOT NULL DEFAULT '[]';

CREATE INDEX "EngineeringInsuranceRequest_policyIssuedAt_idx" ON "EngineeringInsuranceRequest"("policyIssuedAt");
