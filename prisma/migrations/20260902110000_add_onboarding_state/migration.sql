ALTER TABLE "Garage" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

UPDATE "Garage"
SET "onboardingCompletedAt" = CURRENT_TIMESTAMP
WHERE "onboardingCompletedAt" IS NULL;
