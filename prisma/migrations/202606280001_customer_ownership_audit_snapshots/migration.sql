ALTER TABLE "Customer"
  ADD COLUMN "createdByUserId" TEXT,
  ADD COLUMN "createdByName" TEXT,
  ADD COLUMN "createdByEmail" TEXT,
  ADD COLUMN "createdByRole" "Role",
  ADD COLUMN "createdByAgency" TEXT;

ALTER TABLE "Policy"
  ADD COLUMN "issuedByEmail" TEXT,
  ADD COLUMN "issuedByAgency" TEXT;

ALTER TABLE "AuditLog"
  ADD COLUMN "agency" TEXT;

UPDATE "Policy" p
SET
  "issuedByEmail" = COALESCE(p."issuedByEmail", u."email"),
  "issuedByAgency" = COALESCE(p."issuedByAgency", a."name")
FROM "User" u
LEFT JOIN "Agency" a ON a."id" = u."agencyId"
WHERE COALESCE(p."issuedByUserId", p."issuedById") = u."id";

UPDATE "Customer" c
SET
  "createdByUserId" = owner."userId",
  "createdByName" = owner."name",
  "createdByEmail" = owner."email",
  "createdByRole" = owner."role",
  "createdByAgency" = owner."agency"
FROM (
  SELECT DISTINCT ON (p."customerId")
    p."customerId",
    COALESCE(p."issuedByUserId", p."issuedById") AS "userId",
    COALESCE(p."issuedByName", u."name") AS "name",
    COALESCE(p."issuedByEmail", u."email") AS "email",
    COALESCE(p."issuedByRole", u."role") AS "role",
    COALESCE(p."issuedByAgency", a."name") AS "agency",
    p."createdAt"
  FROM "Policy" p
  LEFT JOIN "User" u ON u."id" = COALESCE(p."issuedByUserId", p."issuedById")
  LEFT JOIN "Agency" a ON a."id" = COALESCE(p."agencyId", u."agencyId")
  WHERE COALESCE(p."issuedByUserId", p."issuedById") IS NOT NULL
  ORDER BY p."customerId", p."createdAt" ASC
) owner
WHERE c."id" = owner."customerId"
  AND c."createdByUserId" IS NULL;

CREATE INDEX "Customer_createdByUserId_idx" ON "Customer"("createdByUserId");

ALTER TABLE "Customer" ADD CONSTRAINT "Customer_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
