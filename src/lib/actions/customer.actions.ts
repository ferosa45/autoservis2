'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionContext, assertWriteAccess } from '@/lib/session';

export async function updateCustomer(
  customerId: string,
  data: {
    name: string;
    phone: string;
    email?: string;
    companyName?: string;
    ico?: string;
    dic?: string;
    street?: string;
    city?: string;
    zip?: string;
  },
) {
  const context = await getSessionContext();
  assertWriteAccess(context);

  const name = data.name.trim();
  const phone = data.phone.trim();

  if (!name) throw new Error('Jméno zákazníka je povinné');
  if (!phone) throw new Error('Telefon zákazníka je povinný');

  const result = await prisma.customer.updateMany({
    where: { id: customerId, garageId: context.garageId },
    data: {
      name,
      phone,
      email: data.email?.trim() || null,
      companyName: data.companyName?.trim() || null,
      ico: data.ico?.trim() || null,
      dic: data.dic?.trim() || null,
      street: data.street?.trim() || null,
      city: data.city?.trim() || null,
      zip: data.zip?.trim() || null,
    },
  });

  if (result.count === 0) throw new Error('Zákazník nenalezen');

  revalidatePath('/customers');
  revalidatePath(`/customers/${customerId}`);
}

export async function updateCustomerNote(customerId: string, note: string) {
  const context = await getSessionContext();
  assertWriteAccess(context);

  const result = await prisma.customer.updateMany({
    where: { id: customerId, garageId: context.garageId },
    data: { note: note.trim() || null },
  });
  if (result.count === 0) throw new Error('Zákazník nenalezen');

  revalidatePath(`/customers/${customerId}`);
}
