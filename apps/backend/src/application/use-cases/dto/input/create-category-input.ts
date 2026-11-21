import { z } from 'zod';
import { categoryName } from './category-fields';
import { userId } from './user-fields';

export const createCategoryInputSchema = z.object({
  userId,
  name: categoryName,
});

export type CreateCategoryInput = z.input<typeof createCategoryInputSchema>;
