ALTER TABLE "Endorsement"
  ADD COLUMN "createdById" TEXT,
  ADD COLUMN "createdByName" TEXT;

CREATE INDEX "Endorsement_createdById_idx" ON "Endorsement"("createdById");
