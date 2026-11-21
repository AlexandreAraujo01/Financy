import { z } from 'zod';
import { categoryId } from './category-fields';
import { userId } from './user-fields';

export const deleteCategoryInputSchema = z.object({
  userId,
  categoryId,
});

export type DeleteCategoryInput = z.input<typeof deleteCategoryInputSchema>;
