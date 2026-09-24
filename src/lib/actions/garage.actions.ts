'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionContext, assertWriteAccess, requireOwner } from '@/lib/session';

export type UpdateGarageSettingsInput = {
  name: string;
  companyName: string;
  ico: string;
  dic: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  email: string;
  phone: string;
  bankAccount: string;
  iban: string;
  isVatPayer: boolean;
  defaultVatRate: string; // prázdný string = nevyplněno
  invoicePrefix: string;
  invoiceDueDays: number;
};

export async function updateGarageSettings(input: UpdateGarageSettingsInput) {
  const context = await getSessionContext();
  assertWriteAccess(context);
  requireOwner(context);

  if (!input.name.trim()) {
    throw new Error('Název servisu je povinný');
  }

  const parsedVatRate = input.defaultVatRate.trim() ? parseFloat(input.defaultVatRate.replace(',', '.')) : null;
  if (parsedVatRate !== null && (Number.isNaN(parsedVatRate) || parsedVatRate < 0 || parsedVatRate > 100)) {
    throw new Error('Sazba DPH musí být číslo mezi 0 a 100');
  }

  await prisma.garage.update({
    where: { id: context.garageId },
    data: {
      name: input.name.trim(),
      companyName: input.companyName.trim() || null,
      ico: input.ico.trim() || null,
      dic: input.dic.trim() || null,
      street: input.street.trim() || null,
      city: input.city.trim() || null,
      zip: input.zip.trim() || null,
      country: input.country.trim() || 'CZ',
      email: input.email.trim() || null,
      phone: input.phone.trim() || null,
      bankAccount: input.bankAccount.trim() || null,
      iban: input.iban.trim() || null,
      isVatPayer: input.isVatPayer,
      defaultVatRate: parsedVatRate,
      invoicePrefix: input.invoicePrefix.trim() || null,
      invoiceDueDays: input.invoiceDueDays > 0 ? input.invoiceDueDays : 14,
    },
  });

  revalidatePath('/settings');
}
