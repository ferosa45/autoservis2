-- Add an atomic per-garage counter for job numbers.
ALTER TABLE "Garage" ADD COLUMN "nextJobNumber" INTEGER NOT NULL DEFAULT 1;

-- Preserve the existing numbering sequence for garages that already have jobs.
UPDATE "Garage" AS g
SET "nextJobNumber" = COALESCE(
  (
    SELECT MAX(CAST(j."number" AS INTEGER)) + 1
    FROM "Job" AS j
    WHERE j."garageId" = g."id"
      AND j."number" ~ '^[0-9]+$'
  ),
  1
);
