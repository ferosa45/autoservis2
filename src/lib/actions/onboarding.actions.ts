'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { assertOwner, assertWriteAccess, getSessionContext } from '@/lib/session';
import { READ_ONLY_ACCESS_MESSAGE } from '@/lib/action-errors';

export async function completeOnboarding() {
  const context = await getSessionContext();
  if (!context.hasWriteAccess) {
    return;
  }
  assertWriteAccess(context);
  assertOwner(context);
  await prisma.garage.update({
    where: { id: context.garageId },
    data: { onboardingCompletedAt: new Date() },
  });
  revalidatePath('/today');
}

export async function saveOnboardingDetails(formData: FormData) {
  const context = await getSessionContext();
  if (!context.hasWriteAccess) {
    return { error: READ_ONLY_ACCESS_MESSAGE };
  }
  assertWriteAccess(context);
  assertOwner(context);

  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const phone = String(formData.get('phone') ?? '').trim();
  const street = String(formData.get('street') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();
  const zip = String(formData.get('zip') ?? '').trim();
  const companyName = String(formData.get('companyName') ?? '').trim();
  const ico = String(formData.get('ico') ?? '').trim();
  const dic = String(formData.get('dic') ?? '').trim();
  const bankAccount = String(formData.get('bankAccount') ?? '').trim();
  const iban = String(formData.get('iban') ?? '').trim();
  const isVatPayer = formData.get('isVatPayer') === 'on';
  const defaultVatRateValue = String(formData.get('defaultVatRate') ?? '').trim();
  const defaultVatRate = defaultVatRateValue ? Number(defaultVatRateValue) : null;

  if (defaultVatRate !== null && (!Number.isFinite(defaultVatRate) || defaultVatRate < 0 || defaultVatRate > 100)) {
    return { error: 'Výchozí sazba DPH musí být číslo od 0 do 100.' };
  }

  await prisma.garage.update({
    where: { id: context.garageId },
    data: {
      name: name || undefined,
      email: email || null,
      phone: phone || null,
      street: street || null,
      city: city || null,
      zip: zip || null,
      companyName: companyName || null,
      ico: ico || null,
      dic: dic || null,
      bankAccount: bankAccount || null,
      iban: iban || null,
      isVatPayer,
      defaultVatRate,
      onboardingCompletedAt: new Date(),
    },
  });

  revalidatePath('/today');
  return { error: null };
}

export async function skipOnboarding() {
  const context = await getSessionContext();
  if (!context.hasWriteAccess) {
    return { error: READ_ONLY_ACCESS_MESSAGE };
  }
  assertWriteAccess(context);
  assertOwner(context);
  await prisma.garage.update({
    where: { id: context.garageId },
    data: { onboardingCompletedAt: new Date() },
  });
  revalidatePath('/today');
  return { error: null };
}
