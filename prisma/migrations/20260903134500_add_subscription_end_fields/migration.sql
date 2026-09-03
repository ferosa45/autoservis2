ALTER TABLE "Garage" ADD COLUMN "subscriptionEndsAt" TIMESTAMP(3);
ALTER TABLE "Garage" ADD COLUMN "subscriptionCancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;
