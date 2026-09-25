'use server';

import { normalizeSearchText, normalizeCompactSearchText } from '@/lib/search-normalize';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionContext, assertWriteAccess } from '@/lib/session';
import { z } from 'zod';
import { customerIdSchema, vehicleIdSchema } from '@/lib/validation/action-schemas';

const vehicleInputSchema = z.object({
  brand: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(100),
  licensePlate: z.string().trim().max(20).optional(),
  year: z.number().int().min(1886).max(new Date().getFullYear() + 1).nullable().optional(),
  mileage: z.number().int().min(0).max(9999999).nullable().optional(),
  note: z.string().max(5000).optional(),
});

export type VehicleActionResult = { success: true; error?: never } | { success: false; error: string };

export async function updateCustomer(customerId: string, data: { name: string; phone: string; email?: string; companyName?: string; ico?: string; dic?: string; street?: string; city?: string; zip?: string }) {
  const validCustomerId = customerIdSchema.parse(customerId);
  const validData = z.object({ name: z.string().trim().min(1).max(255), phone: z.string().trim().min(1).max(50), email: z.string().trim().max(255).optional(), companyName: z.string().trim().max(255).optional(), ico: z.string().trim().max(50).optional(), dic: z.string().trim().max(50).optional(), street: z.string().trim().max(255).optional(), city: z.string().trim().max(255).optional(), zip: z.string().trim().max(30).optional() }).parse(data);
  const context = await getSessionContext();
  assertWriteAccess(context);
  const name = validData.name;
  const phone = validData.phone;
  if (!name) throw new Error('Jméno zákazníka je povinné');
  if (!phone) throw new Error('Telefon zákazníka je povinný');
  const result = await prisma.customer.updateMany({ where: { id: validCustomerId, garageId: context.garageId }, data: {
    name, nameNormalized: normalizeSearchText(name),
    phone, phoneNormalized: normalizeCompactSearchText(phone),
    email: validData.email || null, emailNormalized: validData.email ? normalizeSearchText(validData.email) : null,
    companyName: validData.companyName || null, companyNameNormalized: validData.companyName ? normalizeSearchText(validData.companyName) : null,
    ico: validData.ico || null, icoNormalized: validData.ico ? normalizeCompactSearchText(validData.ico) : null, dic: validData.dic || null, street: validData.street || null,
    city: validData.city || null, zip: validData.zip || null,
  } });
  if (result.count === 0) throw new Error('Zákazník nenalezen');
  revalidatePath('/customers'); revalidatePath(`/customers/${customerId}`);
}

export async function updateCustomerNote(customerId: string, note: string) {
  const validCustomerId = customerIdSchema.parse(customerId);
  const validNote = z.string().max(5000).parse(note);
  const context = await getSessionContext(); assertWriteAccess(context);
  const result = await prisma.customer.updateMany({ where: { id: validCustomerId, garageId: context.garageId }, data: { note: validNote.trim() || null } });
  if (result.count === 0) throw new Error('Zákazník nenalezen');
  revalidatePath(`/customers/${customerId}`);
}

export async function createVehicle(customerId: string, data: { brand: string; model: string; licensePlate?: string; year?: number | null; mileage?: number | null; note?: string }): Promise<VehicleActionResult> {
  try {
    const validCustomerId = customerIdSchema.parse(customerId);
    const validData = vehicleInputSchema.parse(data);
    const context = await getSessionContext();
    if (!context.hasWriteAccess) return { success: false, error: 'Účet je pouze pro čtení. Pro pokračování aktivujte předplatné.' };
    const customer = await prisma.customer.findFirst({ where: { id: validCustomerId, garageId: context.garageId }, select: { id: true } });
    if (!customer) return { success: false, error: 'Zákazník nenalezen' };
    const brand = validData.brand; const model = validData.model;
    if (!brand) return { success: false, error: 'Značka vozidla je povinná' };
    if (!model) return { success: false, error: 'Model vozidla je povinný' };
    await prisma.vehicle.create({ data: {
      brand, brandNormalized: normalizeSearchText(brand),
      model, modelNormalized: normalizeSearchText(model),
      licensePlate: validData.licensePlate || null,
      licensePlateNormalized: validData.licensePlate ? normalizeCompactSearchText(validData.licensePlate) : null,
      year: validData.year ?? null,
      mileage: validData.mileage ?? null,
      note: validData.note?.trim() || null, customerId: validCustomerId, garageId: context.garageId,
    } });
    revalidatePath(`/customers/${customerId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Nepodařilo se uložit vozidlo' };
  }
}

export async function updateVehicle(vehicleId: string, data: { brand: string; model: string; licensePlate?: string; year?: number | null; mileage?: number | null; note?: string }): Promise<VehicleActionResult> {
  try {
    const validVehicleId = vehicleIdSchema.parse(vehicleId);
    const validData = vehicleInputSchema.parse(data);
    const context = await getSessionContext();
    if (!context.hasWriteAccess) return { success: false, error: 'Účet je pouze pro čtení. Pro pokračování aktivujte předplatné.' };
    const brand = validData.brand; const model = validData.model;
    if (!brand) return { success: false, error: 'Značka vozidla je povinná' };
    if (!model) return { success: false, error: 'Model vozidla je povinný' };
    const result = await prisma.vehicle.updateMany({ where: { id: validVehicleId, garageId: context.garageId }, data: {
      brand, brandNormalized: normalizeSearchText(brand),
      model, modelNormalized: normalizeSearchText(model),
      licensePlate: validData.licensePlate || null,
      licensePlateNormalized: validData.licensePlate ? normalizeCompactSearchText(validData.licensePlate) : null,
      year: validData.year ?? null,
      mileage: validData.mileage ?? null,
      note: validData.note?.trim() || null,
    } });
    if (result.count === 0) return { success: false, error: 'Vozidlo nenalezeno' };
    const vehicle = await prisma.vehicle.findFirst({ where: { id: validVehicleId, garageId: context.garageId }, select: { customerId: true } });
    if (vehicle) revalidatePath(`/customers/${vehicle.customerId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Nepodařilo se uložit vozidlo' };
  }
}
