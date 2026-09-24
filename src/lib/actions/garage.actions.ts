'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionContext, assertWriteAccess, requireOwner } from '@/lib/session';
import { z } from 'zod';

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

const updateGarageSettingsSchema = z.object({
  name: z.string().trim().min(1).max(255),
  companyName: z.string().max(255),
  ico: z.string().max(50),
  dic: z.string().max(50),
  street: z.string().max(255),
  city: z.string().max(255),
  zip: z.string().max(30),
  country: z.string().max(10),
  email: z.string().max(255),
  phone: z.string().max(50),
  bankAccount: z.string().max(100),
  iban: z.string().max(100),
  isVatPayer: z.boolean(),
  defaultVatRate: z.string().max(20),
  invoicePrefix: z.string().max(20),
  invoiceDueDays: z.number().int().min(1).max(365),
});

export async function updateGarageSettings(input: UpdateGarageSettingsInput) {
  const validInput = updateGarageSettingsSchema.parse(input);
  const context = await getSessionContext();
  assertWriteAccess(context);
  requireOwner(context);

  if (!validInput.name.trim()) {
    throw new Error('Název servisu je povinný');
  }

  const parsedVatRate = validInput.defaultVatRate.trim() ? parseFloat(validInput.defaultVatRate.replace(',', '.')) : null;
  if (parsedVatRate !== null && (Number.isNaN(parsedVatRate) || parsedVatRate < 0 || parsedVatRate > 100)) {
    throw new Error('Sazba DPH musí být číslo mezi 0 a 100');
  }

  await prisma.garage.update({
    where: { id: context.garageId },
    data: {
      name: validInput.name.trim(),
      companyName: validInput.companyName.trim() || null,
      ico: validInput.ico.trim() || null,
      dic: validInput.dic.trim() || null,
      street: validInput.street.trim() || null,
      city: validInput.city.trim() || null,
      zip: validInput.zip.trim() || null,
      country: validInput.country.trim() || 'CZ',
      email: validInput.email.trim() || null,
      phone: validInput.phone.trim() || null,
      bankAccount: validInput.bankAccount.trim() || null,
      iban: validInput.iban.trim() || null,
      isVatPayer: validInput.isVatPayer,
      defaultVatRate: parsedVatRate,
      invoicePrefix: validInput.invoicePrefix.trim() || null,
      invoiceDueDays: validInput.invoiceDueDays > 0 ? validInput.invoiceDueDays : 14,
    },
  });

  revalidatePath('/settings');
}
