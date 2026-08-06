import { prisma } from '@/lib/prisma';
import type { SessionContext } from '@/lib/session';

export type CreateJobFromQuickInput = {
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  vehicleId: string | null;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleLicensePlate: string | null;
  tasks: string[];
  scheduledStart: string; // ISO datetime
};

export async function createJobFromQuickInput(
  context: SessionContext,
  input: CreateJobFromQuickInput
) {
  return prisma.$transaction(async (tx) => {
    // --- Zákazník: použij vybraného / dohledaného podle telefonu / vytvoř nového ---
    let customerId = input.customerId;

    if (customerId) {
      const owned = await tx.customer.findFirst({
        where: { id: customerId, garageId: context.garageId },
      });
      if (!owned) throw new Error('Zákazník nepatří do tohoto servisu');
    } else {
      const existingByPhone = input.customerPhone
        ? await tx.customer.findFirst({
            where: { garageId: context.garageId, phone: input.customerPhone },
          })
        : null;

      if (existingByPhone) {
        customerId = existingByPhone.id;
      } else {
        const created = await tx.customer.create({
          data: {
            name: input.customerName.trim() || 'Neznámý zákazník',
            phone: input.customerPhone.trim() || '—',
            garageId: context.garageId,
          },
        });
        customerId = created.id;
      }
    }

    // --- Vozidlo: použij vybrané / dohledej podle SPZ u zákazníka / vytvoř nové ---
    let vehicleId = input.vehicleId;

    if (vehicleId) {
      const owned = await tx.vehicle.findFirst({
        where: { id: vehicleId, garageId: context.garageId },
      });
      if (!owned) throw new Error('Vozidlo nepatří do tohoto servisu');
    } else {
      const normalizedPlate = input.vehicleLicensePlate
        ? input.vehicleLicensePlate.replace(/\s+/g, '').toUpperCase()
        : null;

      const customerVehicles = await tx.vehicle.findMany({
        where: { garageId: context.garageId, customerId },
      });

      let existingVehicle = normalizedPlate
        ? customerVehicles.find(
            (v) => v.licensePlate?.replace(/\s+/g, '').toUpperCase() === normalizedPlate
          )
        : undefined;

      // Bez SPZ (běžné při telefonátu) zkus aspoň shodu značka+model u stejného
      // zákazníka, ať nevznikají zbytečné duplicity - SPZ se doplní později,
      // až auto fyzicky dorazí do servisu.
      if (!existingVehicle && !normalizedPlate) {
        const brand = input.vehicleBrand.trim().toLowerCase();
        const model = input.vehicleModel.trim().toLowerCase();
        if (brand && model) {
          existingVehicle = customerVehicles.find(
            (v) => v.brand.toLowerCase() === brand && v.model.toLowerCase() === model
          );
        }
      }

      if (existingVehicle) {
        vehicleId = existingVehicle.id;
      } else {
        const created = await tx.vehicle.create({
          data: {
            brand: input.vehicleBrand.trim() || 'Neznámá značka',
            model: input.vehicleModel.trim() || 'Neznámý model',
            licensePlate: input.vehicleLicensePlate?.trim() || null,
            customerId,
            garageId: context.garageId,
          },
        });
        vehicleId = created.id;
      }
    }

    // --- Číslo zakázky - jednoduché pořadové číslo v rámci servisu ---
    const jobCount = await tx.job.count({ where: { garageId: context.garageId } });
    const number = String(jobCount + 1);

    const job = await tx.job.create({
      data: {
        number,
        customerId,
        vehicleId,
        scheduledStart: new Date(input.scheduledStart),
        status: 'WAITING',
        customerRequest: input.tasks.join(', ') || 'Bez upřesnění',
        garageId: context.garageId,
      },
    });

    if (input.tasks.length > 0) {
      await tx.jobTask.createMany({
        data: input.tasks.map((title) => ({
          title,
          jobId: job.id,
          garageId: context.garageId,
        })),
      });
    }

    return job;
  });
}
