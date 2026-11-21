import { z } from 'zod';
import { categoryId, categoryName } from './category-fields';
import { userId } from './user-fields';

export const updateCategoryInputSchema = z.object({
  userId,
  categoryId,
  name: categoryName,
});

export type UpdateCategoryInput = z.input<typeof updateCategoryInputSchema>;
