import { z } from 'zod';
import { RECURRING_DAY_TYPES } from '@/domain/entities/props/recurring-transaction/recurring-transaction';

export const recurringTransactionId = z.uuid();
export const dayOfMonth = z.number().int().min(1).max(31);
export const dayType = z.enum(RECURRING_DAY_TYPES);

// Também usado na edição depois de combinar campos enviados com os já salvos.
export const recurringScheduleSchema = z.object({
  dayOfMonth,
  dayType,
}).refine(data => data.dayType !== 'business_day' || data.dayOfMonth <= 23, {
  path: ['dayOfMonth'],
  message: 'Escolha um dia útil entre 1 e 23',
});
