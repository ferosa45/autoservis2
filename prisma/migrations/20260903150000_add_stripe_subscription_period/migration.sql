ALTER TABLE "Garage"
ADD COLUMN "subscriptionEndsAt" TIMESTAMP(3),
ADD COLUMN "subscriptionCancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;
