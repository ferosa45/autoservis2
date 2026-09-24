'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionContext, assertWriteAccess, requirePermission } from '@/lib/session';

async function assertJobOwnership(jobId: string, garageId: string) {
  const job = await prisma.job.findFirst({ where: { id: jobId, garageId } });
  if (!job) throw new Error('Zakázka nenalezena');
}

// --- Práce (JobTask checklist) ---

export async function addJobTask(jobId: string, title: string) {
  const context = await getSessionContext();
  assertWriteAccess(context);
  await assertJobOwnership(jobId, context.garageId);

  const trimmed = title.trim();
  if (!trimmed) return;

  await prisma.jobTask.create({
    data: { title: trimmed, jobId, garageId: context.garageId },
  });
  revalidatePath(`/jobs/${jobId}`);
}

export async function toggleJobTask(taskId: string, completed: boolean, jobId: string) {
  const context = await getSessionContext();
  assertWriteAccess(context);

  const result = await prisma.jobTask.updateMany({
    where: { id: taskId, garageId: context.garageId },
    data: { completed },
  });
  if (result.count === 0) throw new Error('Úkon nenalezen');

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath('/workshop');
}

export async function removeJobTask(taskId: string, jobId: string) {
  const context = await getSessionContext();
  assertWriteAccess(context);

  await prisma.jobTask.deleteMany({
    where: { id: taskId, garageId: context.garageId },
  });
  revalidatePath(`/jobs/${jobId}`);
}

// --- Práce a díly (JobItem) ---

export type AddJobItemInput = {
  title: string;
  quantity: number;
  unit: string;
  unitPrice: number;
};

export async function addJobItem(jobId: string, input: AddJobItemInput) {
  const context = await getSessionContext();
  assertWriteAccess(context);
  await assertJobOwnership(jobId, context.garageId);

  const title = input.title.trim();
  if (!title) return;

  await prisma.jobItem.create({
    data: {
      title,
      quantity: input.quantity > 0 ? input.quantity : 1,
      unit: input.unit.trim() || 'ks',
      unitPrice: context.permissions.canViewFinancials ? (input.unitPrice >= 0 ? input.unitPrice : 0) : 0,
      jobId,
      garageId: context.garageId,
    },
  });
  revalidatePath(`/jobs/${jobId}`);
}

export async function removeJobItem(itemId: string, jobId: string) {
  const context = await getSessionContext();
  assertWriteAccess(context);

  await prisma.jobItem.deleteMany({
    where: { id: itemId, garageId: context.garageId },
  });
  revalidatePath(`/jobs/${jobId}`);
}

// --- Poznámka ---

export async function updateJobNote(jobId: string, note: string) {
  const context = await getSessionContext();
  assertWriteAccess(context);

  const result = await prisma.job.updateMany({
    where: { id: jobId, garageId: context.garageId },
    data: { note: note.trim() || null },
  });
  if (result.count === 0) throw new Error('Zakázka nenalezena');

  revalidatePath(`/jobs/${jobId}`);
}

// --- Čas zakázky ---

export async function updateJobTimes(
  jobId: string,
  scheduledStart: string,
  scheduledEnd: string | null
) {
  const context = await getSessionContext();
  assertWriteAccess(context);

  const start = new Date(scheduledStart);
  const end = scheduledEnd ? new Date(scheduledEnd) : null;

  if (end && end < start) {
    throw new Error('Konec nemůže být dřív než začátek');
  }

  const result = await prisma.job.updateMany({
    where: { id: jobId, garageId: context.garageId },
    data: { scheduledStart: start, scheduledEnd: end },
  });
  if (result.count === 0) throw new Error('Zakázka nenalezena');

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath('/today');
  revalidatePath('/calendar');
}
