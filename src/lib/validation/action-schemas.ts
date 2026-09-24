import { z } from 'zod';

const id = z.string().trim().min(1).max(100);

const validDateTimeString = z.string().trim().min(1).max(100).refine(
  (value) => !Number.isNaN(new Date(value).getTime()),
  'Neplatné datum a čas'
);

export const jobIdSchema = id;
export const userIdSchema = id;
export const invoiceIdSchema = id;
export const taskIdSchema = id;

export const jobStatusSchema = z.enum(['WAITING', 'IN_PROGRESS', 'BLOCKED', 'DONE']);

export const jobTimesSchema = z.object({
  jobId: jobIdSchema,
  scheduledStart: validDateTimeString,
  scheduledEnd: validDateTimeString.nullable(),
}).superRefine((value, ctx) => {
  if (value.scheduledEnd) {
    const start = new Date(value.scheduledStart);
    const end = new Date(value.scheduledEnd);
    if (end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scheduledEnd'],
        message: 'Konec nemůže být dřív než začátek',
      });
    }
  }
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Název úkolu je povinný').max(200, 'Název úkolu je příliš dlouhý'),
  dueDate: z.string().trim().max(20).optional(),
  jobId: id.optional(),
}).superRefine((value, ctx) => {
  if (value.dueDate && Number.isNaN(new Date(`${value.dueDate}T23:59:59.999`).getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dueDate'],
      message: 'Neplatný termín úkolu',
    });
  }
});

export const createJobFromQuickInputSchema = z.object({
  customerId: id.nullable(),
  customerName: z.string().trim().max(255),
  customerPhone: z.string().trim().max(50),
  vehicleId: id.nullable(),
  vehicleBrand: z.string().trim().max(100),
  vehicleModel: z.string().trim().max(100),
  vehicleLicensePlate: z.string().trim().max(20).nullable(),
  tasks: z.array(z.string().trim().min(1).max(500)).max(50),
  scheduledStart: validDateTimeString,
  scheduledEnd: validDateTimeString.nullable(),
  assignedUserId: id.nullable().optional(),
}).superRefine((value, ctx) => {
  if (value.scheduledEnd) {
    const start = new Date(value.scheduledStart);
    const end = new Date(value.scheduledEnd);
    if (end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scheduledEnd'],
        message: 'Konec nemůže být dřív než začátek',
      });
    }
  }
});

export const addJobItemSchema = z.object({
  jobId: id,
  title: z.string().trim().min(1).max(255),
  quantity: z.number().finite().positive().max(99999999.99),
  unit: z.string().trim().min(1).max(20),
  unitPrice: z.number().finite().min(0).max(99999999.99),
});

export const customerIdSchema = id;
export const vehicleIdSchema = id;
