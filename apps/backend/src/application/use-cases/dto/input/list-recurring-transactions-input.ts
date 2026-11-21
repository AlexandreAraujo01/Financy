import { z } from 'zod';
import { userId } from './user-fields';

export const listRecurringTransactionsInputSchema = z.object({ userId });

export type ListRecurringTransactionsInput = z.input<typeof listRecurringTransactionsInputSchema>;
