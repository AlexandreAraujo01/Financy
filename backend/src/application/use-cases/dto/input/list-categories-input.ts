import { z } from 'zod';
import { userId } from './user-fields';

export const listCategoriesInputSchema = z.object({ userId });

export type ListCategoriesInput = z.input<typeof listCategoriesInputSchema>;
