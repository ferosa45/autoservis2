'use server';

import { revalidatePath } from 'next/cache';
import { getSessionContext, assertWriteAccess } from '@/lib/session';
import { RuleBasedQuickJobParser } from '@/lib/parser/rule-based-quick-job-parser';
import { createJobFromQuickInput, type CreateJobFromQuickInput } from '@/lib/services/job.service';
import type { QuickJobParseResult } from '@/lib/parser/quick-job-parser.interface';
import { z } from 'zod';
import { createJobFromQuickInputSchema } from '@/lib/validation/action-schemas';

// POZNÁMKA: parseQuickJobPreview a RuleBasedQuickJobParser už nejsou volané
// z hlavního Quick Job UI (to bylo nahrazeno strukturovaným formulářem
// s autocomplete - parsování volného textu se v praxi ukázalo nespolehlivé).
// Kód necháváme k dispozici - rozhraní QuickJobParser je navržené i pro
// budoucí AIQuickJobParser a může se hodit např. pro volitelné "rychlé
// vložení textem" nebo jinou budoucí funkci.
const parser = new RuleBasedQuickJobParser();

const EMPTY_RESULT: QuickJobParseResult = {
  customer: { existingCustomerId: null, name: null, phone: null },
  vehicle: { existingVehicleId: null, brand: null, model: null, licensePlate: null },
  tasks: [],
  scheduledStart: null,
  unrecognizedText: null,
};

export async function parseQuickJobPreview(input: string): Promise<QuickJobParseResult> {
  const validInput = z.string().trim().max(5000).parse(input);
  const context = await getSessionContext();

  if (!validInput) {
    return EMPTY_RESULT;
  }

  // Parser nikdy nesmí selhat kvůli nerozpoznanému vstupu - kdyby přesto
  // vyhodil neočekávanou chybu, raději vrátíme prázdný návrh než spadneme
  // uprostřed psaní uživatele.
  try {
    return await parser.parse(validInput, { garageId: context.garageId });
  } catch {
    return { ...EMPTY_RESULT, unrecognizedText: validInput };
  }
}

export type SubmitQuickJobResult =
  | { jobId: string; error?: never }
  | { jobId: null; error: string };

export async function submitQuickJob(input: CreateJobFromQuickInput): Promise<SubmitQuickJobResult> {
  const context = await getSessionContext();

  if (!context.hasWriteAccess) {
    return { jobId: null, error: 'READ_ONLY_ACCESS' };
  }

  try {
    assertWriteAccess(context);
    const validInput = createJobFromQuickInputSchema.parse(input);
    const job = await createJobFromQuickInput(context, validInput);

    revalidatePath('/today');
    revalidatePath('/calendar');

    return { jobId: job.id };
  } catch (error) {
    // Never send database/Prisma internals to the client.
    if (error instanceof Error && error.name.startsWith('Prisma')) {
      return {
        jobId: null,
        error: 'Zakázku se nepodařilo vytvořit. Zkuste to prosím znovu.',
      };
    }

    return {
      jobId: null,
      error: error instanceof Error ? error.message : 'Zakázku se nepodařilo vytvořit.',
    };
  }
}
