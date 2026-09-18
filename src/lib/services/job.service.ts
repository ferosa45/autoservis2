import type { JobStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { SessionContext } from '@/lib/session';

type JobListItem = Prisma.JobGetPayload<{
  include: {
    customer: true;
    vehicle: true;
    assignedUser: { select: { id: true; name: true; active: true } };
  };
}>;

export type JobListFilters = {
  query?: string;
  status?: JobStatus;
  page?: number;
  pageSize?: number;
};

export async function listJobs(context: SessionContext, filters: JobListFilters = {}) {
  const q = filters.query?.trim();
  const pageSize = Math.min(Math.max(filters.pageSize ?? 20, 1), 100);
  const page = Math.max(filters.page ?? 1, 1);

  const where: Prisma.JobWhereInput = {
    garageId: context.garageId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(q
      ? {
          OR: [
            { number: { contains: q, mode: 'insensitive' } },
            { customerRequest: { contains: q, mode: 'insensitive' } },
            { customer: { name: { contains: q, mode: 'insensitive' } } },
            { vehicle: { licensePlate: { contains: q, mode: 'insensitive' } } },
            { vehicle: { brand: { contains: q, mode: 'insensitive' } } },
            { vehicle: { model: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        customer: true,
        vehicle: true,
        assignedUser: { select: { id: true, name: true, active: true } },
      },
      orderBy: { scheduledStart: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }) as unknown as Promise<JobListItem[]>,
    prisma.job.count({ where }),
  ]);

  return {
    jobs,
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

export type CreateJobFromQuickInput = {
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  vehicleId: string | null;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleLicensePlate: string | null;
  tasks: string[];
  scheduledStart: string;
  scheduledEnd: string | null;
  assignedUserId?: string | null;
};

export async function createJobFromQuickInput(
  context: SessionContext,
  input: CreateJobFromQuickInput
) {
  return prisma.$transaction(async (tx) => {
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

    if (!customerId) {
      throw new Error('Nepodařilo se určit zákazníka.');
    }

    let vehicleId = input.vehicleId;

    if (vehicleId) {
      const owned = await tx.vehicle.findFirst({
        where: { id: vehicleId, garageId: context.garageId, customerId },
      });
      if (!owned) throw new Error('Vozidlo nepatří tomuto zákazníkovi');
    } else {
      const customerVehicles = await tx.vehicle.findMany({
        where: { garageId: context.garageId, customerId },
      });

      const normalizedPlate = input.vehicleLicensePlate
        ? input.vehicleLicensePlate.replace(/\s+/g, '').toUpperCase()
        : null;

      let existingVehicle = normalizedPlate
        ? customerVehicles.find(
            (v) => v.licensePlate?.replace(/\s+/g, '').toUpperCase() === normalizedPlate
          )
        : undefined;

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
      } else if (input.vehicleBrand.trim() && input.vehicleModel.trim()) {
        const created = await tx.vehicle.create({
          data: {
            brand: input.vehicleBrand.trim(),
            model: input.vehicleModel.trim(),
            licensePlate: input.vehicleLicensePlate?.trim() || null,
            customerId,
            garageId: context.garageId,
          },
        });
        vehicleId = created.id;
      } else if (customerVehicles.length === 1) {
        const onlyVehicle = customerVehicles[0];
        if (!onlyVehicle) {
          throw new Error('Vyberte vozidlo nebo zadejte nové vozidlo.');
        }
        vehicleId = onlyVehicle.id;
      } else if (customerVehicles.length > 1) {
        throw new Error('Tento zákazník má více vozidel. Vyberte prosím konkrétní vozidlo nebo zadejte nové vozidlo.');
      } else {
        throw new Error('Zadejte značku a model vozidla.');
      }
    }

    if (!vehicleId) {
      throw new Error('Vyberte vozidlo nebo zadejte nové vozidlo.');
    }

    let assignedUserId: string | null = null;
    if (input.assignedUserId) {
      if (context.role !== 'OWNER') {
        throw new Error('Mechanika může přiřadit pouze majitel servisu.');
      }
      const mechanic = await tx.user.findFirst({
        where: {
          id: input.assignedUserId,
          garageId: context.garageId,
          role: 'MECHANIC',
          active: true,
        },
        select: { id: true },
      });
      if (!mechanic) throw new Error('Vybraný mechanik není aktivní nebo nepatří do tohoto servisu.');
      assignedUserId = mechanic.id;
    }

    const jobCount = await tx.job.count({ where: { garageId: context.garageId } });
    const number = String(jobCount + 1);

    const job = await tx.job.create({
      data: {
        number,
        customerId,
        vehicleId,
        scheduledStart: new Date(input.scheduledStart),
        scheduledEnd: input.scheduledEnd ? new Date(input.scheduledEnd) : null,
        status: 'WAITING',
        assignedUserId,
        customerRequest: input.tasks.join(', ') || 'Bez upřesnění',
        garageId: context.garageId,
      },
    });

    await tx.jobEvent.create({
      data: {
        type: 'CREATED',
        message: assignedUserId ? 'Zakázka vytvořena a přiřazena mechanikovi' : 'Zakázka vytvořena',
        jobId: job.id,
        garageId: context.garageId,
        createdAt: job.createdAt,
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
  }, {
    timeout: 15000,
    maxWait: 10000,
  });
}
