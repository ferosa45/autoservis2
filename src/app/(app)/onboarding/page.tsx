import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

export default async function OnboardingPage() {
  const context = await getSessionContext();
  const garage = await prisma.garage.findUnique({
    where: { id: context.garageId },
    select: { name: true, onboardingCompletedAt: true },
  });

  if (!garage) redirect('/today');
  if (garage.onboardingCompletedAt) redirect('/today');

  return <OnboardingWizard garageName={garage.name} />;
}
