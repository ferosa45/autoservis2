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

  // updateMany s garageId ve where zaručí, že nejde změnit cizí zakázku,
  // i kdyby si klient vynutil cizí jobId.
  const result = await prisma.job.updateMany({
    where: { id: jobId, garageId: context.garageId },
    data: { status },
  });

  if (result.count === 0) {
    throw new Error('Zakázka nenalezena');
  }

  revalidatePath('/today');
  revalidatePath('/calendar');
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath('/workshop');
}

export async function toggleTask(taskId: string, completed: boolean) {
  const context = await getSessionContext();
  assertWriteAccess(context);

  const result = await prisma.task.updateMany({
    where: { id: taskId, garageId: context.garageId },
    data: { completed },
  });

  if (result.count === 0) {
    throw new Error('Úkol nenalezen');
  }

  revalidatePath('/today');
}

export async function sendJobSms(jobId: string) {
  const context = await getSessionContext();
  assertWriteAccess(context);

  const job = await prisma.job.findFirst({
    where: { id: jobId, garageId: context.garageId },
    include: { customer: true },
  });

  if (!job) {
    throw new Error('Zakázka nenalezena');
  }

  await notificationService.sendJobNotification({
    toPhone: job.customer.phone,
    customerName: job.customer.name,
    message: `Vaše zakázka č. ${job.number} je připravena.`,
  });

  revalidatePath('/today');
  revalidatePath(`/jobs/${jobId}`);
}
