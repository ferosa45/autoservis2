-- CreateEnum
CREATE TYPE "JobEventType" AS ENUM ('CREATED', 'WORK_STARTED', 'WAITING_FOR_PART', 'WORK_RESUMED', 'COMPLETED', 'INVOICE_ISSUED', 'INVOICE_PAID', 'INVOICE_CANCELLED');

-- CreateTable
CREATE TABLE "JobEvent" (
    "id" TEXT NOT NULL,
    "type" "JobEventType" NOT NULL,
    "message" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT,
    "garageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobEvent_jobId_createdAt_idx" ON "JobEvent"("jobId", "createdAt");
CREATE INDEX "JobEvent_garageId_idx" ON "JobEvent"("garageId");

-- AddForeignKey
ALTER TABLE "JobEvent" ADD CONSTRAINT "JobEvent_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobEvent" ADD CONSTRAINT "JobEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "JobEvent" ADD CONSTRAINT "JobEvent_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "Garage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill the creation event for existing jobs so their timeline starts with a real event.
INSERT INTO "JobEvent" ("id", "type", "message", "jobId", "garageId", "createdAt")
SELECT 'legacy_' || "id", 'CREATED', 'Zakázka vytvořena', "id", "garageId", "createdAt"
FROM "Job";

-- Backfill existing work sessions so older jobs also show when work started/resumed.
INSERT INTO "JobEvent" ("id", "type", "message", "jobId", "userId", "garageId", "createdAt")
SELECT
  'legacy_session_' || ws."id",
  CASE
    WHEN ROW_NUMBER() OVER (PARTITION BY ws."jobId" ORDER BY ws."startedAt") = 1 THEN 'WORK_STARTED'::"JobEventType"
    ELSE 'WORK_RESUMED'::"JobEventType"
  END,
  CASE
    WHEN ROW_NUMBER() OVER (PARTITION BY ws."jobId" ORDER BY ws."startedAt") = 1 THEN 'Zahájena práce'
    ELSE 'Pokračování v práci'
  END,
  ws."jobId",
  ws."userId",
  ws."garageId",
  ws."startedAt"
FROM "WorkSession" ws;
