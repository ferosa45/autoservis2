'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionContext, assertWriteAccess } from '@/lib/session';

export type VehicleActionResult = { success: true; error?: never } | { success: false; error: string };

export async function updateCustomer(customerId: string, data: { name: string; phone: string; email?: string; companyName?: string; ico?: string; dic?: string; street?: string; city?: string; zip?: string }) {
  const context = await getSessionContext();
  assertWriteAccess(context);
  const name = data.name.trim();
  const phone = data.phone.trim();
  if (!name) throw new Error('Jméno zákazníka je povinné');
  if (!phone) throw new Error('Telefon zákazníka je povinný');
  const result = await prisma.customer.updateMany({ where: { id: customerId, garageId: context.garageId }, data: {
    name, phone, email: data.email?.trim() || null, companyName: data.companyName?.trim() || null,
    ico: data.ico?.trim() || null, dic: data.dic?.trim() || null, street: data.street?.trim() || null,
    city: data.city?.trim() || null, zip: data.zip?.trim() || null,
  } });
  if (result.count === 0) throw new Error('Zákazník nenalezen');
  revalidatePath('/customers'); revalidatePath(`/customers/${customerId}`);
}

export async function updateCustomerNote(customerId: string, note: string) {
  const context = await getSessionContext(); assertWriteAccess(context);
  const result = await prisma.customer.updateMany({ where: { id: customerId, garageId: context.garageId }, data: { note: note.trim() || null } });
  if (result.count === 0) throw new Error('Zákazník nenalezen');
  revalidatePath(`/customers/${customerId}`);
}

export async function createVehicle(customerId: string, data: { brand: string; model: string; licensePlate?: string; year?: number | null; mileage?: number | null; note?: string }): Promise<VehicleActionResult> {
  try {
    const context = await getSessionContext();
    if (!context.hasWriteAccess) return { success: false, error: 'Účet je pouze pro čtení. Pro pokračování aktivujte předplatné.' };
    const customer = await prisma.customer.findFirst({ where: { id: customerId, garageId: context.garageId }, select: { id: true } });
    if (!customer) return { success: false, error: 'Zákazník nenalezen' };
    const brand = data.brand.trim(); const model = data.model.trim();
    if (!brand) return { success: false, error: 'Značka vozidla je povinná' };
    if (!model) return { success: false, error: 'Model vozidla je povinný' };
    await prisma.vehicle.create({ data: {
      brand, model, licensePlate: data.licensePlate?.trim() || null,
      year: data.year && data.year > 0 ? data.year : null,
      mileage: data.mileage != null && data.mileage >= 0 ? data.mileage : null,
      note: data.note?.trim() || null, customerId, garageId: context.garageId,
    } });
    revalidatePath(`/customers/${customerId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Nepodařilo se uložit vozidlo' };
  }
}

export async function updateVehicle(vehicleId: string, data: { brand: string; model: string; licensePlate?: string; year?: number | null; mileage?: number | null; note?: string }): Promise<VehicleActionResult> {
  try {
    const context = await getSessionContext();
    if (!context.hasWriteAccess) return { success: false, error: 'Účet je pouze pro čtení. Pro pokračování aktivujte předplatné.' };
    const brand = data.brand.trim(); const model = data.model.trim();
    if (!brand) return { success: false, error: 'Značka vozidla je povinná' };
    if (!model) return { success: false, error: 'Model vozidla je povinný' };
    const result = await prisma.vehicle.updateMany({ where: { id: vehicleId, garageId: context.garageId }, data: {
      brand, model, licensePlate: data.licensePlate?.trim() || null,
      year: data.year && data.year > 0 ? data.year : null,
      mileage: data.mileage != null && data.mileage >= 0 ? data.mileage : null,
      note: data.note?.trim() || null,
    } });
    if (result.count === 0) return { success: false, error: 'Vozidlo nenalezeno' };
    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, garageId: context.garageId }, select: { customerId: true } });
    if (vehicle) revalidatePath(`/customers/${vehicle.customerId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Nepodařilo se uložit vozidlo' };
  }
}
