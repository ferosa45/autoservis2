'use server';

import { prisma } from '@/lib/prisma';
import { assertOwner, assertWriteAccess, getSessionContext } from '@/lib/session';

export async function completeOnboarding() {
  const context = await getSessionContext();
  assertOwner(context);
  await prisma.garage.update({
    where: { id: context.garageId },
    data: { onboardingCompletedAt: new Date() },
  });
}

export async function createOnboardingCustomer(formData: FormData) {
  const context = await getSessionContext();
  assertOwner(context);
  assertWriteAccess(context);

  const customerName = String(formData.get('customerName') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const brand = String(formData.get('brand') ?? '').trim();
  const model = String(formData.get('model') ?? '').trim();
  const licensePlate = String(formData.get('licensePlate') ?? '').trim();

  if (!customerName || !phone || !brand || !model) {
    return { error: 'Vyplňte prosím jméno, telefon, značku a model vozidla.' };
  }

  const customer = await prisma.customer.create({
    data: {
      name: customerName,
      phone,
      garageId: context.garageId,
      vehicles: {
        create: {
          brand,
          model,
          licensePlate: licensePlate || null,
          garageId: context.garageId,
        },
      },
    },
    include: { vehicles: { select: { id: true } } },
  });

  return { error: null, customerId: customer.id, vehicleId: customer.vehicles[0]?.id ?? null };
}
