ALTER TABLE "Invoice"
  ADD COLUMN "supplierBankAccount" TEXT,
  ADD COLUMN "supplierIban" TEXT,
  ADD COLUMN "supplierIsVatPayer" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Invoice" i
SET
  "supplierBankAccount" = g."bankAccount",
  "supplierIban" = g."iban",
  "supplierIsVatPayer" = g."isVatPayer"
FROM "Garage" g
WHERE i."garageId" = g."id";