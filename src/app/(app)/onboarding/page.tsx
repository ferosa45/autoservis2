import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { OnboardingForm } from '@/components/onboarding/onboarding-form';

export default async function OnboardingPage() {
  const context = await getSessionContext();
  const garage = await prisma.garage.findUnique({
    where: { id: context.garageId },
    select: {
      name: true,
      email: true,
      phone: true,
      street: true,
      city: true,
      zip: true,
      companyName: true,
      ico: true,
      dic: true,
      bankAccount: true,
      iban: true,
      isVatPayer: true,
      defaultVatRate: true,
      onboardingCompletedAt: true,
    },
  });

  if (!garage) redirect('/today');
  if (garage.onboardingCompletedAt) redirect('/today');

  return (
    <OnboardingForm
      garage={{
        ...garage,
        defaultVatRate: garage.defaultVatRate?.toString() ?? null,
      }}
    />
  );
}
