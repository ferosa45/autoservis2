'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionContext, assertWriteAccess } from '@/lib/session';

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
