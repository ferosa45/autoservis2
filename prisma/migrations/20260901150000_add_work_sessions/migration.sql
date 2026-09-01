CREATE TABLE "WorkSession" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "garageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkSession_jobId_idx" ON "WorkSession"("jobId");
CREATE INDEX "WorkSession_userId_idx" ON "WorkSession"("userId");
CREATE INDEX "WorkSession_garageId_idx" ON "WorkSession"("garageId");
CREATE INDEX "WorkSession_jobId_endedAt_idx" ON "WorkSession"("jobId", "endedAt");

ALTER TABLE "WorkSession" ADD CONSTRAINT "WorkSession_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkSession" ADD CONSTRAINT "WorkSession_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkSession" ADD CONSTRAINT "WorkSession_garageId_fkey"
    FOREIGN KEY ("garageId") REFERENCES "Garage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
