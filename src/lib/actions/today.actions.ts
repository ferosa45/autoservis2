'use server';

import { revalidatePath } from 'next/cache';
import type { JobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSessionContext, assertWriteAccess } from '@/lib/session';
import { MockNotificationService } from '@/lib/notifications/mock-notification-service';

const notificationService = new MockNotificationService();

export async function setJobStatus(jobId: string, status: JobStatus) {
  const context = await getSessionContext();
  assertWriteAccess(context);

  const job = await prisma.job.findFirst({ where: { id: jobId, garageId: context.garageId }, select: { id: true } });
  if (!job) throw new Error('Zakázka nenalezena');

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const activeSession = await tx.workSession.findFirst({
      where: { jobId, garageId: context.garageId, endedAt: null },
      orderBy: { startedAt: 'desc' },
    });

    if (status === 'IN_PROGRESS') {
      if (activeSession && activeSession.userId !== context.userId) {
        await tx.workSession.update({ where: { id: activeSession.id }, data: { endedAt: now } });
      }
      if (!activeSession || activeSession.userId !== context.userId) {
        await tx.workSession.create({
          data: { jobId, userId: context.userId, garageId: context.garageId, startedAt: now },
        });
      }
      await tx.job.update({ where: { id: jobId }, data: { status, assignedUserId: context.userId } });
    } else {
      if (activeSession) {
        await tx.workSession.update({ where: { id: activeSession.id }, data: { endedAt: now } });
      }
      await tx.job.update({
        where: { id: jobId },
        data: { status, ...(status === 'DONE' || status === 'WAITING' ? { assignedUserId: null } : {}) },
      });
    }
  });

  revalidatePath('/today');
  revalidatePath('/calendar');
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath('/workshop');
}

export async function toggleTask(taskId: string, completed: boolean) {
  const context = await getSessionContext();
  assertWriteAccess(context);
  const result = await prisma.task.updateMany({ where: { id: taskId, garageId: context.garageId }, data: { completed } });
  if (result.count === 0) throw new Error('Úkol nenalezen');
  revalidatePath('/today');
}

export async function createTask(input: { title: string; dueDate?: string; jobId?: string }) {
  const context = await getSessionContext();
  assertWriteAccess(context);
  const title = input.title.trim();
  if (!title) throw new Error('Název úkolu je povinný');
  if (title.length > 200) throw new Error('Název úkolu je příliš dlouhý');

  let jobId: string | null = null;
  if (input.jobId) {
    const job = await prisma.job.findFirst({ where: { id: input.jobId, garageId: context.garageId }, select: { id: true } });
    if (!job) throw new Error('Zakázka nenalezena');
    jobId = job.id;
  }

  let dueDate: Date | null = null;
  if (input.dueDate) {
    const parsed = new Date(`${input.dueDate}T23:59:59.999`);
    if (Number.isNaN(parsed.getTime())) throw new Error('Neplatný termín úkolu');
    dueDate = parsed;
  }

  await prisma.task.create({ data: { title, dueDate, jobId, garageId: context.garageId } });
  revalidatePath('/today');
}

export async function sendJobSms(jobId: string) {
  const context = await getSessionContext();
  assertWriteAccess(context);
  const job = await prisma.job.findFirst({ where: { id: jobId, garageId: context.garageId }, include: { customer: true } });
  if (!job) throw new Error('Zakázka nenalezena');
  await notificationService.sendJobNotification({ toPhone: job.customer.phone, customerName: job.customer.name, message: `Vaše zakázka č. ${job.number} je připravena.` });
  revalidatePath('/today');
  revalidatePath(`/jobs/${jobId}`);
}
