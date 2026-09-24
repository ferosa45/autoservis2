'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionContext, assertWriteAccess } from '@/lib/session';
import { z } from 'zod';
import { addJobItemSchema, jobIdSchema, jobTimesSchema, taskIdSchema } from '@/lib/validation/action-schemas';

async function assertJobOwnership(jobId: string, garageId: string) {
  const job = await prisma.job.findFirst({ where: { id: jobId, garageId } });
  if (!job) throw new Error('Zakázka nenalezena');
}

// --- Práce (JobTask checklist) ---

export async function addJobTask(jobId: string, title: string) {
  const context = await getSessionContext();
  const validJobId = jobIdSchema.parse(jobId);
  assertWriteAccess(context);
  await assertJobOwnership(validJobId, context.garageId);

  const trimmed = z.string().trim().min(1).max(500).parse(title);
  if (!trimmed) return;

  await prisma.jobTask.create({
    data: { title: trimmed, jobId, garageId: context.garageId },
  });
  revalidatePath(`/jobs/${valid.jobId}`);
}

export async function toggleJobTask(taskId: string, completed: boolean, jobId: string) {
  const context = await getSessionContext();
  const validTaskId = taskIdSchema.parse(taskId);
  const validJobId = jobIdSchema.parse(jobId);
  const validCompleted = z.boolean().parse(completed);
  assertWriteAccess(context);

  const result = await prisma.jobTask.updateMany({
    where: { id: validTaskId, garageId: context.garageId },
    data: { completed: validCompleted },
  });
  if (result.count === 0) throw new Error('Úkon nenalezen');

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath('/workshop');
}

export async function removeJobTask(taskId: string, jobId: string) {
  const context = await getSessionContext();
  const validTaskId = taskIdSchema.parse(taskId);
  const validJobId = jobIdSchema.parse(jobId);
  assertWriteAccess(context);

  await prisma.jobTask.deleteMany({
    where: { id: validTaskId, garageId: context.garageId },
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
  const validInput = addJobItemSchema.parse({ jobId, ...input });
  const context = await getSessionContext();
  assertWriteAccess(context);
  await assertJobOwnership(validInput.jobId, context.garageId);

  const title = validInput.title;
  if (!title) return;

  await prisma.jobItem.create({
    data: {
      title,
      quantity: validInput.quantity,
      unit: validInput.unit,
      unitPrice: context.permissions.canViewFinancials ? validInput.unitPrice : 0,
      jobId: validInput.jobId,
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
    where: { id: valid.jobId, garageId: context.garageId },
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
  const valid = jobTimesSchema.parse({ jobId, scheduledStart, scheduledEnd });
  const context = await getSessionContext();
  assertWriteAccess(context);

  const start = new Date(valid.scheduledStart);
  const end = valid.scheduledEnd ? new Date(valid.scheduledEnd) : null;

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
