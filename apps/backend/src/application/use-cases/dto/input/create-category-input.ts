import { z } from 'zod';
import { categoryColor, categoryDescription, categoryIcon, categoryName } from './category-fields';
import { userId } from './user-fields';

export const createCategoryInputSchema = z.object({
  userId,
  name: categoryName,
  description: categoryDescription,
  icon: categoryIcon,
  color: categoryColor,
});

export type CreateCategoryInput = z.input<typeof createCategoryInputSchema>;
