CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

ALTER TABLE "Customer"
  ADD COLUMN "nameNormalized" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "phoneNormalized" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "emailNormalized" TEXT,
  ADD COLUMN "companyNameNormalized" TEXT,
  ADD COLUMN "icoNormalized" TEXT;

ALTER TABLE "Vehicle"
  ADD COLUMN "brandNormalized" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "modelNormalized" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "licensePlateNormalized" TEXT;

UPDATE "Customer"
SET
  "nameNormalized" = lower(unaccent("name")),
  "phoneNormalized" = regexp_replace(lower(unaccent("phone")), '[^a-z0-9]', '', 'g'),
  "emailNormalized" = CASE WHEN "email" IS NULL THEN NULL ELSE lower(unaccent("email"))) END,
  "companyNameNormalized" = CASE WHEN "companyName" IS NULL THEN NULL ELSE lower(unaccent("companyName")) END,
  "icoNormalized" = CASE WHEN "ico" IS NULL THEN NULL ELSE regexp_replace(lower(unaccent("ico")), '[^a-z0-9]', '', 'g') END;

UPDATE "Vehicle"
SET
  "brandNormalized" = lower(unaccent("brand")),
  "modelNormalized" = lower(unaccent("model")),
  "licensePlateNormalized" = CASE WHEN "licensePlate" IS NULL THEN NULL ELSE regexp_replace(lower(unaccent("licensePlate")), '[^a-z0-9]', '', 'g') END;

CREATE INDEX "Customer_nameNormalized_trgm_idx" ON "Customer" USING GIN ("nameNormalized" gin_trgm_ops);
CREATE INDEX "Customer_phoneNormalized_trgm_idx" ON "Customer" USING GIN ("phoneNormalized" gin_trgm_ops);
CREATE INDEX "Customer_emailNormalized_trgm_idx" ON "Customer" USING GIN ("emailNormalized" gin_trgm_ops);
CREATE INDEX "Customer_companyNameNormalized_trgm_idx" ON "Customer" USING GIN ("companyNameNormalized" gin_trgm_ops);
CREATE INDEX "Customer_icoNormalized_trgm_idx" ON "Customer" USING GIN ("icoNormalized" gin_trgm_ops);
CREATE INDEX "Vehicle_brandNormalized_trgm_idx" ON "Vehicle" USING GIN ("brandNormalized" gin_trgm_ops);
CREATE INDEX "Vehicle_modelNormalized_trgm_idx" ON "Vehicle" USING GIN ("modelNormalized" gin_trgm_ops);
CREATE INDEX "Vehicle_licensePlateNormalized_trgm_idx" ON "Vehicle" USING GIN ("licensePlateNormalized" gin_trgm_ops);

ALTER TABLE "Customer" ALTER COLUMN "nameNormalized" DROP DEFAULT;
ALTER TABLE "Customer" ALTER COLUMN "phoneNormalized" DROP DEFAULT;
ALTER TABLE "Vehicle" ALTER COLUMN "brandNormalized" DROP DEFAULT;
ALTER TABLE "Vehicle" ALTER COLUMN "modelNormalized" DROP DEFAULT;
