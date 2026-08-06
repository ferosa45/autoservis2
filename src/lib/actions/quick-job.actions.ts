'use server';

import { revalidatePath } from 'next/cache';
import { getSessionContext } from '@/lib/session';
import { RuleBasedQuickJobParser } from '@/lib/parser/rule-based-quick-job-parser';
import { createJobFromQuickInput, type CreateJobFromQuickInput } from '@/lib/services/job.service';
import type { QuickJobParseResult } from '@/lib/parser/quick-job-parser.interface';

const parser = new RuleBasedQuickJobParser();

const EMPTY_RESULT: QuickJobParseResult = {
  customer: { existingCustomerId: null, name: null, phone: null },
  vehicle: { existingVehicleId: null, brand: null, model: null, licensePlate: null },
  tasks: [],
  scheduledStart: null,
  unrecognizedText: null,
};

export async function parseQuickJobPreview(input: string): Promise<QuickJobParseResult> {
  const context = await getSessionContext();

  if (!input.trim()) {
    return EMPTY_RESULT;
  }

  // Parser nikdy nesmí selhat kvůli nerozpoznanému vstupu - kdyby přesto
  // vyhodil neočekávanou chybu, raději vrátíme prázdný návrh než spadneme
  // uprostřed psaní uživatele.
  try {
    return await parser.parse(input, { garageId: context.garageId });
  } catch {
    return { ...EMPTY_RESULT, unrecognizedText: input };
  }
}

export async function submitQuickJob(input: CreateJobFromQuickInput): Promise<{ jobId: string }> {
  const context = await getSessionContext();
  const job = await createJobFromQuickInput(context, input);

  revalidatePath('/today');
  revalidatePath('/calendar');

  return { jobId: job.id };
}
