import { z } from 'zod';
import { userId } from './user-fields';

export const listTransactionsInputSchema = z.object({ userId });

export type ListTransactionsInput = z.input<typeof listTransactionsInputSchema>;
