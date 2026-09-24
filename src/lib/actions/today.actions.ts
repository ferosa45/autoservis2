'use server';

import { revalidatePath } from 'next/cache';
import type { JobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSessionContext, requireOwner, assertWriteAccess } from '@/lib/session';
import { MockNotificationService } from '@/lib/notifications/mock-notification-service';
import { z } from 'zod';
import { createTaskSchema, jobIdSchema, jobStatusSchema, taskIdSchema } from '@/lib/validation/action-schemas';

const notificationService = new MockNotificationService();

type SetJobStatusResult =
  | { success: true; error?: never }
  | { success: false; error: 'READ_ONLY_ACCESS' };

export async function setJobStatus(jobId: string, status: JobStatus): Promise<SetJobStatusResult> {
  const validJobId = jobIdSchema.parse(jobId);
  const validStatus = jobStatusSchema.parse(status);
  const context = await getSessionContext();
  if (!context.hasWriteAccess) {
    return { success: false, error: 'READ_ONLY_ACCESS' };
  }
  assertWriteAccess(context);

  const job = await prisma.job.findFirst({ where: { id: validJobId, garageId: context.garageId }, select: { id: true, status: true } });
  if (!job) throw new Error('Zakázka nenalezena');

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const activeSession = await tx.workSession.findFirst({
      where: { jobId: validJobId, garageId: context.garageId, endedAt: null },
      orderBy: { startedAt: 'desc' },
    });

    if (validStatus === 'IN_PROGRESS') {
      const switchingMechanic = Boolean(activeSession && activeSession.userId !== context.userId);
      if (activeSession && activeSession.userId !== context.userId) {
        await tx.workSession.update({ where: { id: activeSession.id }, data: { endedAt: now } });
      }
      if (!activeSession || activeSession.userId !== context.userId) {
        await tx.workSession.create({
          data: { jobId: validJobId, userId: context.userId, garageId: context.garageId, startedAt: now },
        });
      }
      await tx.job.update({ where: { id: validJobId }, data: { status: validStatus, assignedUserId: context.userId } });

      if (job.status !== 'IN_PROGRESS' || switchingMechanic) {
        await tx.jobEvent.create({
          data: {
            type: job.status === 'BLOCKED' || switchingMechanic ? 'WORK_RESUMED' : 'WORK_STARTED',
            message: switchingMechanic || job.status === 'BLOCKED' ? 'Pokračuje v práci' : 'Zahájena práce',
            jobId: validJobId,
            userId: context.userId,
            garageId: context.garageId,
            createdAt: now,
          },
        });
      }
    } else {
      if (activeSession) {
        await tx.workSession.update({ where: { id: activeSession.id }, data: { endedAt: now } });
      }
      await tx.job.update({
        where: { id: validJobId },
        data: { status: validStatus },
      });

      if (validStatus === 'BLOCKED') {
        await tx.jobEvent.create({
          data: {
            type: 'WAITING_FOR_PART',
            message: 'Práce přerušena – čeká se na díl / zákazníka',
            jobId,
            userId: context.userId,
            garageId: context.garageId,
            createdAt: now,
          },
        });
      } else if (validStatus === 'DONE') {
        await tx.jobEvent.create({
          data: {
            type: 'COMPLETED',
            message: 'Zakázka dokončena',
            jobId,
            userId: context.userId,
            garageId: context.garageId,
            createdAt: now,
          },
        });
      }
    }
  });

  revalidatePath('/today');
  revalidatePath('/calendar');
  revalidatePath(`/jobs/${validJobId}`);
  revalidatePath('/workshop');

  return { success: true };
}

export async function assignMechanic(jobId: string, userId: string | null) {
  const validJobId = jobIdSchema.parse(jobId);
  const validUserId = userId === null ? null : z.string().trim().min(1).max(100).parse(userId);
  const context = await getSessionContext();
  assertWriteAccess(context);
  requireOwner(context);

  const job = await prisma.job.findFirst({
    where: { id: validJobId, garageId: context.garageId },
    select: { id: true },
  });
  if (!job) throw new Error('Zakázka nenalezena.');

  if (validUserId) {
    const mechanic = await prisma.user.findFirst({
      where: { id: validUserId, garageId: context.garageId, role: 'MECHANIC', active: true },
      select: { id: true },
    });
    if (!mechanic) throw new Error('Vybraný mechanik není aktivní nebo nepatří do tohoto servisu.');
  }

  await prisma.job.update({
    where: { id: job.id },
    data: { assignedUserId: validUserId },
  });

  revalidatePath('/today');
  revalidatePath('/calendar');
  revalidatePath(`/jobs/${validJobId}`);
  revalidatePath('/jobs');
}

export async function toggleTask(taskId: string, completed: boolean) {
  const validTaskId = taskIdSchema.parse(taskId);
  const validCompleted = z.boolean().parse(completed);
  const context = await getSessionContext();
  assertWriteAccess(context);
  const result = await prisma.task.updateMany({ where: { id: validTaskId, garageId: context.garageId }, data: { completed: validCompleted } });
  if (result.count === 0) throw new Error('Úkol nenalezen');
  revalidatePath('/today');
}

export async function createTask(input: { title: string; dueDate?: string; jobId?: string }) {
  const valid = createTaskSchema.parse(input);
  const context = await getSessionContext();
  assertWriteAccess(context);
  const title = valid.title;
  if (!title) throw new Error('Název úkolu je povinný');
  if (title.length > 200) throw new Error('Název úkolu je příliš dlouhý');

  let jobId: string | null = null;
  if (valid.jobId) {
    const job = await prisma.job.findFirst({ where: { id: valid.jobId, garageId: context.garageId }, select: { id: true } });
    if (!job) throw new Error('Zakázka nenalezena');
    jobId = job.id;
  }

  let dueDate: Date | null = null;
  if (valid.dueDate) {
    const parsed = new Date(`${valid.dueDate}T23:59:59.999`);
    if (Number.isNaN(parsed.getTime())) throw new Error('Neplatný termín úkolu');
    dueDate = parsed;
  }

  await prisma.task.create({ data: { title, dueDate, jobId, garageId: context.garageId } });
  revalidatePath('/today');
}

export async function sendJobSms(jobId: string) {
  const validJobId = jobIdSchema.parse(jobId);
  const context = await getSessionContext();
  assertWriteAccess(context);
  const job = await prisma.job.findFirst({ where: { id: validJobId, garageId: context.garageId }, include: { customer: true } });
  if (!job) throw new Error('Zakázka nenalezena');
  await notificationService.sendJobNotification({ toPhone: job.customer.phone, customerName: job.customer.name, message: `Vaše zakázka č. ${job.number} je připravena.` });
  revalidatePath('/today');
  revalidatePath(`/jobs/${validJobId}`);
}
